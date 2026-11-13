import fs from 'node:fs/promises';
import path from 'node:path';

// Update this list deliberately when adding a distributable extension resource.
export const extensionFiles = Object.freeze([
  'assets/tide-mark.svg',
  'background.js',
  'dataset-summary.js',
  'dataset.css',
  'dataset.html',
  'dataset.js',
  'engine.js',
  'icons/icon128.png',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'manifest.json',
  'options.css',
  'options.html',
  'options.js',
  'popup.css',
  'popup.html',
  'popup.js',
]);

export async function validateExtensionFiles(directory = 'extension') {
  const found = [];
  async function visit(relative = '') {
    for (const entry of await fs.readdir(path.join(directory, relative), { withFileTypes: true })) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Extension symlinks are not allowed: ${name}`);
      if (entry.isDirectory()) await visit(name);
      else if (entry.isFile()) found.push(name);
      else throw new Error(`Unsupported extension file type: ${name}`);
    }
  }
  await visit();
  const unexpected = found.filter(name => !extensionFiles.includes(name));
  const missing = extensionFiles.filter(name => !found.includes(name));
  if (unexpected.length) throw new Error(`Unexpected extension files: ${unexpected.sort().join(', ')}. Keep private and development files outside extension/.`);
  if (missing.length) throw new Error(`Required extension files missing: ${missing.join(', ')}`);
  return [...extensionFiles];
}
