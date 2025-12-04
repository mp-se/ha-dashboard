import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, 'images');

async function captureMultiSensorCard() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto('http://localhost:8888/card-showcase.html');

  try {
    // Scroll to the sensor section
    await page.locator('#card-hasensor').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Select the multi-sensor card by ID
    const element = await page.$('#hasensor-multi-card');
    
    if (element) {
      const boundingBox = await element.boundingBox();
      console.log('Multi-sensor card bounding box:', boundingBox);
      
      if (boundingBox) {
        const screenshotOptions = {
          path: path.join(imagesDir, `hasensor-multiple.png`),
          clip: {
            x: Math.max(0, boundingBox.x - 5),
            y: Math.max(0, boundingBox.y - 5),
            width: boundingBox.width + 10,
            height: boundingBox.height + 10,
          },
        };

        await page.screenshot(screenshotOptions);
        console.log('✓ Captured hasensor-multiple.png');
      }
    } else {
      console.log('✗ Multi-sensor card not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
}

captureMultiSensorCard();
