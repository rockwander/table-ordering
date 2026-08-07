#!/usr/bin/env npx tsx

import puppeteer from 'puppeteer';
import * as path from 'path';

async function generateIntro() {
  console.log('🎨 Generating intro illustration...\n');

  const browser = await puppeteer.launch({
    headless: true
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2
  });

  const htmlPath = path.join(__dirname, 'create-intro-illustration.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  console.log('📸 Capturing intro illustration...');

  const introElement = await page.$('#intro');
  if (introElement) {
    await introElement.screenshot({
      path: '/Users/raghav/Downloads/step0-intro.png',
      type: 'png'
    });
    console.log('✓ Intro saved to Downloads/step0-intro.png');
  }

  await browser.close();

  console.log('\n✅ Intro illustration generated successfully!');
}

generateIntro().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
