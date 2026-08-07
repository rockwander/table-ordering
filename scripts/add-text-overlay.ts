#!/usr/bin/env npx tsx

import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

async function addTextOverlay() {
  console.log('🎨 Adding text overlay to image...\n');

  const browser = await puppeteer.launch({
    headless: true
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2
  });

  // Read the original image and convert to base64
  const imagePath = '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 15.28.49.jpeg';
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

  // Create HTML with embedded image
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Bree+Serif&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000;
        }

        .story-container {
            width: 390px;
            height: 844px;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
            background: #000;
        }

        .background-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
                to bottom,
                rgba(0,0,0,0.6) 0%,
                rgba(0,0,0,0.1) 30%,
                rgba(0,0,0,0) 50%
            );
        }

        .text-overlay {
            position: absolute;
            top: 80px;
            left: 20px;
            right: 20px;
            text-align: center;
            z-index: 10;
        }

        .main-text {
            font-family: 'Bree Serif', serif;
            font-size: 30px;
            font-weight: 400;
            color: #FFFFFF;
            line-height: 1.4;
            text-shadow: 0 2px 8px rgba(0,0,0,0.9),
                         0 4px 16px rgba(0,0,0,0.7);
            padding: 20px 15px;
            background: rgba(0,0,0,0.4);
            border-radius: 12px;
            backdrop-filter: blur(5px);
        }
    </style>
</head>
<body>
    <div class="story-container">
        <img src="${imageDataUrl}" class="background-image" alt="Background">
        <div class="overlay"></div>
        <div class="text-overlay">
            <div class="main-text">
                Fresh spoons and glasses,<br>
                stocked for your next meal
            </div>
        </div>
    </div>
</body>
</html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait for fonts to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('📸 Capturing image with overlay...');

  const element = await page.$('.story-container');
  if (element) {
    await element.screenshot({
      path: '/Users/raghav/Downloads/spoons-glasses-overlay.png',
      type: 'png'
    });
    console.log('✓ Image saved to Downloads/spoons-glasses-overlay.png');
  }

  await browser.close();

  console.log('\n✅ Text overlay added successfully!');
}

addTextOverlay().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
