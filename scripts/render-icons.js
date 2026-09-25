/*
 * Renders the PNG icons in img/ from img/favicon.svg.
 * Run after changing the SVG: node scripts/render-icons.js
 * Needs Playwright with Chromium (npm install -g playwright), which is not a
 * dependency of the game itself.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const IMG = path.join(__dirname, '..', 'img');
const svg = fs.readFileSync(path.join(IMG, 'favicon.svg'), 'utf8');

// Full-bleed square: iOS and Android apply their own corner rounding.
const square = svg.replace('<rect width="64" height="64" rx="14"', '<rect width="64" height="64"');

// Maskable: the grid scaled to 70% so it stays inside the 80% safe zone
// that Android may crop to a circle or squircle.
const inner = svg.slice(svg.indexOf('<g fill="#ffffff">'), svg.lastIndexOf('</svg>'));
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#2f5bd3"/>
  <g transform="translate(9.6 9.6) scale(0.7)">${inner}</g>
</svg>`;

const OUTPUTS = [
  ['favicon-32.png', 32, svg],
  ['apple-touch-icon.png', 180, square],
  ['icon-192.png', 192, svg],
  ['icon-512.png', 512, svg],
  ['icon-maskable-512.png', 512, maskable],
];

(async () => {
  const browser = await chromium.launch();
  for (const [file, size, source] of OUTPUTS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const src = 'data:image/svg+xml;base64,' + Buffer.from(source).toString('base64');
    await page.setContent(`<body style="margin:0"><img src="${src}" width="${size}" height="${size}" style="display:block"></body>`);
    await page.screenshot({ path: path.join(IMG, file), omitBackground: true });
    await page.close();
    console.log(`img/${file} (${size}×${size})`);
  }
  await browser.close();
})();
