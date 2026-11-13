import test from 'node:test';
import assert from 'node:assert/strict';

let tab = { id: 1, url: 'https://example.com' };
let storage = {};
let injected = { url: tab.url, page: {} };
let badgeTextHook;
let storageGetHook;
let storageSetHook;
let executeScriptHook;
let openTabs = [];
let executedTabIds = [];
const inputsByTab = new Map();
const badge = { text: '', title: '' };
const listeners = {};
globalThis.chrome = {
  runtime: { id: 'test', getURL: path => `chrome-extension://test/${path}`, onMessage: { addListener: fn => { listeners.message = fn; } }, onInstalled: { addListener: fn => { listeners.install = fn; } } },
  tabs: { query: async options => options.active ? [{ ...tab }] : openTabs.map(item => ({ ...item })), get: async id => ({ ...(id === tab.id ? tab : openTabs.find(item => item.id === id)) }), onRemoved: { addListener: fn => { listeners.remove = fn; } }, onUpdated: { addListener: fn => { listeners.update = fn; } }, onActivated: { addListener: fn => { listeners.activate = fn; } } },
  storage: { local: {
    get: async () => { if (storageGetHook) await storageGetHook(); return storage; },
    set: async values => { if (storageSetHook) await storageSetHook(); storage = { ...storage, ...values }; }
  }, onChanged: { addListener: fn => { listeners.storage = fn; } } },
  scripting: { executeScript: async ({ target }) => {
    executedTabIds.push(target.tabId);
    if (executeScriptHook) await executeScriptHook(target.tabId);
    return [{ result: inputsByTab.get(target.tabId) ?? injected }];
  } },
  action: {
    setBadgeText: async details => { if (badgeTextHook) await badgeTextHook(details); badge.text = details.text; },
    setBadgeBackgroundColor: async () => {},
    setTitle: async details => { badge.title = details.title; }
  }
};
const { handleMessage } = await import('../extension/background.js');
const sender = { id: 'test', url: 'chrome-extension://test/popup.html' };
const send = message => handleMessage(message, sender);
test.beforeEach(async () => {
  badgeTextHook = undefined;
  storageGetHook = undefined;
  storageSetHook = undefined;
  executeScriptHook = undefined;
  openTabs = [];
  executedTabIds = [];
  inputsByTab.clear();
  tab = { id: 1, url: 'https://example.com' };
  storage = {};
  injected = { url: tab.url, page: {} };
  listeners.remove(2);
  listeners.remove(3);
  await listeners.update(1, { status: 'loading' });
});

function holdConcernBadge() {
  let entered;
  let release;
  const started = new Promise(resolve => { entered = resolve; });
  const held = new Promise(resolve => { release = resolve; });
  badgeTextHook = async ({ text }) => {
    if (text !== '!') return;
    badgeTextHook = undefined;
    entered();
    await held;
  };
  return { started, release };
}

test('reject page senders and external extension senders', async () => {
  assert.equal((await handleMessage({ type: 'SCAN_ACTIVE_TAB' }, { ...sender, url: 'https://example.com', tab })).ok, false);
  assert.equal((await handleMessage({ type: 'SCAN_ACTIVE_TAB' }, { ...sender, id: 'other' })).ok, false);
});
test('manual scans return scrubbed output and do not persist browsing details', async () => {
  tab.url = 'https://example.com/?password=secret';
  injected = { url: tab.url, page: {} };
  const result = await send({ type: 'SCAN_ACTIVE_TAB' });
  assert.equal(result.ok, true);
  assert.equal(result.result.url, 'https://example.com');
  assert.deepEqual(storage, {});
  assert.ok((await send({ type: 'GET_ACTIVE_STATUS' })).result);
});
test('navigation invalidates cached results even before update event', async () => {
  await send({ type: 'SCAN_ACTIVE_TAB' });
  tab.url = 'https://example.com/next';
  assert.equal((await send({ type: 'GET_ACTIVE_STATUS' })).result, null);
  await listeners.update(1, { status: 'loading' });
});
test('mid-scan navigation rejects stale observations', async () => {
  injected = { url: 'https://old.example', page: {} };
  assert.equal((await send({ type: 'SCAN_ACTIVE_TAB' })).ok, false);
});
test('familiar choices only accept current exact hostname and retain warnings', async () => {
  injected = { url: tab.url, page: { insecurePasswordForms: 1 } };
  await send({ type: 'SCAN_ACTIVE_TAB' });
  assert.equal((await send({ type: 'SET_TRUST', hostname: 'wrong.example', trusted: true })).ok, false);
  const result = await send({ type: 'SET_TRUST', hostname: 'example.com', trusted: true });
  assert.equal(result.trusted, true);
  assert.equal(result.result.level, 'high');
  assert.deepEqual(storage, { trustedDomains: ['example.com'] });
  await send({ type: 'SET_TRUST', hostname: 'example.com', trusted: false });
  assert.deepEqual(storage.trustedDomains, []);
});
test('extension pages opened in a tab can request scans', async () => {
  const result = await handleMessage({ type: 'SCAN_ACTIVE_TAB' }, { ...sender, tab: { id: 9 } });
  assert.equal(result.ok, true);
});
test('navigation during a pending badge write cannot restore a stale result or title', async () => {
  injected = { url: tab.url, page: { insecurePasswordForms: 1 } };
  const held = holdConcernBadge();
  const scan = send({ type: 'SCAN_ACTIVE_TAB' });
  await held.started;
  tab = { id: 1, url: 'https://different.example' };
  const cleared = listeners.update(1, { url: tab.url, status: 'loading' });
  held.release();
  assert.equal((await scan).ok, false);
  await cleared;
  assert.equal(badge.text, '');
  assert.equal(badge.title, 'TideCheck: check this page');
  assert.equal((await send({ type: 'GET_ACTIVE_STATUS' })).result, null);
});
test('same-URL reload during a pending badge write invalidates the scan', async () => {
  injected = { url: tab.url, page: { insecurePasswordForms: 1 } };
  const held = holdConcernBadge();
  const scan = send({ type: 'SCAN_ACTIVE_TAB' });
  await held.started;
  const cleared = listeners.update(1, { status: 'loading' });
  held.release();
  assert.equal((await scan).ok, false);
  await cleared;
  assert.equal(badge.text, '');
  assert.equal(badge.title, 'TideCheck: check this page');
  assert.equal((await send({ type: 'GET_ACTIVE_STATUS' })).result, null);
});
test('a newer scan wins over an older pending badge write', async () => {
  injected = { url: tab.url, page: { insecurePasswordForms: 1 } };
  const held = holdConcernBadge();
  const olderScan = send({ type: 'SCAN_ACTIVE_TAB' });
  await held.started;
  injected = { url: tab.url, page: {} };
  const newerScan = send({ type: 'SCAN_ACTIVE_TAB' });
  // Let the newer request claim its generation while the old write is held.
  await Promise.resolve();
  await Promise.resolve();
  held.release();
  assert.equal((await olderScan).ok, false);
  const result = await newerScan;
  assert.equal(result.ok, true);
  assert.equal(result.result.level, 'low');
  assert.equal(badge.text, '');
  assert.match(badge.title, /no strong warning signs/);
  assert.equal((await send({ type: 'GET_ACTIVE_STATUS' })).result.level, 'low');
});
test('status rechecks navigation after awaiting familiar-domain storage', async () => {
  await send({ type: 'SCAN_ACTIVE_TAB' });
  storageGetHook = async () => {
    storageGetHook = undefined;
    tab = { id: 1, url: 'https://different.example' };
    await listeners.update(1, { url: tab.url });
  };
  const result = await send({ type: 'GET_ACTIVE_STATUS' });
  assert.equal(result.ok, true);
  assert.equal(result.result, null);
  assert.equal(result.trusted, false);
});
test('a trust write that overlaps navigation does not return the old scan', async () => {
  injected = { url: tab.url, page: { insecurePasswordForms: 1 } };
  await send({ type: 'SCAN_ACTIVE_TAB' });
  storageSetHook = async () => {
    storageSetHook = undefined;
    tab = { id: 1, url: 'https://different.example' };
    await listeners.update(1, { url: tab.url });
  };
  const result = await send({ type: 'SET_TRUST', hostname: 'example.com', trusted: true });
  assert.equal(result.ok, false);
  assert.equal(result.result, undefined);
  assert.match(result.error, /choice was saved/);
  assert.deepEqual(storage.trustedDomains, ['example.com']);
  assert.equal((await send({ type: 'GET_ACTIVE_STATUS' })).result, null);
});
test('restricted schemes produce a helpful error', async () => {
  tab = { id: 1, url: 'chrome://settings/' };
  assert.equal((await send({ type: 'SCAN_ACTIVE_TAB' })).ok, false);
});
test('automatic checks run when a page completes and expose their status', async () => {
  injected = { url: tab.url, page: { insecurePasswordForms: 1 } };
  await listeners.update(1, { status: 'complete' }, { ...tab });
  const status = await send({ type: 'GET_ACTIVE_STATUS' });
  assert.equal(status.autoEnabled, true);
  assert.equal(status.scanning, false);
  assert.equal(status.result.level, 'high');
  assert.deepEqual(executedTabIds, [1]);
  await listeners.activate({ tabId: 1 });
  assert.deepEqual(executedTabIds, [1]);
});
test('activation reuses an automatic scan already in flight', async () => {
  let entered;
  let release;
  const started = new Promise(resolve => { entered = resolve; });
  const held = new Promise(resolve => { release = resolve; });
  executeScriptHook = async () => { entered(); await held; };
  const loading = listeners.update(1, { status: 'complete' }, { ...tab });
  await started;
  const status = await send({ type: 'GET_ACTIVE_STATUS' });
  assert.equal(status.scanning, true);
  const activated = listeners.activate({ tabId: 1 });
  release();
  await Promise.all([loading, activated]);
  assert.deepEqual(executedTabIds, [1]);
});
test('installation checks open web tabs and skips internal pages', async () => {
  openTabs = [tab, { id: 2, url: 'http://second.example' }, { id: 3, url: 'chrome://settings/' }];
  inputsByTab.set(2, { url: openTabs[1].url, page: {} });
  await listeners.install();
  assert.deepEqual(executedTabIds, [1, 2]);
});
test('disabling automatic checks cancels pending results while manual checks still work', async () => {
  injected = { url: tab.url, page: { insecurePasswordForms: 1 } };
  const held = holdConcernBadge();
  const automatic = listeners.update(1, { status: 'complete' }, { ...tab });
  await held.started;
  storage.autoCheckEnabled = false;
  const disabled = listeners.storage({ autoCheckEnabled: { oldValue: true, newValue: false } }, 'local');
  held.release();
  await Promise.all([automatic, disabled]);
  const status = await send({ type: 'GET_ACTIVE_STATUS' });
  assert.equal(status.autoEnabled, false);
  assert.equal(status.result, null);
  assert.equal(status.scanning, false);
  assert.equal(badge.text, '');
  const priorCalls = executedTabIds.length;
  await listeners.update(1, { status: 'complete' }, { ...tab });
  assert.equal(executedTabIds.length, priorCalls);
  const manual = await send({ type: 'SCAN_ACTIVE_TAB' });
  assert.equal(manual.ok, true);
  assert.equal(manual.result.level, 'high');
  await listeners.storage({ autoCheckEnabled: { oldValue: false, newValue: false } }, 'local');
  assert.equal((await send({ type: 'GET_ACTIVE_STATUS' })).result.level, 'high');
});
test('enabling automatic checks scans open tabs', async () => {
  storage.autoCheckEnabled = false;
  openTabs = [tab];
  await listeners.install();
  assert.deepEqual(executedTabIds, []);
  storage.autoCheckEnabled = true;
  await listeners.storage({ autoCheckEnabled: { oldValue: false, newValue: true } }, 'local');
  assert.deepEqual(executedTabIds, [1]);
});
test('automatic failures show unavailable instead of a no-warning result', async () => {
  executeScriptHook = async () => { throw new Error('Restricted page'); };
  await listeners.update(1, { status: 'complete' }, { ...tab });
  const status = await send({ type: 'GET_ACTIVE_STATUS' });
  assert.equal(status.result, null);
  assert.equal(status.scanning, false);
  assert.match(status.scanError, /could not be checked/);
  assert.equal(badge.text, '?');
  assert.match(badge.title, /unavailable/);
});
test('automatic events skip internal URLs without trying to inject', async () => {
  tab = { id: 1, url: 'chrome://settings/' };
  await listeners.update(1, { status: 'complete' }, { ...tab });
  await listeners.activate({ tabId: 1 });
  assert.deepEqual(executedTabIds, []);
});
