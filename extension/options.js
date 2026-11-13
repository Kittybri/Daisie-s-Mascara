const domainList = document.getElementById('domain-list');
const domainCount = document.getElementById('domain-count');
const emptyState = document.getElementById('empty-state');
const clearButton = document.getElementById('clear-button');
const feedback = document.getElementById('save-feedback');
const errorMessage = document.getElementById('error-message');
const autoCheckEnabled = document.getElementById('auto-check-enabled');
const automaticFeedback = document.getElementById('automatic-feedback');
let familiarDomains = [];
let pending = false;

document.getElementById('dataset-button').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dataset.html') });
});
document.getElementById('synthid-button').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://synthid.com/' });
});

autoCheckEnabled.addEventListener('change', async () => {
  const enabled = autoCheckEnabled.checked;
  autoCheckEnabled.disabled = true;
  automaticFeedback.textContent = '';
  try {
    await chrome.storage.local.set({ autoCheckEnabled: enabled });
    automaticFeedback.textContent = enabled
      ? 'Automatic checks are on. Pages will be checked when they load.'
      : 'Automatic checks are off. Use Scan again for a manual check.';
  } catch {
    autoCheckEnabled.checked = !enabled;
    automaticFeedback.textContent = 'This setting could not be saved. Please try again.';
  } finally {
    autoCheckEnabled.disabled = false;
  }
});

function showError(message = '') {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}

function normalizeDomains(stored) {
  const items = Array.isArray(stored) ? stored : [];
  return [...new Set(items.filter(item => typeof item === 'string' && item.trim()))].sort();
}

function render() {
  domainList.replaceChildren();
  domainCount.textContent = `${familiarDomains.length} ${familiarDomains.length === 1 ? 'domain' : 'domains'}`;
  emptyState.hidden = familiarDomains.length > 0;
  clearButton.disabled = pending || familiarDomains.length === 0;
  for (const domain of familiarDomains) {
    const row = document.createElement('li');
    row.className = 'domain-row';
    const name = document.createElement('span');
    name.className = 'domain-name';
    name.textContent = domain;
    const remove = document.createElement('button');
    remove.className = 'remove-button';
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove familiar marker for ${domain}`);
    remove.disabled = pending;
    remove.addEventListener('click', () => save(familiarDomains.filter(item => item !== domain), `Removed ${domain}.`));
    row.append(name, remove);
    domainList.append(row);
  }
}

async function save(nextDomains, message) {
  if (pending) return;
  pending = true;
  showError();
  render();
  try {
    await chrome.storage.local.set({ trustedDomains: nextDomains });
    familiarDomains = nextDomains;
    feedback.textContent = message;
  } catch {
    showError('Changes could not be saved. Please try again.');
  } finally {
    pending = false;
    render();
  }
}

clearButton.addEventListener('click', () => save([], 'All familiar markers were removed from this device.'));

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.autoCheckEnabled) {
    autoCheckEnabled.checked = changes.autoCheckEnabled.newValue !== false;
  }
  if (areaName === 'local' && changes.trustedDomains) {
    familiarDomains = normalizeDomains(changes.trustedDomains.newValue);
    render();
  }
});

try {
  const stored = await chrome.storage.local.get(['trustedDomains', 'autoCheckEnabled']);
  autoCheckEnabled.checked = stored.autoCheckEnabled !== false;
  familiarDomains = normalizeDomains(stored.trustedDomains);
  render();
} catch {
  domainCount.textContent = 'Unavailable';
  showError('Your saved domains could not be loaded. Please reopen this page.');
}
