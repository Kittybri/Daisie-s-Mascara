import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'tidecheck-test-'));
const extension = path.join(temp, 'extension');
await fs.cp('extension', extension, { recursive: true });
const manifestPath = path.join(extension, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
// Use the shipping manifest unchanged; all web requests in this test are intercepted fixtures.
const context = await chromium.launchPersistentContext(path.join(temp, 'profile'), {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  viewport: { width: 1280, height: 900 }
});
const out = path.resolve('tmp/browser');
await fs.mkdir(out, { recursive: true });
let completed = false;
try {
  const errors = [];
  context.on('weberror', event => errors.push(event.error().message));
  const unexpectedRequests = [];
  context.on('request', request => {
    const url = request.url();
    if (/^https?:/.test(url) && !/^https:\/\/[^/]*\.example\.test\//.test(url)) unexpectedRequests.push(url);
  });
  await context.route(/^https:\/\/[^/]*\.example\.test\//, route => {
    const clean = route.request().url().includes('/clean');
    const html = clean
      ? '<!doctype html><html><head><title>Clean test page</title></head><body><h1>Example reading page</h1><a href="https://portal.example.test/help">https://portal.example.test/help</a></body></html>'
      : '<!doctype html><html><head><title>Password test page</title></head><body><h1>Example sign-in page</h1><form action="http://destination.example.test/post"><input type="password" value="NEVER_PERSIST_TEST_SECRET"><button type="submit">Sign in</button></form><a href="https://elsewhere.example.test">https://portal.example.test</a></body></html>';
    return route.fulfill({ contentType: 'text/html', body: html });
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).hostname;
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.getByRole('button', { name: 'Scan again', exact: true }).waitFor();
  assert.equal(await popup.locator('body').evaluate(el => el.scrollWidth), 400);
  await popup.locator('body').screenshot({ path: path.join(out, 'popup-initial.png') });

  const fixture = await context.newPage();
  await fixture.goto('https://portal.example.test/risky');
  await fixture.bringToFront();
  await popup.waitForFunction(async () => (await chrome.runtime.sendMessage({type:'GET_ACTIVE_STATUS'})).result?.level === 'high');
  await popup.reload();
  await popup.waitForFunction(() => document.querySelector('#status-heading').textContent === 'High concern');
  assert.ok((await popup.locator('#signals-list').innerText()).includes('Password form sends to HTTP'));
  assert.ok((await popup.locator('#signals-list').innerText()).includes('displayed link'));
  await popup.locator('body').screenshot({ path: path.join(out, 'popup-concern.png') });
  await popup.locator('#trust-button').evaluate(el => el.click());
  await popup.waitForFunction(() => !document.querySelector('#familiar-note').hidden);
  assert.equal(await popup.locator('#status-heading').textContent(), 'High concern');
  const stored = await popup.evaluate(() => chrome.storage.local.get(null));
  assert.deepEqual(stored, { trustedDomains: ['portal.example.test'] });
  assert.ok(!JSON.stringify(stored).includes('NEVER_PERSIST'));

  const settings = await context.newPage();
  await settings.goto(`chrome-extension://${id}/options.html`);
  await settings.getByRole('button', { name: 'Remove familiar marker for portal.example.test' }).waitFor();
  await settings.getByRole('button', { name: 'Clear all familiar domains', exact: true }).click();
  await settings.waitForFunction(() => document.querySelector('#domain-count').textContent === '0 domains');
  await settings.screenshot({ path: path.join(out, 'settings.png'), fullPage: true });

  await fixture.goto('https://portal.example.test/clean');
  await fixture.bringToFront();
  await popup.waitForFunction(async () => (await chrome.runtime.sendMessage({type:'GET_ACTIVE_STATUS'})).result?.level === 'low');
  await popup.reload();
  await popup.waitForFunction(() => document.querySelector('#status-heading').textContent === 'No strong warning signs');
  await popup.locator('body').screenshot({ path: path.join(out, 'popup-clean.png') });

  const dataset = await context.newPage();
  await dataset.goto(`chrome-extension://${id}/dataset.html`);
  await dataset.waitForFunction(() => document.querySelectorAll('#column-rows tr').length === 60);
  assert.equal(await dataset.locator('#record-count').textContent(), '215,795');
  await dataset.screenshot({path: path.join(out, 'dataset.png'), clip: {x:0,y:0,width:1280,height:800}});
  await dataset.locator('#column-search').fill('password');
  assert.equal(await dataset.locator('#column-rows tr').count(), 1);
  await dataset.locator('#reset-columns').click();
  assert.equal(await dataset.locator('#column-rows tr').count(), 60);
  await fixture.bringToFront();

  await popup.evaluate(() => chrome.storage.local.set({autoCheckEnabled:false}));
  await fixture.goto('https://portal.example.test/clean?manual');
  await fixture.bringToFront();
  const manualState = await popup.evaluate(() => chrome.runtime.sendMessage({type:'GET_ACTIVE_STATUS'}));
  assert.equal(manualState.autoEnabled, false);
  assert.equal(manualState.result, null);
  assert.equal((await popup.evaluate(() => chrome.runtime.sendMessage({type:'SCAN_ACTIVE_TAB'}))).result.level, 'low');
  await popup.evaluate(() => chrome.storage.local.set({autoCheckEnabled:true}));

  // Exercise the actual injected function for form overrides and scan limits.
  await fixture.setContent('<form action="https://portal.example.test/post"><input type="password"><button formaction="http://elsewhere.example.test/post">Go</button></form>');
  const override = await popup.evaluate(() => chrome.runtime.sendMessage({ type: 'SCAN_ACTIVE_TAB' }));
  assert.ok(override.result.signals.some(signal => signal.id === 'password-destination-http'));
  await fixture.setContent('<form id="login"><input type="password"></form><button form="login" formaction="http://elsewhere.example.test/post">Go</button>');
  const externalButton = await popup.evaluate(() => chrome.runtime.sendMessage({ type: 'SCAN_ACTIVE_TAB' }));
  assert.ok(externalButton.result.signals.some(signal => signal.id === 'password-destination-http'));
  await fixture.setContent('<form><input type="password"><div formaction="http://elsewhere.example.test/post">Label</div><button type="button" formaction="http://elsewhere.example.test/post">Cancel</button><button disabled formaction="http://elsewhere.example.test/post">Disabled</button></form>');
  const inertControls = await popup.evaluate(() => chrome.runtime.sendMessage({ type: 'SCAN_ACTIVE_TAB' }));
  assert.equal(inertControls.result.level, 'low');
  await fixture.setContent('<form><input type="password"><button>Go</button></form>' + '<a href="https://portal.example.test">https://portal.example.test</a>'.repeat(501));
  const capped = await popup.evaluate(() => chrome.runtime.sendMessage({ type: 'SCAN_ACTIVE_TAB' }));
  assert.equal(capped.result.coverage.linksChecked, 500);
  assert.equal(capped.result.coverage.linksTruncated, true);
  assert.equal(capped.result.level, 'low');
  await fixture.goto('chrome://settings/');
  await fixture.bringToFront();
  const denied = await popup.evaluate(() => chrome.runtime.sendMessage({ type: 'SCAN_ACTIVE_TAB' }));
  assert.equal(denied.ok, false);
  assert.match(denied.error, /HTTP or HTTPS/);
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpectedRequests, []);
  const evidence = {
    status: 'passed', version: manifest.version, checkedAt: new Date().toISOString(),
    browser: context.browser()?.version() || await worker.evaluate(() => navigator.userAgent),
    scenarios: ['load popup', 'automatic high-concern scan', 'local familiar preference', 'settings deletion', 'navigation refreshes result', 'automatic low-concern scan', '60 dataset columns and search', 'automatic off and manual scan', 'formaction override', 'external associated submit button', 'inert controls excluded', '500-link cap', 'restricted-page error', 'no unexpected network requests', 'no uncaught browser errors'],
    limitation: 'The shipping manifest runs unchanged in a disposable Chromium profile against intercepted test-domain fixtures. These tests validate behavior, not real-world phishing detection accuracy or SynthID detection.'
  };
  await fs.writeFile(path.join(out, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence, null, 2));
  completed = true;
} finally {
  await context.close();
  await fs.rm(temp, { recursive: true, force: true });
  if (!completed) await fs.rm(path.join(out, 'evidence.json'), { force: true });
}
