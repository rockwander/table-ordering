#!/usr/bin/env npx tsx

import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

async function generateIllustrations() {
  console.log('🎨 Generating illustration images...\n');

  const browser = await puppeteer.launch({
    headless: true
  });

  const page = await browser.newPage();

  // Set viewport to mobile size
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2
  });

  const htmlPath = path.join(__dirname, 'create-illustration-images.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  console.log('📸 Capturing Step 3 illustration...');

  // Screenshot Step 3
  const step3Element = await page.$('#step3');
  if (step3Element) {
    await step3Element.screenshot({
      path: '/Users/raghav/Downloads/step3-illustration.png',
      type: 'png'
    });
    console.log('✓ Step 3 saved to Downloads/step3-illustration.png');
  }

  console.log('📸 Capturing Step 6 illustration...');

  // Screenshot Step 6
  const step6Element = await page.$('#step6');
  if (step6Element) {
    await step6Element.screenshot({
      path: '/Users/raghav/Downloads/step6-illustration.png',
      type: 'png'
    });
    console.log('✓ Step 6 saved to Downloads/step6-illustration.png');
  }

  await browser.close();

  console.log('\n✅ Illustrations generated successfully!');
  console.log('Files saved to:');
  console.log('  - /Users/raghav/Downloads/step3-illustration.png');
  console.log('  - /Users/raghav/Downloads/step6-illustration.png');
}

generateIllustrations().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
