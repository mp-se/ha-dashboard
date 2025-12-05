import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Card variations to capture - format: {cardId, cardName, variations: [{variantClass, filename}]}
const cardVariations = [
  { 
    cardId: 'card-halight', 
    cardName: 'halight',
    variations: [
      { variant: '.light-card.on', filename: 'halight-on' },
      { variant: '.light-card:not(.on)', filename: 'halight-off' }
    ]
  },
  { 
    cardId: 'card-hasensor', 
    cardName: 'hasensor',
    variations: [
      { variant: '.card:nth-child(1)', filename: 'hasensor-single' },
      // For multi-sensor, capture the multi-sensor card
      { variant: '#hasensor-multi-card', filename: 'hasensor-multiple' }
    ]
  },
  { 
    cardId: 'card-haweather', 
    cardName: 'haweather',
    variations: [
      { variant: '.card:nth-child(1)', filename: 'haweather' }
    ]
  },
  { 
    cardId: 'card-habinarysensor', 
    cardName: 'habinarysensor',
    variations: [
      { variant: '.card:nth-child(1)', filename: 'habinarysensor-on' },
      { variant: '.card:nth-child(2)', filename: 'habinarysensor-off' }
    ]
  },
  { 
    cardId: 'card-hagauge', 
    cardName: 'hagauge',
    variations: [
      { variant: '.card:nth-child(1)', filename: 'hagauge-high' },
      { variant: '.card:nth-child(2)', filename: 'hagauge-medium' }
    ]
  },
  { 
    cardId: 'card-habutton', 
    cardName: 'habutton',
    variations: [
      { variant: '.card:nth-child(1)', filename: 'habutton' }
    ]
  },
  { 
    cardId: 'card-haselect', 
    cardName: 'haselect',
    variations: [
      { variant: '.card', filename: 'haselect' }
    ]
  },
  { 
    cardId: 'card-hasun', 
    cardName: 'hasun',
    variations: [
      { variant: '.card', filename: 'hasun' }
    ]
  },
  { 
    cardId: 'card-haperson', 
    cardName: 'haperson',
    variations: [
      { variant: '.card:nth-child(1)', filename: 'haperson-home' },
      { variant: '.card:nth-child(2)', filename: 'haperson-away' }
    ]
  },
  { 
    cardId: 'card-haimage', 
    cardName: 'haimage',
    variations: [
      { variant: '.card', filename: 'haimage' }
    ]
  },
  { 
    cardId: 'card-halink', 
    cardName: 'halink',
    variations: [
      { variant: '.card', filename: 'halink' }
    ]
  },
  { 
    cardId: 'card-haroom', 
    cardName: 'haroom',
    variations: [
      { variant: '.card', filename: 'haroom' }
    ]
  },
  { 
    cardId: 'card-haprinter', 
    cardName: 'haprinter',
    variations: [
      { variant: '.card', filename: 'haprinter' }
    ]
  },
  { 
    cardId: 'card-hasensorgraph', 
    cardName: 'hasensorgraph',
    variations: [
      { variant: '.card', filename: 'hasensorgraph' }
    ]
  },
  { 
    cardId: 'card-haenergy', 
    cardName: 'haenergy',
    variations: [
      { variant: '.card', filename: 'haenergy' }
    ]
  },
  { 
    cardId: 'card-haswitch', 
    cardName: 'haswitch',
    variations: [
      { variant: '.card:nth-child(1)', filename: 'haswitch-on' },
      { variant: '.card:nth-child(2)', filename: 'haswitch-off' }
    ]
  },
  { 
    cardId: 'card-hawarning-haerror', 
    cardName: 'hawarning-haerror',
    variations: [
      { variant: '#hawarning-card', filename: 'hawarning' },
      { variant: '#haerror-card', filename: 'haerror' }
    ]
  }
];

const imagesDir = path.join(__dirname, 'images');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function captureCardVariations() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to match card display width
  await page.setViewportSize({ width: 600, height: 900 });

  const baseUrl = process.env.BASE_URL || 'http://localhost:8888';
  const url = baseUrl.replace(/\/$/, '') + '/card-showcase.html';
  // Try a few times in case the server is still starting
  const maxRetries = 8;
  let lastErr = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url, { waitUntil: 'load' });
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      console.log(`Waiting for server at ${url} (attempt ${i + 1}/${maxRetries}) ...`);
      await page.waitForTimeout(500);
    }
  }
  if (lastErr) throw lastErr;

  // Allow filtering of which cards to capture via CARDS env var
  let wanted = null;
  if (process.env.CARDS) {
    wanted = new Set(process.env.CARDS.split(',').map((s) => s.trim()));
  }
  for (const cardConfig of cardVariations) {
    if (wanted && !wanted.has(cardConfig.cardName)) continue;
    try {
      // Wait for the card section to be visible
      await page.waitForSelector(`#${cardConfig.cardId}`, { timeout: 5000 });

      // Scroll to the element to bring it into viewport
      await page.locator(`#${cardConfig.cardId}`).scrollIntoViewIfNeeded();
      
      // Wait a bit for the element to settle
      await page.waitForTimeout(300);

      for (const variation of cardConfig.variations) {
        try {
          let selector;
          // Check if variant starts with # (ID selector)
          if (variation.variant && variation.variant.startsWith('#')) {
            selector = variation.variant;
          } else if (variation.variant) {
            // For specific card variants
            selector = `#${cardConfig.cardId} .showcase-grid ${variation.variant}`;
          } else {
            // For single card or whole grid
            selector = `#${cardConfig.cardId} .showcase-grid .card:first-child`;
          }

          const element = await page.$(selector);
          
          if (element) {
            const boundingBox = await element.boundingBox();
            
            if (boundingBox) {
              const screenshotOptions = {
                path: path.join(imagesDir, `${variation.filename}.png`),
                clip: {
                  x: Math.max(0, boundingBox.x - 5),
                  y: Math.max(0, boundingBox.y - 5),
                  width: boundingBox.width + 10,
                  height: boundingBox.height + 10,
                },
              };

              await page.screenshot(screenshotOptions);
              console.log(`✓ Saved: ${variation.filename}.png`);
            }
          }
        } catch (error) {
          console.error(`✗ Failed to capture ${variation.filename}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`✗ Failed to process card ${cardConfig.cardId}:`, error.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

captureCardVariations().catch(console.error);
