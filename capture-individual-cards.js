import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cards = [
  { id: 'card-halight', name: 'halight' },
  { id: 'card-haswitch', name: 'haswitch' },
  { id: 'card-hasensor', name: 'hasensor' },
  { id: 'card-haweather', name: 'haweather' },
  { id: 'card-habinarysensor', name: 'habinarysensor' },
  { id: 'card-hagauge', name: 'hagauge' },
  { id: 'card-habutton', name: 'habutton' },
  { id: 'card-haselect', name: 'haselect' },
  { id: 'card-hasun', name: 'hasun' },
  { id: 'card-haperson', name: 'haperson' },
  { id: 'card-haimage', name: 'haimage' },
  { id: 'card-halink', name: 'halink' },
  { id: 'card-haroom', name: 'haroom' },
  { id: 'card-haprinter', name: 'haprinter' },
  { id: 'card-hasensorgraph', name: 'hasensorgraph' },
  { id: 'card-haenergy', name: 'haenergy' },
];

const imagesDir = path.join(__dirname, 'images');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function captureCards() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to match card display width
  await page.setViewportSize({ width: 600, height: 900 });

  await page.goto('http://localhost:8888/card-showcase.html');

  for (const card of cards) {
    try {
      // Wait for the card section to be visible
      await page.waitForSelector(`#${card.id}`, { timeout: 5000 });

      // Scroll to the element to bring it into viewport
      await page.locator(`#${card.id}`).scrollIntoViewIfNeeded();
      
      // Wait a bit for the element to settle
      await page.waitForTimeout(300);

      // Get ONLY the first card within the showcase-grid
      const cardElement = await page.$(`#${card.id} .showcase-grid .card:first-child`);
      
      if (cardElement) {
        // Get the bounding box of just this card
        const boundingBox = await cardElement.boundingBox();
        
        if (boundingBox) {
          const screenshotOptions = {
            path: path.join(imagesDir, `${card.name}.png`),
            // Crop to just the first card with padding
            clip: {
              x: Math.max(0, boundingBox.x - 5),
              y: Math.max(0, boundingBox.y - 5),
              width: boundingBox.width + 10,
              height: boundingBox.height + 10,
            },
          };

          await page.screenshot(screenshotOptions);
          console.log(`✓ Saved: ${card.name}.png`);
        }
      }
    } catch (error) {
      console.error(`✗ Failed to capture ${card.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

captureCards().catch(console.error);
