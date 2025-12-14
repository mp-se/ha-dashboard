import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * NOTE: This script serves card-showcase.html using a simple Node.js HTTP server.
 * Do NOT use 'npm run dev' (Vite dev console) as it will serve the Vue app instead.
 *
 * To use this script:
 * 1. Start the server: node capture-card-variations.js
 * 2. The server will automatically start on port 8888
 * 3. Screenshots will be captured and saved to the /images directory
 */

// Card variations to capture - format: {cardId, cardName, variations: [{variantClass, filename}]}
const cardVariations = [
  {
    cardId: "card-halight",
    cardName: "halight",
    variations: [
      { variant: ".light-card.on", filename: "halight-on" },
      { variant: ".light-card:not(.on)", filename: "halight-off" },
    ],
  },
  {
    cardId: "card-hasensor",
    cardName: "hasensor",
    variations: [
      { variant: ".card:nth-child(1)", filename: "hasensor-single" },
      // For multi-sensor, capture the multi-sensor card
      { variant: "#hasensor-multi-card", filename: "hasensor-multiple" },
    ],
  },
  {
    cardId: "card-haweather",
    cardName: "haweather",
    variations: [{ variant: ".card:nth-child(1)", filename: "haweather" }],
  },
  {
    cardId: "card-habinarysensor",
    cardName: "habinarysensor",
    variations: [
      { variant: ".card:nth-child(1)", filename: "habinarysensor-on" },
      { variant: ".card:nth-child(2)", filename: "habinarysensor-off" },
    ],
  },
  {
    cardId: "card-hagauge",
    cardName: "hagauge",
    variations: [
      { variant: ".card:nth-child(1)", filename: "hagauge-high" },
      { variant: ".card:nth-child(2)", filename: "hagauge-medium" },
    ],
  },
  {
    cardId: "card-habutton",
    cardName: "habutton",
    variations: [{ variant: ".card:nth-child(1)", filename: "habutton" }],
  },
  {
    cardId: "card-haselect",
    cardName: "haselect",
    variations: [{ variant: ".card", filename: "haselect" }],
  },
  {
    cardId: "card-hasun",
    cardName: "hasun",
    variations: [{ variant: ".card", filename: "hasun" }],
  },
  {
    cardId: "card-haperson",
    cardName: "haperson",
    variations: [
      { variant: ".card:nth-child(1)", filename: "haperson-home" },
      { variant: ".card:nth-child(2)", filename: "haperson-away" },
    ],
  },
  {
    cardId: "card-haimage",
    cardName: "haimage",
    variations: [{ variant: ".card", filename: "haimage" }],
  },
  {
    cardId: "card-halink",
    cardName: "halink",
    variations: [{ variant: ".card", filename: "halink" }],
  },
  {
    cardId: "card-haroom",
    cardName: "haroom",
    variations: [{ variant: ".card", filename: "haroom" }],
  },
  {
    cardId: "card-haprinter",
    cardName: "haprinter",
    variations: [{ variant: ".card", filename: "haprinter" }],
  },
  {
    cardId: "card-hamediaplayer",
    cardName: "hamediaplayer",
    variations: [{ variant: ".media-card", filename: "hamediaplayer" }],
  },
  {
    cardId: "card-hasensorgraph",
    cardName: "hasensorgraph",
    variations: [{ variant: ".card", filename: "hasensorgraph" }],
  },
  {
    cardId: "card-haenergy",
    cardName: "haenergy",
    variations: [{ variant: ".card", filename: "haenergy" }],
  },
  {
    cardId: "card-haswitch",
    cardName: "haswitch",
    variations: [
      { variant: ".card:nth-child(1)", filename: "haswitch-on" },
      { variant: ".card:nth-child(2)", filename: "haswitch-off" },
    ],
  },
  {
    cardId: "card-hawarning-haerror",
    cardName: "hawarning-haerror",
    variations: [
      { variant: "#hawarning-card", filename: "hawarning" },
      { variant: "#haerror-card", filename: "haerror" },
    ],
  },
];

const imagesDir = path.join(__dirname, "images");

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function captureCardVariations() {
  // Start a simple HTTP server to serve the showcase
  const server = http.createServer((req, res) => {
    let filePath = path.join(
      __dirname,
      req.url === "/" ? "card-showcase.html" : req.url,
    );

    // Security: prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    // Serve the file
    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
    };

    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
    });
    res.end(fs.readFileSync(filePath));
  });

  const PORT = 8888;
  const serverPromise = new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(
        `📡 Server started on http://localhost:${PORT}/card-showcase.html`,
      );
      resolve();
    });
  });

  await serverPromise;

  // Now run the Playwright capture
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to match card display width
  await page.setViewportSize({ width: 600, height: 900 });

  const baseUrl = process.env.BASE_URL || "http://localhost:8888";
  const url = baseUrl.replace(/\/$/, "") + "/card-showcase.html";
  // Try a few times in case the server is still starting
  const maxRetries = 8;
  let lastErr = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url, { waitUntil: "load" });
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      console.log(
        `Waiting for server at ${url} (attempt ${i + 1}/${maxRetries}) ...`,
      );
      await page.waitForTimeout(500);
    }
  }
  if (lastErr) throw lastErr;

  // Allow filtering of which cards to capture via CARDS env var
  let wanted = null;
  if (process.env.CARDS) {
    wanted = new Set(process.env.CARDS.split(",").map((s) => s.trim()));
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
          if (variation.variant && variation.variant.startsWith("#")) {
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
          console.error(
            `✗ Failed to capture ${variation.filename}:`,
            error.message,
          );
        }
      }
    } catch (error) {
      console.error(
        `✗ Failed to process card ${cardConfig.cardId}:`,
        error.message,
      );
    }
  }

  await browser.close();
  server.close();
  console.log("✅ Done! Screenshots saved to /images directory");
}

captureCardVariations().catch(console.error);
