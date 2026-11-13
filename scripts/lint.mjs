import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { validateExtensionFiles } from './extension-files.mjs';

export async function filesIn(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? filesIn(path.join(directory, entry.name)) : path.join(directory, entry.name)));
  return nested.flat().sort();
}

const files = (await validateExtensionFiles()).map(file => path.join('extension', file));
for (const file of [...files, ...await filesIn('scripts'), ...await filesIn('tests')]) {
  if (/\.m?js$/.test(file)) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
}
const manifest = JSON.parse(await fs.readFile('extension/manifest.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions.toSorted(), ['scripting', 'storage'].toSorted());
assert.deepEqual(manifest.host_permissions.toSorted(), ['http://*/*', 'https://*/*'].toSorted());
for (const key of ['content_scripts', 'externally_connectable', 'web_accessible_resources']) assert.ok(!(key in manifest), `Unexpected ${key}`);
assert.equal(manifest.version, JSON.parse(await fs.readFile('package.json', 'utf8')).version);
assert.ok(manifest.description.length <= 132);
for (const file of [manifest.background.service_worker, manifest.action.default_popup, manifest.options_ui.page, ...Object.values(manifest.icons)]) await fs.access(path.join('extension', file));
for (const file of files) {
  if (!/\.(js|html|css)$/.test(file)) continue;
  const text = await fs.readFile(file, 'utf8');
  for (const forbidden of [/\beval\s*\(/, /new Function\s*\(/, /\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/, /innerHTML\s*=/, /outerHTML\s*=/, /document\.write\s*\(/, /https?:\/\/[^\s"']+\.(?:js|css)/, /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, /\bAKIA[0-9A-Z]{16}\b/]) {
    assert.ok(!forbidden.test(text), `Forbidden pattern ${forbidden} in ${file}`);
  }
  if (file.endsWith('.html')) {
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(text), `Inline script in ${file}`);
    assert.ok(!/\son[a-z]+\s*=/i.test(text), `Inline event handler in ${file}`);
  }
}
console.log(`Syntax and extension security checks passed (${files.length} packaged files). No runtime dependencies.`);
