import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = process.cwd();
const lockPath = path.join(root, '.release.lock');
const lock = await fs.open(lockPath, 'wx').catch(() => { throw new Error('Another release preparation holds .release.lock. Verify that process before removing a stale lock.'); });
const run = (command, args, print = true) => {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 10_000_000 });
  if (print && result.stdout) process.stdout.write(result.stdout);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout;
};
try {
  const commit = run('git', ['rev-parse', 'HEAD'], false).trim();
  assert.equal(run('git', ['status', '--porcelain'], false).trim(), '', 'Commit the intended candidate before running the release gate.');
  for (const command of ['lint', 'test', 'test:browser', 'build']) run('npm', ['run', command]);
  const manifest = JSON.parse(await fs.readFile('extension/manifest.json', 'utf8'));
  for (const file of ['CHANGELOG', 'PRD', 'BACKLOG', 'release-review', 'store-listing', 'privacy-policy']) {
    const text = await fs.readFile(`docs/${file}.md`, 'utf8');
    assert.ok(text.trim().length > 100, `Missing release record ${file}`);
  }
  assert.ok((await fs.readFile('docs/CHANGELOG.md', 'utf8')).includes(manifest.version));
  const zipPath = `dist/tidecheck-${manifest.version}.zip`;
  const inventory = run('unzip', ['-Z1', zipPath], false).trim().split('\n').filter(file => !file.endsWith('/')).sort();
  const recursiveFiles = async directory => {
    const output = [];
    for (const item of await fs.readdir(directory, { withFileTypes: true })) {
      if (item.isDirectory()) output.push(...await recursiveFiles(path.join(directory, item.name)));
      else output.push(path.join(directory, item.name).replace(/^extension\//, ''));
    }
    return output.sort();
  };
  assert.deepEqual(inventory, await recursiveFiles('extension'));
  for (const file of inventory) {
    const actual = spawnSync('unzip', ['-p', zipPath, file], { maxBuffer: 2_000_000 });
    assert.equal(actual.status, 0);
    assert.deepEqual(actual.stdout, await fs.readFile(path.join('extension', file)), `Packaged content differs: ${file}`);
  }
  const digest = createHash('sha256').update(await fs.readFile(zipPath)).digest('hex');
  const browser = JSON.parse(await fs.readFile('tmp/browser/evidence.json', 'utf8'));
  assert.equal(browser.status, 'passed');
  assert.equal(browser.version, manifest.version);
  const evidence = {
    version: manifest.version, commit, checkedAt: new Date().toISOString(),
    sourceState: 'clean committed candidate', artifact: zipPath, sha256: digest,
    packagedFiles: inventory, checks: ['syntax and permission/network/secret-pattern checks', 'automated regression tests', 'isolated Chromium integration smoke', 'exact package inventory and bytes', 'release record presence/version'],
    browser, publicationReady: false, publicationStatus: 'not submitted',
    remaining: ['publisher account access', 'public publisher/support details', 'hosted privacy policy', 'store submission and review', 'native Chrome installation and popup check', 'public listing/version verification']
  };
  await fs.writeFile('dist/release-evidence.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(`Release candidate ${manifest.version} validated from ${commit}.\nSHA-256 ${digest}\nNot submitted or published. Evidence: dist/release-evidence.json`);
} finally {
  await lock.close();
  await fs.rm(lockPath, { force: true });
}
