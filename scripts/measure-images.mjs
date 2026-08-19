import { chromium } from 'playwright';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto('http://localhost:4321/', { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(800);

  const rows = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).map((img) => {
      const r = img.getBoundingClientRect();
      return {
        alt: img.getAttribute('alt')?.slice(0, 34) ?? '',
        top: Math.round(r.top + window.scrollY),
        loading: img.getAttribute('loading') ?? '-',
        priority: img.getAttribute('fetchpriority') ?? '-',
        decoding: img.getAttribute('decoding') ?? '-',
      };
    })
  );

  const fold = vp.height;
  console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}, fold at ${fold}px) ===`);
  for (const r of rows) {
    const rel = r.top <= fold ? 'ABOVE FOLD' : `${(r.top / fold).toFixed(1)}x fold`;
    console.log(
      `  top=${String(r.top).padStart(5)}  ${rel.padEnd(12)} loading=${r.loading.padEnd(6)} fp=${r.priority.padEnd(7)} dec=${r.decoding.padEnd(6)} ${r.alt}`
    );
  }
  await page.close();
}

await browser.close();
