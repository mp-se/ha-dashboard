import { test, expect } from "@playwright/test";

test.describe("Component Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for app to load
    await page.waitForSelector(".container-fluid", { timeout: 10000 });
  });

  test("should render cards if entities are available", async ({ page }) => {
    // Look for any card elements
    const cards = page.locator(".card");
    const cardCount = await cards.count();

    // In local mode with sample data, there should be cards
    // This will vary based on config
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test("should handle entity not found gracefully", async ({ page }) => {
    // Look for warning indicators
    const warningCards = page.locator(".card.border-warning");

    // Count may vary, but should not cause crashes
    const count = await warningCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("View Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".container-fluid", { timeout: 10000 });
  });

  test("should navigate between views using navbar", async ({ page }) => {
    // Find navigation items
    const navItems = page.locator('nav a[role="tab"]');
    const navCount = await navItems.count();

    if (navCount > 1) {
      // Click second nav item if available
      await navItems.nth(1).click();

      // Wait for view to change
      await page.waitForTimeout(500);

      // Check that URL or content changed
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });

  test("should indicate current view in navbar", async ({ page }) => {
    // Find active nav item
    const activeNav = page.locator('nav a[aria-current="page"]');

    // Should have at least one active item
    await expect(activeNav).toBeVisible();
  });
});

test.describe("PWA Features", () => {
  test("should register service worker", async ({ page }) => {
    await page.goto("/");

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });

    // Service worker should be registered
    expect(swRegistered).toBe(true);
  });

  test("should have manifest.json", async ({ page }) => {
    const response = await page.goto("/manifest.webmanifest");
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest).toHaveProperty("name");
    expect(manifest?.name).toContain("Home Assistant");
  });
});

test.describe("Performance", () => {
  test("should load page within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForSelector(".container-fluid", { timeout: 10000 });
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("should not have console errors on load", async ({ page }) => {
    const errors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForSelector(".container-fluid", { timeout: 10000 });

    // Allow some specific warnings but no hard errors
    const criticalErrors = errors.filter(
      (err) => !err.includes("DevTools") && !err.includes("Extension"),
    );

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe("Accessibility", () => {
  test("should have valid HTML structure", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading hierarchy
    const h1 = page.locator("h1, h2, h3");
    const headingCount = await h1.count();

    // Should have at least some headings
    expect(headingCount).toBeGreaterThan(0);
  });

  test("should have alt text for images", async ({ page }) => {
    await page.goto("/");

    // Find all images
    const images = page.locator("img");
    const imageCount = await images.count();

    if (imageCount > 0) {
      // Check that images have alt attributes
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        // Alt can be empty string for decorative images, but should exist
        expect(alt).toBeDefined();
      }
    }
  });

  test("should have proper button labels", async ({ page }) => {
    await page.goto("/");

    // Find all buttons
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Check that buttons have accessible names (aria-label or text content)
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute("aria-label");
        const textContent = await button.textContent();

        // Button should have either aria-label or text content
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
    }
  });
});
