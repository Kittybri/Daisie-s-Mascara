import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const output = 'dist/store-assets';
const {version} = JSON.parse(await fs.readFile('extension/manifest.json', 'utf8'));
await fs.mkdir(output, { recursive: true });
const png = async file => `data:image/png;base64,${(await fs.readFile(file)).toString('base64')}`;
const icon = await png('extension/icons/icon128.png');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  for (const [name, title, subtitle, file] of [
    ['screenshot-1', 'Check a page before you share.', 'Local phishing warning signs, explained.', 'popup-clean.png'],
    ['screenshot-2', 'Understand the warning signs.', 'See what deserves a closer look and why.', 'popup-concern.png']
  ]) {
    const screenshot = await png(`tmp/browser/${file}`);
    await page.setContent(`<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;background:#f1eee5;color:#152d3b;font-family:Arial,sans-serif;width:1280px;height:800px;display:flex;padding:54px 70px;gap:80px}.copy{flex:1;padding-top:32px}.brand{display:flex;align-items:center;gap:10px;font-size:27px;font-weight:700}.brand img{width:54px;height:54px}h1{font-size:55px;line-height:1.08;letter-spacing:-2.6px;max-width:530px;margin:55px 0 24px}h2{font-size:23px;line-height:1.5;font-weight:400;max-width:450px;color:#51616a;margin:0 0 38px}.benefit{font-size:17px;margin:16px 0;padding-left:20px;border-left:3px solid #b56440}.note{margin-top:38px;font-size:14px;line-height:1.6;color:#596569;max-width:440px}.ui{width:402px;height:692px;border-radius:18px;overflow:hidden;box-shadow:0 18px 52px #16304020;border:1px solid #d4d8d0;background:#fbfaf7;display:flex;align-items:flex-start;justify-content:center}.ui img{max-width:400px;max-height:690px;object-fit:contain}.tag{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#64766f;margin-top:30px}</style></head><body><div class="copy"><div class="brand"><img src="${icon}">Daisie Mascara</div><h1>${title}</h1><h2>${subtitle}</h2><p class="benefit">Automatic page checks, with an off switch</p><p class="benefit">Read clear reasons behind each finding</p><p class="benefit">Keep scan data on your device</p><p class="note">Rule-based checks can miss phishing and flag legitimate pages. A result does not certify a website.</p><div class="tag">Example page check · Version ${version}</div></div><div class="ui"><img src="${screenshot}"></div></body></html>`);
    await page.screenshot({ path: `${output}/${name}-1280x800.png` });
  }
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#152d3b;color:#fbfaf7;font-family:Arial,sans-serif;padding:28px 34px;box-sizing:border-box;width:440px;height:280px}img{width:65px;height:65px;margin-left:-9px}h1{font-size:32px;letter-spacing:-1px;margin:7px 0 12px}p{font-size:18px;line-height:1.4;max-width:335px;margin:0;color:#d5ded7}.accent{height:3px;background:#d89567;width:45px;margin-top:21px}</style></head><body><img src="${icon}"><h1>Daisie Mascara</h1><p>Local phishing warning signs.<br>Clear explanations. Your choice.</p><div class="accent"></div></body></html>`);
  await page.screenshot({ path: `${output}/promo-440x280.png` });
  await fs.copyFile('extension/icons/icon128.png', `${output}/store-icon-128.png`);
  await fs.copyFile('tmp/browser/dataset.png', `${output}/screenshot-3-dataset-1280x800.png`);
  console.log(`Created actual-UI store screenshots, small promo tile and store icon in ${output}.`);
} finally { await browser.close(); }
