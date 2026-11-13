// Generates menu carousel banners as PNGs in public/banners/.
// Usage: node scripts/generate-banners.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), 'public', 'banners');
const WIDTH = 1200;
const HEIGHT = 600;

// App palette (lib/theme.ts)
const BURGUNDY = '#800020';
const BURGUNDY_DARK = '#5C0017';
const BEIGE = '#F3EBDD';
const BEIGE_LIGHT = '#FBF7F0';
const OCHRE = '#B07A2A';

const LATIN_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const GUJARATI_FONT = "'Gujarati Sangam MN', 'Gujarati MT', 'Noto Sans Gujarati', sans-serif";

const discountCopy = {
  en: {
    font: LATIN_FONT,
    tracking: 3,
    eyebrow: 'APP EXCLUSIVE',
    headline: 'on every order',
    sub: 'placed via this app',
    note: 'Auto-applied when you settle your bill',
  },
  gu: {
    font: GUJARATI_FONT,
    tracking: 0,
    eyebrow: 'ફક્ત એપ પર',
    headline: 'દરેક ઓર્ડર પર',
    sub: 'આ એપ દ્વારા આપેલ',
    note: 'બિલ ચૂકવતી વખતે આપમેળે લાગુ થશે',
  },
};

function discountBannerSvg(copy) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BURGUNDY}"/>
      <stop offset="1" stop-color="${BURGUNDY_DARK}"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Decorative rings -->
  <circle cx="1040" cy="90" r="260" fill="none" stroke="${BEIGE}" stroke-opacity="0.08" stroke-width="60"/>
  <circle cx="1100" cy="560" r="140" fill="${BEIGE}" fill-opacity="0.05"/>

  <!-- Left: big offer -->
  <g font-family="${LATIN_FONT}" fill="${BEIGE_LIGHT}">
    <text x="80" y="345" font-size="250" font-weight="800" letter-spacing="-8">10%</text>
    <text x="92" y="440" font-size="96" font-weight="800" letter-spacing="10" fill="${OCHRE}">OFF</text>
  </g>

  <!-- Divider -->
  <rect x="640" y="150" width="4" height="300" rx="2" fill="${BEIGE}" fill-opacity="0.25"/>

  <!-- Right: copy -->
  <g font-family="${copy.font}" fill="${BEIGE_LIGHT}">
    <rect x="690" y="150" width="${copy.eyebrow.length > 10 ? 250 : 220}" height="44" rx="22" fill="${OCHRE}"/>
    <text x="${690 + (copy.eyebrow.length > 10 ? 125 : 110)}" y="181" font-size="22" font-weight="700" letter-spacing="${copy.tracking}" text-anchor="middle">${copy.eyebrow}</text>
    <text x="690" y="285" font-size="54" font-weight="700">${copy.headline}</text>
    <text x="690" y="350" font-size="40" font-weight="400" fill-opacity="0.9">${copy.sub}</text>
    <text x="690" y="440" font-size="26" font-style="italic" fill-opacity="0.7">${copy.note}</text>
  </g>
</svg>`;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const [lang, copy] of Object.entries(discountCopy)) {
  const file = join(OUT_DIR, `discount-10-${lang}.png`);
  await sharp(Buffer.from(discountBannerSvg(copy))).png().toFile(file);
  console.log(`✓ ${file}`);
}
