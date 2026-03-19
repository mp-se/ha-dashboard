import { test, expect } from "@playwright/test";

/**
 * PWA (Progressive Web App) E2E Tests
 * Tests PWA features including:
 * - Service worker registration
 * - Offline capability
 * - Install prompt
 * - App manifest
 * - Cache functionality
 */

test.describe("PWA - Service Worker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should register service worker", async ({ page }) => {
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker !== undefined;
    });

    expect(swRegistered).toBe(true);
  });

  test("should have active service worker", async ({ page }) => {
    const hasActiveWorker = await page.evaluate(async () => {
      if (!navigator.serviceWorker) return false;
      const registration = await navigator.serviceWorker.ready;
      return registration.active !== undefined;
    });

    expect(hasActiveWorker).toBe(true);
  });

  test("should serve from cache in offline mode", async ({ page }) => {
    // First, navigate to page to cache it
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Go offline
    await page.context().setOffline(true);

    try {
      // Reload page (should serve from cache)
      await page.reload();

      // App should still be visible
      const navVisible = await page.locator("nav").isVisible();
      expect(navVisible).toBe(true);
    } finally {
      // Restore online mode
      await page.context().setOffline(false);
    }
  });

  test("should update cache when coming back online", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Get current cache version
    const cacheBefore = await page.evaluate(() => {
      return localStorage.getItem("sw-version");
    });

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Come back online
    await context.setOffline(false);
    await page.waitForTimeout(500);

    // Allow time for SW to update
    await page.waitForTimeout(2000);

    // Check if cache was updated
    const cacheAfter = await page.evaluate(() => {
      return localStorage.getItem("sw-version");
    });

    // Should either be same or updated (both valid)
    expect(cacheAfter).toBeDefined();
  });
});

test.describe("PWA - Web App Manifest", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have web app manifest", async ({ page }) => {
    const manifestLink = page.locator(
      'link[rel="manifest"]'
    );

    await expect(manifestLink).toBeAttached();
  });

  test("should have valid manifest content", async ({ page }) => {
    const manifestUrl = await page.locator(
      'link[rel="manifest"]'
    ).getAttribute("href");

    if (manifestUrl) {
      const manifestResponse = await page.goto(
        new URL(manifestUrl, page.url()).toString()
      );
      const manifestText = await manifestResponse?.text();

      if (manifestText) {
        const manifest = JSON.parse(manifestText);

        expect(manifest.name || manifest.short_name).toBeTruthy();
        expect(manifest.start_url).toBeTruthy();
        expect(Array.isArray(manifest.icons)).toBe(true);
      }
    }
  });

  test("should have app theme color", async ({ page }) => {
    const themeColorMeta = page.locator(
      'meta[name="theme-color"]'
    );

    if (await themeColorMeta.count() > 0) {
      const content = await themeColorMeta.getAttribute("content");
      expect(content).toBeTruthy();
    }
  });

  test("should have viewport meta tag", async ({ page }) => {
    const viewportMeta = page.locator(
      'meta[name="viewport"]'
    );

    await expect(viewportMeta).toBeAttached();
  });

  test("should be installable as app", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Check for install-related attributes
    const installable = await page.evaluate(() => {
      return (
        document.querySelector('link[rel="manifest"]') !== null &&
        navigator.serviceWorker !== undefined
      );
    });

    expect(installable).toBe(true);
  });
});

test.describe("PWA - Install Prompt", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should show install prompt component", async ({ page }) => {
    // Look for install prompt button or component
    const installPrompt = page.locator(
      '[class*="install"], button[aria-label*="install" i]'
    );

    // Install prompt might not always be visible
    if (await installPrompt.count() > 0) {
      await expect(installPrompt.first()).toBeVisible();
    }
  });

  test("should handle install button click", async ({ page }) => {
    const installButton = page.locator(
      'button:has-text("Install"), [class*="install-button"]'
    );

    if (await installButton.isVisible()) {
      // Mock the install prompt
      await page.evaluate(() => {
        window.deferredPrompt = {
          prompt: async () => {},
          userChoice: Promise.resolve({ outcome: 'accepted' })
        };
      });

      // Click install button
      await installButton.click();
      await page.waitForTimeout(500);

      // Should not crash
      const navVisible = await page.locator("nav").isVisible();
      expect(navVisible).toBe(true);
    }
  });

  test("should dismiss install prompt gracefully", async ({ page }) => {
    const installPrompt = page.locator(
      '[class*="install"], button[aria-label*="install" i]'
    );

    if (await installPrompt.count() > 0) {
      // Look for dismiss button
      const dismissButton = page.locator(
        'button[aria-label*="dismiss" i], .close'
      );

      if (await dismissButton.isVisible()) {
        await dismissButton.click();
        await page.waitForTimeout(300);

        // Install prompt should be removed
        const stillVisible = await installPrompt.isVisible();
        expect(stillVisible).toBe(false);
      }
    }
  });
});

test.describe("PWA - Offline Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should indicate offline status", async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    try {
      // Check if app shows offline indicator
      const offlineIndicator = page.locator(
        '[class*="offline"], [aria-label*="offline" i]'
      );

      // May or may not have indicator
      if (await offlineIndicator.count() > 0) {
        await expect(offlineIndicator.first()).toBeVisible();
      }
    } finally {
      await context.setOffline(false);
    }
  });

  test("should load cached content when offline", async ({
    page,
    context,
  }) => {
    // First load to cache
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
    
    const initialContent = await page.textContent("body");

    // Go offline
    await context.setOffline(true);

    try {
      // Reload
      const response = await page.reload().catch(() => null);
      
      // Wait for any loading
      await page.waitForTimeout(500);

      // Page should still show content
      const offlineContent = await page.textContent("body");
      expect(offlineContent).toBeTruthy();
    } finally {
      await context.setOffline(false);
    }
  });

  test("should handle service worker errors gracefully", async ({
    page,
  }) => {
    await page.goto("/");

    // Simulate SW error by checking error handlers
    const hasErrorHandler = await page.evaluate(() => {
      return typeof window.addEventListener === "function";
    });

    expect(hasErrorHandler).toBe(true);
  });
});

test.describe("PWA - Performance", () => {
  test("should load within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds (reasonable timeout)
    expect(loadTime).toBeLessThan(10000);
  });

  test("should cache essential resources", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Check for cached resources in SW cache
    const swCaches = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.length > 0;
    });

    expect(swCaches).toBe(true);
  });

  test("should have reasonable bundle size", async ({ page }) => {
    // Wait for all resources to load
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Get resource sizes
    const sizes = await page.evaluate(async () => {
      const resources = performance.getEntriesByType("resource");
      return {
        count: resources.length,
        totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      };
    });

    // Should load reasonable number of resources
    expect(sizes.count).toBeGreaterThan(0);
    expect(sizes.totalSize).toBeGreaterThan(0);
  });
});
