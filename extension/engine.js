/** Explainable warning signs, not a classifier or a probability of phishing. */
export function analyzePage(input, now = Date.now()) {
  const page = new URL(input.url);
  if (!['http:', 'https:'].includes(page.protocol)) throw new Error('Only HTTP and HTTPS pages can be checked.');
  const signals = [];
  const add = (id, title, detail, severity, weight) => signals.push({ id, title, detail, severity, weight });
  const host = page.hostname;
  const data = input.page || {};
  if (page.protocol === 'http:') {
    add('http', 'Connection is not encrypted', 'This page uses HTTP. Information sent here may be read or changed in transit.', 'medium', 20);
  }
  if (page.protocol === 'http:' && data.passwordCount > 0) {
    add('password-http', 'Password field on an unencrypted page', 'Do not enter a password here. The page itself is delivered without HTTPS.', 'high', 65);
  }
  if (data.insecurePasswordForms > 0) {
    add('password-destination-http', 'Password form sends to HTTP', 'A password form has an unencrypted submission destination. Verify the site before entering anything.', 'high', 65);
  }
  if (data.crossOriginPasswordForms > 0) {
    add('password-destination-other', 'Password form sends to another origin', 'A password form submits to a different web origin. This can be legitimate, but the destination deserves a closer look.', 'medium', 40);
  }
  if (data.nonWebPasswordForms > 0) {
    add('password-destination-unusual', 'Password form has an unusual destination', 'A password form uses a destination other than HTTP or HTTPS. The check cannot determine how it handles your password.', 'medium', 30);
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) {
    add('ip-host', 'Address uses an IP instead of a domain', 'An IP address is harder to associate with an organization. Local devices and development tools often use one legitimately.', 'medium', 20);
  }
  if (page.username || page.password) {
    add('url-credentials', 'Address contains user information', 'Text before an @ sign can make an address look like it belongs to a different site. Read the actual hostname shown above.', 'medium', 35);
  }
  if (host.split('.').some(label => label.startsWith('xn--'))) {
    add('international-domain', 'Internationalized domain name', 'The hostname uses punycode. These names can be legitimate; check carefully for characters that resemble a familiar brand.', 'medium', 20);
  }
  if (data.mismatchedLinks > 0) {
    add('mismatched-links', 'A displayed link names a different host', 'At least one link that looks like a web address points to a different hostname. Redirect and tracking services can also cause this.', 'medium', 35);
  }
  if (input.url.length >= 180) {
    add('long-url', 'Unusually long address', 'Long addresses may obscure their destination. This is a weak signal and is common in legitimate searches and sign-in flows.', 'low', 10);
  }
  if (!host.startsWith('[') && host.split('.').length > 5) {
    add('deep-host', 'Many parts in the hostname', 'A long chain of hostname labels can obscure the actual site. Read the address from right to left.', 'low', 10);
  }
  const score = Math.min(100, signals.reduce((sum, signal) => sum + signal.weight, 0));
  signals.sort((a, b) => b.weight - a.weight);
  return {
    // Deliberately exclude path, query, fragment, and URL credentials from the result.
    url: page.origin,
    hostname: host,
    level: score >= 60 ? 'high' : score >= 20 ? 'medium' : 'low',
    score,
    signals: signals.map(({ weight: _weight, ...signal }) => signal),
    checkedAt: now,
    coverage: {
      pageReadable: input.page !== null && input.page !== undefined,
      formCount: data.formCount ?? 0,
      linksChecked: data.linksChecked ?? 0,
      linksTruncated: Boolean(data.linksTruncated),
      formScanTruncated: Boolean(data.formScanTruncated),
      embeddedFrames: data.embeddedFrames ?? 0,
      limitation: 'Snapshot of the top-level page only. Embedded frames, closed shadow roots, scripts and reputation lists are not inspected.'
    }
  };
}

/** Serialized by chrome.scripting.executeScript. Keep this function self-contained. */
export function collectPageSignals() {
  const base = location.href;
  const origin = location.origin;
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  const passwords = Array.prototype.slice.call(passwordInputs, 0, 200);
  const forms = new Set(passwords.map(input => input.form).filter(Boolean));
  // Submit controls can sit outside a form and associate through a `form` ID.
  // Only enabled submit buttons (or image inputs) can override its destination.
  const overridesByForm = new Map([...forms].map(form => [form, []]));
  const overrideCounts = new Map([...forms].map(form => [form, 0]));
  for (const control of document.querySelectorAll('button[formaction], input[formaction]')) {
    const form = control.form;
    if (!forms.has(form) || control.matches(':disabled')) continue;
    const isSubmit = control.tagName === 'BUTTON'
      ? control.type === 'submit'
      : control.type === 'submit' || control.type === 'image';
    if (!isSubmit) continue;
    overrideCounts.set(form, overrideCounts.get(form) + 1);
    const overrides = overridesByForm.get(form);
    if (overrides.length < 100) overrides.push(control);
  }
  let insecurePasswordForms = 0;
  let crossOriginPasswordForms = 0;
  let nonWebPasswordForms = 0;
  const inspectDestination = value => {
    try {
      const target = new URL(value || base, document.baseURI);
      if (target.protocol === 'http:') insecurePasswordForms++;
      if (!['http:', 'https:'].includes(target.protocol)) nonWebPasswordForms++;
      else if (target.origin !== origin) crossOriginPasswordForms++;
    } catch { nonWebPasswordForms++; }
  };
  for (const form of forms) {
    inspectDestination(form.getAttribute('action'));
    // Each override is independent: a malformed destination must not stop
    // inspection of the remaining ways to submit this form.
    for (const control of overridesByForm.get(form)) {
      inspectDestination(control.getAttribute('formaction'));
    }
  }
  const anchors = document.querySelectorAll('a[href]');
  let mismatchedLinks = 0;
  let linksChecked = 0;
  for (const anchor of Array.from(anchors).slice(0, 500)) {
    linksChecked++;
    const label = (anchor.textContent || '').trim().slice(0, 512);
    if (!/^(https?:\/\/|www\.)\S+$/i.test(label)) continue;
    try {
      const shown = new URL(/^www\./i.test(label) ? `https://${label}` : label);
      const target = new URL(anchor.getAttribute('href'), document.baseURI);
      const normalize = hostname => hostname.toLowerCase().replace(/^www\./, '');
      if (['http:', 'https:'].includes(target.protocol) && normalize(shown.hostname) !== normalize(target.hostname)) mismatchedLinks++;
    } catch { /* Unparseable labels do not become evidence. */ }
  }
  return {
    url: base,
    page: {
      passwordCount: passwords.length,
      formCount: document.forms.length,
      insecurePasswordForms,
      crossOriginPasswordForms,
      nonWebPasswordForms,
      mismatchedLinks,
      linksChecked,
      linksTruncated: anchors.length > 500,
      formScanTruncated: passwordInputs.length > 200 || [...overrideCounts.values()].some(count => count > 100),
      embeddedFrames: document.querySelectorAll('iframe, frame').length
    }
  };
}
