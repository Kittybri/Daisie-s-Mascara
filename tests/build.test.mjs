import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extensionFiles } from '../scripts/extension-files.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
async function workspace(t) {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'extension-build-test-'));
  t.after(() => fs.rm(folder, { recursive: true, force: true }));
  await fs.cp(path.join(root, 'extension'), path.join(folder, 'extension'), { recursive: true });
  await fs.cp(path.join(root, 'scripts'), path.join(folder, 'scripts'), { recursive: true });
  return folder;
}
function build(folder, timezone = 'UTC') {
  return spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: folder, encoding: 'utf8', env: { ...process.env, TZ: timezone } });
}

test('build is deterministic across source timestamps and process timezones', async t => {
  const folder = await workspace(t);
  const manifest = JSON.parse(await fs.readFile(path.join(folder, 'extension/manifest.json'), 'utf8'));
  const archive = path.join(folder, `dist/tidecheck-${manifest.version}.zip`);
  const first = build(folder, 'America/Los_Angeles');
  assert.equal(first.status, 0, first.stderr);
  const original = await fs.readFile(archive);
  for (const file of extensionFiles) await fs.utimes(path.join(folder, 'extension', file), new Date(), new Date());
  const second = build(folder, 'Asia/Tokyo');
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(await fs.readFile(archive), original);
  const listing = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  assert.deepEqual(listing.stdout.trim().split('\n'), extensionFiles);
});

test('unexpected private files stop packaging without replacing the prior archive', async t => {
  const folder = await workspace(t);
  const manifest = JSON.parse(await fs.readFile(path.join(folder, 'extension/manifest.json'), 'utf8'));
  const archive = path.join(folder, `dist/tidecheck-${manifest.version}.zip`);
  assert.equal(build(folder).status, 0);
  const previous = await fs.readFile(archive);
  await fs.writeFile(path.join(folder, 'extension/private-data.csv'), 'private fixture');
  const result = build(folder);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unexpected extension files: private-data\.csv/);
  assert.deepEqual(await fs.readFile(archive), previous);
});

test('symlinks cannot smuggle files into the extension package', async t => {
  const folder = await workspace(t);
  await fs.writeFile(path.join(folder, 'outside.txt'), 'fixture outside the package');
  await fs.symlink('../outside.txt', path.join(folder, 'extension/extra.txt'));
  const result = build(folder);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Extension symlinks are not allowed: extra\.txt/);
});
