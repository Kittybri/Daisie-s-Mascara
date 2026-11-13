const ui = Object.fromEntries([
  'settings-button','privacy-button','dataset-button','synthid-button','status-card','status-eyebrow','status-heading',
  'status-description','domain-label','familiar-note','error-message','scan-button',
  'scan-button-label','scan-meta','coverage-note','findings-section','signal-count','signals-list',
  'empty-findings','trust-button','trust-feedback','intro-section',
].map(id => [id, document.getElementById(id)]));

let latestResult = null;
let isFamiliar = false;
let busy = false;
let statusGeneration = 0;
let statusTimer;
let automaticEnabled = true;

const summaries = {
  low: ['No strong warning signs', 'The available checks did not find strong warning signs. This does not establish that the site is trustworthy.'],
  medium: ['Review suggested', 'Some details deserve a closer look. Check the address and verify unexpected requests before continuing.'],
  high: ['High concern', 'Warning signs need your attention. Pause before entering passwords, payment details, or other sensitive information.'],
};

function setError(message = '') {
  ui['error-message'].textContent = message;
  ui['error-message'].hidden = !message;
}

function setBusy(value) {
  busy = value;
  ui['scan-button'].disabled = value;
  ui['trust-button'].disabled = value;
  ui['scan-button-label'].textContent = value ? 'Checking this page…' : 'Scan again';
  ui['scan-button'].setAttribute('aria-busy', String(value));
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'just now' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function updateFamiliar() {
  ui['familiar-note'].hidden = !isFamiliar;
  ui['trust-button'].textContent = isFamiliar ? 'Remove familiar marker' : 'Mark domain as familiar';
}

function updateMode(response) {
  if (typeof response?.autoEnabled === 'boolean') automaticEnabled = response.autoEnabled;
  ui['status-eyebrow'].textContent = automaticEnabled ? 'AUTOMATIC PAGE CHECK' : 'PAGE CHECK · AUTO OFF';
  document.getElementById('intro-heading').textContent = automaticEnabled ? 'Checks on every page load.' : 'Automatic checks are off.';
  const introLines = ui['intro-section'].querySelectorAll('.intro-row p');
  introLines[0].textContent = automaticEnabled ? 'Reviews the address and page structure locally.' : 'Use Scan again to review this page locally.';
  introLines[1].textContent = automaticEnabled ? 'Explains warning signs. Use Scan again after the page changes.' : 'Enable automatic page checks in Settings to check pages when they load.';
}

function renderCoverage(coverage) {
  const note = ui['coverage-note'];
  if (!coverage || typeof coverage !== 'object') {
    note.hidden = true;
    note.textContent = '';
    return false;
  }
  const statements = [];
  if (coverage.pageReadable === false) statements.push('Address-only check. Page structure was unavailable.');
  else if (Number.isInteger(coverage.linksChecked) && coverage.linksChecked >= 0) {
    statements.push(`Top-level snapshot · ${coverage.linksChecked} ${coverage.linksChecked === 1 ? 'link' : 'links'} checked.`);
  } else statements.push('Top-level page snapshot.');
  if (coverage.linksTruncated) statements.push('More links were not checked.');
  if (coverage.formScanTruncated) statements.push('Some password fields or submit controls were not checked.');
  if (Number.isInteger(coverage.embeddedFrames) && coverage.embeddedFrames > 0) {
    statements.push(`${coverage.embeddedFrames} embedded ${coverage.embeddedFrames === 1 ? 'frame was' : 'frames were'} not checked.`);
  }
  const truncated = coverage.pageReadable === false || Boolean(coverage.linksTruncated || coverage.formScanTruncated);
  note.textContent = statements.join(' ');
  note.dataset.limited = String(truncated || coverage.embeddedFrames > 0);
  note.hidden = false;
  return truncated;
}

function renderResult(result, trusted) {
  latestResult = result;
  isFamiliar = Boolean(trusted);
  const level = Object.hasOwn(summaries, result.level) ? result.level : 'medium';
  const [title, description] = summaries[level];
  const signals = Array.isArray(result.signals) ? result.signals : [];
  ui['status-card'].dataset.level = level;
  updateMode();
  ui['status-heading'].textContent = title;
  ui['status-description'].textContent = description;
  const limited = renderCoverage(result.coverage);
  if (level === 'low' && limited) {
    ui['status-heading'].textContent = 'Limited check';
    ui['status-description'].textContent = 'No strong warning signs were found in the portion checked. Some page details could not be reviewed.';
  }
  ui['domain-label'].textContent = result.hostname || 'Current page';
  ui['domain-label'].hidden = false;
  ui['findings-section'].hidden = false;
  ui['intro-section'].hidden = true;
  ui['signal-count'].textContent = `${signals.length} ${signals.length === 1 ? 'signal' : 'signals'}`;
  ui['signals-list'].replaceChildren();
  for (const signal of signals) {
    const item = document.createElement('li');
    item.className = 'signal';
    item.dataset.severity = ['low', 'medium', 'high'].includes(signal.severity) ? signal.severity : 'medium';
    const marker = document.createElement('span');
    marker.className = 'signal-marker';
    marker.setAttribute('aria-hidden', 'true');
    const body = document.createElement('div');
    const heading = document.createElement('h4');
    heading.textContent = signal.title || 'Review this detail';
    const detail = document.createElement('p');
    detail.textContent = signal.detail || 'Verify that this is the website you intended to visit.';
    body.append(heading, detail);
    item.append(marker, body);
    ui['signals-list'].append(item);
  }
  ui['empty-findings'].textContent = limited
    ? 'No strong warning signs matched the available checks. Some page details were not checked, and this result does not verify the website.'
    : 'No strong warning signs matched these checks. This does not verify the website or guarantee it is safe.';
  ui['empty-findings'].hidden = signals.length > 0;
  ui['scan-meta'].textContent = `Checked at ${formatTime(result.checkedAt)} · ${automaticEnabled ? 'Local checks only' : 'Automatic checks off'}`;
  ui['trust-feedback'].textContent = '';
  updateFamiliar();
  setBusy(false);
}

async function scanPage() {
  if (busy) return;
  stopStatusPolling();
  setError();
  setBusy(true);
  ui['status-card'].dataset.level = 'loading';
  ui['scan-meta'].textContent = 'Checking the address and page structure on your device…';
  try {
    const response = await chrome.runtime.sendMessage({ type: 'SCAN_ACTIVE_TAB' });
    updateMode(response);
    if (!response?.ok || !response.result) throw new Error(response?.error || 'This page could not be checked. Try a regular website tab.');
    renderResult(response.result, response.trusted);
  } catch (error) {
    setError(error.message || 'The page could not be checked. Please try again.');
    ui['status-card'].dataset.level = latestResult?.level || 'idle';
    ui['scan-meta'].textContent = latestResult ? 'The previous check is shown. The latest check did not complete.' : 'Chrome restricts access to some pages, including browser settings and the Web Store.';
  } finally {
    setBusy(false);
  }
}

ui['scan-button'].addEventListener('click', scanPage);
ui['settings-button'].addEventListener('click', () => chrome.runtime.openOptionsPage());
ui['privacy-button'].addEventListener('click', () => chrome.runtime.openOptionsPage());
ui['dataset-button'].addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dataset.html') });
});
ui['synthid-button'].addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://synthid.com/' });
});
ui['trust-button'].addEventListener('click', async () => {
  if (busy || !latestResult?.hostname) return;
  const nextValue = !isFamiliar;
  ui['trust-button'].disabled = true;
  setError();
  try {
    const response = await chrome.runtime.sendMessage({ type: 'SET_TRUST', hostname: latestResult.hostname, trusted: nextValue });
    if (!response?.ok) throw new Error(response?.error || 'The familiar marker could not be saved.');
    isFamiliar = nextValue;
    updateFamiliar();
    ui['trust-feedback'].textContent = isFamiliar ? 'Saved on this device. This does not verify the site.' : 'Familiar marker removed.';
  } catch (error) {
    setError(error.message || 'The familiar marker could not be saved.');
  } finally {
    ui['trust-button'].disabled = false;
  }
});

function stopStatusPolling() {
  statusGeneration++;
  clearTimeout(statusTimer);
}

function renderPending() {
  latestResult = null;
  ui['status-card'].dataset.level = 'loading';
  ui['status-heading'].textContent = 'Checking this page…';
  ui['status-description'].textContent = 'The automatic check is reviewing the address and page structure on your device.';
  ui['domain-label'].hidden = true;
  ui['familiar-note'].hidden = true;
  ui['coverage-note'].hidden = true;
  ui['findings-section'].hidden = true;
  ui['intro-section'].hidden = true;
  ui['scan-meta'].textContent = 'Automatic check in progress…';
  setBusy(true);
}

function renderUnavailable(title, description) {
  latestResult = null;
  ui['status-card'].dataset.level = 'idle';
  ui['status-heading'].textContent = title;
  ui['status-description'].textContent = description;
  ui['domain-label'].hidden = true;
  ui['familiar-note'].hidden = true;
  ui['coverage-note'].hidden = true;
  ui['findings-section'].hidden = true;
  ui['intro-section'].hidden = false;
  ui['scan-meta'].textContent = 'No completed check is available for this page.';
  setBusy(false);
}

async function pollPageStatus(generation, startedAt) {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_STATUS' });
    if (generation !== statusGeneration) return;
    updateMode(response);
    if (!response?.ok) {
      renderUnavailable('Page not checked', response?.error || 'The automatic page check is unavailable. Select Scan again to retry.');
      return;
    }
    if (!response.result && typeof response.scanError === 'string' && response.scanError) {
      renderUnavailable('Page not checked', response.scanError);
      return;
    }
    if (response.scanning) {
      if (Date.now() - startedAt >= 10000) {
        renderUnavailable('Check still pending', 'The automatic check has not finished. Select Scan again to retry.');
        return;
      }
      renderPending();
      statusTimer = setTimeout(() => pollPageStatus(generation, startedAt), 400);
      return;
    }
    if (response.result) renderResult(response.result, response.trusted);
    else if (!automaticEnabled) renderUnavailable('Ready when you are', 'Automatic checks are off. Select Scan again to check this page locally.');
    else renderUnavailable('No check available', 'An automatic result is not available for this page. Select Scan again to run a local check.');
  } catch {
    if (generation === statusGeneration) {
      renderUnavailable('Page not checked', 'The page check is unavailable. Select Scan again to retry.');
    }
  }
}

window.addEventListener('pagehide', stopStatusPolling);
pollPageStatus(statusGeneration, Date.now());
