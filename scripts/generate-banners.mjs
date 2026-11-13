// Generates menu carousel banners as PNGs in public/banners/.
// Dish photos come from Gemini and are cached in scripts/banner-photos/;
// pass --regenerate-photos to request fresh ones.
// Usage: node --env-file=.env.local scripts/generate-banners.mjs [--regenerate-photos]
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), 'public', 'banners');
const PHOTO_DIR = join(process.cwd(), 'scripts', 'banner-photos');
const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';
const REGENERATE_PHOTOS = process.argv.includes('--regenerate-photos');
const WIDTH = 1200;
const HEIGHT = 600;

// App palette (lib/theme.ts)
const BURGUNDY = '#800020';
const BURGUNDY_DARK = '#5C0017';
const BEIGE = '#F3EBDD';
const BEIGE_LIGHT = '#FBF7F0';
const OCHRE = '#B07A2A';
const OCHRE_LIGHT = '#E0B86A'; // ochre lifted for small text on burgundy

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

const dishBanners = [
  {
    // Menu item "Ragi Masala Dosai" (millet ragi dosa); photo modelled on the item's own image
    id: 'millet-ragi-dosa',
    referenceImageUrl:
      'https://raw.githubusercontent.com/rockwander/image-repo/refs/heads/main/ChatGPT%20Image%20Sep%2014%2C%202026%2C%2002_10_54%20PM.png',
    prompt:
      'Recreate the exact dish from the reference photo as a professional food photograph: the same rolled, ' +
      'lacy brown millet ragi dosa with yellow potato masala visible at the open end, on a banana leaf on the same ' +
      'steel plate, with the same three small steel bowls of sambar, coconut chutney and red chutney. Keep the dish, ' +
      'plating, plate and bowls identical to the reference. Dark rustic wooden table, warm moody lighting, burgundy ' +
      'and beige tones. The dish sits in the right half of the frame; the left half is dark, softly blurred and empty. ' +
      'Wide landscape shot. Remove all text, signs and lettering from the reference: no text, no logos, no people.',
    // One entry per line of overlay text
    names: { en: ['Millet Ragi', 'Masala Dosa'], gu: ['મિલેટ રાગી', 'મસાલા ઢોસા'] },
  },
  {
    // From the "Healthy @ Ramani's" story; menu item "Sugarfree Kumbakonam filter coffee"
    id: 'kumbakonam-coffee',
    prompt:
      'Professional food photograph of frothy South Indian Kumbakonam filter coffee in a traditional brass ' +
      'tumbler and dabarah set, with a halved monk fruit (luo han guo), a few coffee beans and fresh green leaves beside it. ' +
      'Dark rustic wooden table, warm moody lighting, burgundy and beige tones. ' +
      'The coffee sits in the right half of the frame; the left half is dark, softly blurred and empty. ' +
      'Wide landscape shot, no text, no logos, no people.',
    names: { en: ['Kumbakonam', 'Filter Coffee'], gu: ['કુંભકોણમ', 'ફિલ્ટર કોફી'] },
    badge: { en: 'NEW', gu: 'નવું' },
    price: '₹50',
    eyebrow: { en: 'Naturally sweetened', gu: 'કુદરતી રીતે મીઠી' },
    tagline: { en: 'Sugar-free · Sweetened with monk fruit', gu: 'શુગર-ફ્રી · મોન્ક ફ્રૂટથી મીઠી' },
  },
  {
    // Menu item "Weekend Special - Idiyappam with vegetable kurma"; photo modelled on the item's own image
    id: 'idiyappam-kurma',
    referenceImageUrl:
      'https://raw.githubusercontent.com/rockwander/image-repo/refs/heads/main/file_0000000061c882119e5e39378c8798b5.png',
    prompt:
      'Recreate the exact dish from the reference photo as a professional food photograph: the same four white ' +
      'idiyappam (string hoppers) on a banana leaf on the same green-rimmed ceramic plate, and the same bowl of ' +
      'creamy white vegetable kurma with carrots, peas, potatoes and curry leaves. Keep the dish, plating, plate and ' +
      'bowl identical to the reference. Dark rustic wooden table, warm moody lighting, burgundy and beige tones. ' +
      'The dish sits in the right half of the frame; the left half is dark, softly blurred and empty. ' +
      'Wide landscape shot. Remove all text and lettering from the reference: no text, no logos, no people.',
    names: { en: ['Idiyappam', 'Kurma'], gu: ['ઇડિયપ્પમ', 'કુરમા'] },
    badge: { en: 'WEEKEND SPECIAL', gu: 'વીકેન્ડ સ્પેશિયલ' },
    price: '₹120',
  },
];

async function fetchReferenceImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch reference image ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { inlineData: { mimeType: res.headers.get('content-type') || 'image/png', data: buffer.toString('base64') } };
}

async function getDishPhoto(dish) {
  const file = join(PHOTO_DIR, `${dish.id}.jpg`);
  if (existsSync(file) && !REGENERATE_PHOTOS) return readFileSync(file);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set (run with --env-file=.env.local)');

  console.log(`… generating photo for ${dish.id} with ${GEMINI_IMAGE_MODEL}`);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            ...(dish.referenceImageUrl ? [await fetchReferenceImage(dish.referenceImageUrl)] : []),
            { text: dish.prompt },
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Gemini error ${data.error.code}: ${data.error.message}`);

  const image = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
  if (!image) throw new Error(`Gemini returned no image for ${dish.id}`);

  const buffer = Buffer.from(image.inlineData.data, 'base64');
  mkdirSync(PHOTO_DIR, { recursive: true });
  writeFileSync(file, buffer);
  return buffer;
}

// Rough pill width for a short label; good enough for badges like "NEW" or "₹50"
function pillWidth(text, fontSize) {
  // Gujarati vowel signs and marks don't take up their own width
  const visible = text.replace(/[\u0A81-\u0A83\u0ABC-\u0ACD]/g, '');
  return Math.round(visible.length * fontSize * 0.7 + 44);
}

function dishOverlaySvg(dish, lang, font) {
  const lines = dish.names[lang];
  const badge = dish.badge?.[lang];
  const eyebrow = dish.eyebrow?.[lang];
  const tagline = dish.tagline?.[lang];
  const lineHeight = 84;
  const lastBaseline = tagline ? HEIGHT - 150 : HEIGHT - 90;
  const firstBaseline = lastBaseline - (lines.length - 1) * lineHeight;
  const eyebrowBaseline = firstBaseline - 82;
  const topY = firstBaseline - 110 - (eyebrow ? 52 : 0);

  // Top of the stack: badge + price pills when present, otherwise a short accent line
  let top = '';
  if (badge || dish.price) {
    let x = 80;
    if (badge) {
      const w = pillWidth(badge, 24);
      top += `<rect x="${x}" y="${topY - 14}" width="${w}" height="44" rx="22" fill="${OCHRE}"/>
  <text x="${x + w / 2}" y="${topY + 16}" font-family="${font}" font-size="24" font-weight="800" fill="${BEIGE_LIGHT}" text-anchor="middle" letter-spacing="${lang === 'en' ? 2 : 0}">${badge}</text>`;
      x += w + 14;
    }
    if (dish.price) {
      const w = pillWidth(dish.price, 26);
      top += `<rect x="${x}" y="${topY - 14}" width="${w}" height="44" rx="22" fill="none" stroke="${BEIGE_LIGHT}" stroke-opacity="0.8" stroke-width="2"/>
  <text x="${x + w / 2}" y="${topY + 17}" font-family="${LATIN_FONT}" font-size="26" font-weight="700" fill="${BEIGE_LIGHT}" text-anchor="middle">${dish.price}</text>`;
    }
  } else {
    top = `<rect x="80" y="${topY}" width="72" height="6" rx="3" fill="${OCHRE}"/>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${BURGUNDY_DARK}" stop-opacity="0.95"/>
      <stop offset="0.38" stop-color="${BURGUNDY}" stop-opacity="0.75"/>
      <stop offset="0.65" stop-color="${BURGUNDY}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)"/>
  ${top}
  ${eyebrow ? `<text x="80" y="${eyebrowBaseline}" font-family="${font}" font-size="30" font-weight="600" font-style="italic" fill="${OCHRE_LIGHT}">${eyebrow}</text>` : ''}
  <g font-family="${font}" font-size="72" font-weight="800" fill="${BEIGE_LIGHT}">
    ${lines.map((line, i) => `<text x="80" y="${firstBaseline + i * lineHeight}">${line}</text>`).join('\n    ')}
  </g>
  ${tagline ? `<text x="80" y="${lastBaseline + 66}" font-family="${font}" font-size="30" font-weight="500" fill="${OCHRE_LIGHT}">${tagline}</text>` : ''}
</svg>`;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const [lang, copy] of Object.entries(discountCopy)) {
  const file = join(OUT_DIR, `discount-10-${lang}.png`);
  await sharp(Buffer.from(discountBannerSvg(copy))).png().toFile(file);
  console.log(`✓ ${file}`);
}

for (const dish of dishBanners) {
  const photo = await sharp(await getDishPhoto(dish))
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'right' })
    .toBuffer();

  for (const [lang, font] of [['en', LATIN_FONT], ['gu', GUJARATI_FONT]]) {
    const file = join(OUT_DIR, `${dish.id}-${lang}.png`);
    await sharp(photo)
      .composite([{ input: Buffer.from(dishOverlaySvg(dish, lang, font)) }])
      .png()
      .toFile(file);
    console.log(`✓ ${file}`);
  }
}
