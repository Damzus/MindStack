import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/assets/work');

const targets = [
  {
    slug: 'paradise-group',
    url: 'https://paradise-gp.com/',
    settle: 14_000,
    triggerCounters: true,
  },
  {
    slug: 'all-about-her',
    url: 'https://all-about-her.vercel.app/',
    settle: 2500,
    triggerCounters: false,
  },
];

const WIDTH = 1600;
const HEIGHT = 1000;

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
});

for (const { slug, url, settle, triggerCounters } of targets) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 90_000 });
    await page.waitForTimeout(3000);

    if (triggerCounters) {
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    await page.waitForTimeout(settle);
    await page.evaluate(() => window.scrollTo(0, 0));

    const path = join(outDir, `${slug}.png`);
    await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    console.log(`captured ${slug}`);
  } catch (error) {
    console.error(`FAILED ${slug}: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await page.close();
  }
}

await browser.close();
