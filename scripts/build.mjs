import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { validateExtensionFiles } from './extension-files.mjs';

const files = await validateExtensionFiles();
const manifest = JSON.parse(await fs.readFile('extension/manifest.json', 'utf8'));
if (typeof manifest.version !== 'string' || !/^\d+(?:\.\d+){0,3}$/.test(manifest.version) || manifest.version.split('.').some(part => Number(part) > 65535) || !manifest.version.split('.').some(Number)) {
  throw new Error('Manifest version must be a valid Chrome extension version.');
}
const output = path.resolve('dist');
await fs.mkdir(output, { recursive: true });
const name = `tidecheck-${manifest.version}`;
const bundle = path.join(output, name);
const zipPath = path.join(output, `${name}.zip`);
const staging = await fs.mkdtemp(path.join(output, '.extension-build-'));
const stagedBundle = path.join(staging, name);
const stagedZip = path.join(staging, `${name}.zip`);
const archiveDate = new Date('1980-01-01T00:00:00.000Z');
try {
  for (const file of files) {
    const destination = path.join(stagedBundle, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join('extension', file), destination);
    await fs.chmod(destination, 0o644);
    await fs.utimes(destination, archiveDate, archiveDate);
  }
  // Stable ordering, timestamps, permissions, and ZIP metadata make rebuilds identical.
  const zipped = spawnSync('zip', ['-q', '-X', stagedZip, ...files], {
    cwd: stagedBundle, encoding: 'utf8', env: { ...process.env, TZ: 'UTC' },
  });
  if (zipped.status !== 0) throw new Error(zipped.stderr || zipped.error?.message || 'zip failed');
  const sha256 = createHash('sha256').update(await fs.readFile(stagedZip)).digest('hex');
  await fs.rm(bundle, { recursive: true, force: true });
  await fs.rename(stagedBundle, bundle);
  await fs.rename(stagedZip, zipPath);
  await fs.writeFile(`${zipPath}.sha256`, `${sha256}  ${path.basename(zipPath)}\n`);
  console.log(`Built ${zipPath}\nSHA-256 ${sha256}\nOnly allowlisted extension files are packaged; source datasets and tooling are excluded.`);
} finally {
  await fs.rm(staging, { recursive: true, force: true });
}
