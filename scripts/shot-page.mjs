import { chromium } from 'playwright';

const path = process.argv[2] ?? '/';
const out = process.argv[3] ?? '.capture-tmp/page.png';
const theme = process.argv[4];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(`http://localhost:4321${path}`, { waitUntil: 'load', timeout: 60_000 });
if (theme) {
  await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
}
await page.waitForTimeout(1500);

const diag = await page.evaluate(() => {
  const form = document.querySelector('form.contact-form');
  if (!form) return { found: false };
  const r = form.getBoundingClientRect();
  const cs = getComputedStyle(form);
  return {
    found: true,
    top: Math.round(r.top + window.scrollY),
    width: Math.round(r.width),
    height: Math.round(r.height),
    display: cs.display,
    visibility: cs.visibility,
    opacity: cs.opacity,
    inputs: form.querySelectorAll('input, select, textarea, button').length,
  };
});

console.log('form diagnostics:', JSON.stringify(diag, null, 2));
if (errors.length) console.log('console errors:', errors.slice(0, 6));
else console.log('console errors: none');

await page.screenshot({ path: out, fullPage: true });
await browser.close();
