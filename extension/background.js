import { analyzePage, collectPageSignals } from './engine.js';

const results = new Map();
const inFlight = new Map();
const failures = new Map();
const generations = new Map();
const badgeQueues = new Map();
let nextGeneration = 0;
let automaticEpoch = 0;
const extensionOrigin = chrome.runtime.getURL('');
const stalePageMessage = 'This page check is out of date. Scan the current page again.';

function generationFor(tabId) {
  return generations.get(tabId) ?? 0;
}

function invalidateTab(tabId) {
  const generation = ++nextGeneration;
  generations.set(tabId, generation);
  results.delete(tabId);
  failures.delete(tabId);
  return generation;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !Number.isInteger(tab.id) || !tab.url || !/^https?:\/\//i.test(tab.url)) {
    throw new Error('Open an HTTP or HTTPS webpage, then click TideCheck again. Browser settings, the Web Store and local files cannot be scanned.');
  }
  return tab;
}

async function trustFor(hostname) {
  const { trustedDomains = [] } = await chrome.storage.local.get('trustedDomains');
  return Array.isArray(trustedDomains) && trustedDomains.includes(hostname);
}

async function preferences() {
  const stored = await chrome.storage.local.get(['autoCheckEnabled', 'trustedDomains']);
  return {
    autoEnabled: stored.autoCheckEnabled !== false,
    trustedDomains: Array.isArray(stored.trustedDomains) ? stored.trustedDomains : []
  };
}

function queueBadge(tabId, result, generation, failed = false) {
  // A navigation clear or newer scan must finish after an already-started write.
  // Checking between writes also prevents an old task from setting a stale title.
  const previous = badgeQueues.get(tabId) ?? Promise.resolve();
  const task = previous.catch(() => {}).then(async () => {
    if (generationFor(tabId) !== generation) return false;
    await chrome.action.setBadgeText({ tabId, text: failed ? '?' : result ? (result.level === 'high' ? '!' : result.level === 'medium' ? '?' : '') : '' });
    if (generationFor(tabId) !== generation) return false;
    if (result) {
      await chrome.action.setBadgeBackgroundColor({ tabId, color: result.level === 'high' ? '#BA3C2E' : '#986318' });
      if (generationFor(tabId) !== generation) return false;
    }
    await chrome.action.setTitle({ tabId, title: failed ? 'TideCheck: check unavailable' : result ? `TideCheck: ${result.level === 'high' ? 'high concern' : result.level === 'medium' ? 'review suggested' : 'no strong warning signs'} at last scan` : 'TideCheck: check this page' });
    return generationFor(tabId) === generation;
  });
  badgeQueues.set(tabId, task);
  const cleanup = () => {
    if (badgeQueues.get(tabId) === task) badgeQueues.delete(tabId);
  };
  task.then(cleanup, cleanup);
  return task;
}

async function pageIsCurrent(tabId, url, generation) {
  if (generationFor(tabId) !== generation) return false;
  const current = await chrome.tabs.get(tabId);
  return generationFor(tabId) === generation && current.url === url;
}

async function requireCurrentPage(tabId, url, generation) {
  if (await pageIsCurrent(tabId, url, generation)) return;
  if (generationFor(tabId) === generation) {
    const clearedGeneration = invalidateTab(tabId);
    await queueBadge(tabId, null, clearedGeneration);
  }
  throw new Error(stalePageMessage);
}

export function scanTab(tabId, url, force = false) {
  if (!Number.isInteger(tabId) || !/^https?:\/\//i.test(url || '')) return Promise.reject(new Error('Only HTTP and HTTPS pages can be checked.'));
  const previous = inFlight.get(tabId);
  if (!force && previous?.url === url && previous.generation === generationFor(tabId)) return previous.promise;
  const cached = results.get(tabId);
  if (!force && cached?.documentKey === url && cached.generation === generationFor(tabId)) {
    return Promise.resolve({ result: cached.result, generation: cached.generation });
  }
  const automatic = !force;
  const epoch = automaticEpoch;
  const generation = invalidateTab(tabId);
  const entry = { url, generation, automatic, promise: null };
  const promise = (async () => {
    try {
      await queueBadge(tabId, null, generation);
      await requireCurrentPage(tabId, url, generation);
      let input;
      try {
        const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func: collectPageSignals });
        input = result;
      } catch {
        throw new Error('Chrome did not allow this page to be scanned. Try a normal webpage outside the Chrome Web Store.');
      }
      if (!input?.url || input.url !== url) throw new Error(stalePageMessage);
      await requireCurrentPage(tabId, url, generation);
      if (automatic && epoch !== automaticEpoch) throw new Error(stalePageMessage);
      const result = analyzePage(input);
      if (!(await queueBadge(tabId, result, generation))) throw new Error(stalePageMessage);
      await requireCurrentPage(tabId, url, generation);
      if (automatic && epoch !== automaticEpoch) throw new Error(stalePageMessage);
      results.set(tabId, { documentKey: url, generation, result, automatic });
      return { result, generation };
    } catch (error) {
      if (automatic && epoch === automaticEpoch && generationFor(tabId) === generation && await pageIsCurrent(tabId, url, generation).catch(() => false)) {
        const message = 'This page could not be checked. Try scanning again; Chrome restricts access to some pages.';
        failures.set(tabId, { documentKey: url, generation, message, automatic: true });
        await queueBadge(tabId, null, generation, true).catch(() => {});
      }
      if (generationFor(tabId) !== generation) throw new Error(stalePageMessage);
      throw error;
    } finally {
      if (inFlight.get(tabId) === entry) inFlight.delete(tabId);
    }
  })();
  entry.promise = promise;
  inFlight.set(tabId, entry);
  return promise;
}

async function automaticallyScan(tab) {
  if (!tab || !Number.isInteger(tab.id) || !/^https?:\/\//i.test(tab.url || '')) return;
  const epoch = automaticEpoch;
  const { autoEnabled } = await preferences();
  if (!autoEnabled || epoch !== automaticEpoch) return;
  await scanTab(tab.id, tab.url).catch(() => {});
}

async function scanOpenTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) await automaticallyScan(tab);
}

export async function handleMessage(message, sender) {
  // Only the packaged UI can request scans or modify local preferences.
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(extensionOrigin)) return { ok: false, error: 'Unrecognized request source.' };
  try {
    // Snapshot values: later tab events must not mutate the request's identity.
    const { id: tabId, url } = await activeTab();
    if (message?.type === 'GET_ACTIVE_STATUS') {
      const generation = generationFor(tabId);
      const { autoEnabled, trustedDomains } = await preferences();
      const current = await pageIsCurrent(tabId, url, generation);
      const activeScan = inFlight.get(tabId);
      const scanning = activeScan?.url === url && activeScan.generation === generationFor(tabId);
      if (!current) return { ok: true, result: null, trusted: false, autoEnabled, scanning, scanError: null };
      const entry = results.get(tabId);
      const result = entry?.generation === generation && entry.documentKey === url ? entry.result : null;
      const failure = failures.get(tabId);
      const scanError = failure?.generation === generation && failure.documentKey === url ? failure.message : null;
      return { ok: true, result, trusted: trustedDomains.includes(new URL(url).hostname), autoEnabled, scanning, scanError };
    }
    if (message?.type === 'SCAN_ACTIVE_TAB') {
      const { result, generation } = await scanTab(tabId, url, true);
      const trusted = await trustFor(result.hostname);
      await requireCurrentPage(tabId, url, generation);
      return { ok: true, result, trusted };
    }
    if (message?.type === 'SET_TRUST') {
      const generation = generationFor(tabId);
      const hostname = new URL(url).hostname;
      if (message.hostname !== hostname || typeof message.trusted !== 'boolean') throw new Error('Open the same page and try again.');
      const stored = await chrome.storage.local.get('trustedDomains');
      const domains = new Set(Array.isArray(stored.trustedDomains) ? stored.trustedDomains.filter(value => typeof value === 'string') : []);
      if (message.trusted) domains.add(hostname); else domains.delete(hostname);
      if (domains.size > 500) throw new Error('The familiar-domain list is full. Remove some entries in Settings.');
      await requireCurrentPage(tabId, url, generation);
      await chrome.storage.local.set({ trustedDomains: [...domains].sort() });
      if (!(await pageIsCurrent(tabId, url, generation))) {
        throw new Error('The familiar choice was saved, but this page check is out of date. Scan the current page again.');
      }
      const entry = results.get(tabId);
      const result = entry?.generation === generation && entry.documentKey === url ? entry.result : null;
      return { ok: true, result, trusted: message.trusted };
    }
    return { ok: false, error: 'Unknown request.' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'The scan could not finish. Please try again.' };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true;
});

chrome.tabs.onRemoved.addListener(tabId => {
  invalidateTab(tabId);
  inFlight.delete(tabId);
});
chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
  if (change.status === 'loading' || change.url) {
    const generation = invalidateTab(tabId);
    await queueBadge(tabId, null, generation).catch(() => {});
  }
  if (change.status === 'complete') {
    try { await automaticallyScan(tab ?? await chrome.tabs.get(tabId)); } catch { /* The tab may have closed. */ }
  }
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try { await automaticallyScan(await chrome.tabs.get(tabId)); } catch { /* The tab may have closed. */ }
});
chrome.runtime.onInstalled.addListener(() => scanOpenTabs().catch(() => {}));
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== 'local' || !changes.autoCheckEnabled) return;
  automaticEpoch++;
  if (changes.autoCheckEnabled.newValue !== false) {
    await scanOpenTabs().catch(() => {});
    return;
  }
  const automaticTabs = new Set([
    ...[...inFlight].filter(([, entry]) => entry.automatic).map(([tabId]) => tabId),
    ...[...results].filter(([, entry]) => entry.automatic).map(([tabId]) => tabId),
    ...failures.keys()
  ]);
  await Promise.all([...automaticTabs].map(tabId => {
    const generation = invalidateTab(tabId);
    return queueBadge(tabId, null, generation).catch(() => {});
  }));
});
