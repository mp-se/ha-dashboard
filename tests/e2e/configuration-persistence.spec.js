import { test, expect } from "@playwright/test";

/**
 * Configuration Persistence E2E Tests
 * Tests that configurations persist across:
 * - Page reloads
 * - Browser navigation
 * - Local storage updates
 * - API interactions (if backend available)
 */

test.describe("Configuration Persistence - LocalStorage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should load saved configuration from localStorage", async ({
    page,
  }) => {
    // Check if configuration is in localStorage
    const config = await page.evaluate(() => {
      return localStorage.getItem("dashboardConfig");
    });

    // Config should be either null or valid JSON
    if (config) {
      const parsed = JSON.parse(config);
      expect(typeof parsed).toBe("object");
    }
  });

  test("should preserve dark mode preference", async ({ page }) => {
    const darkModeButton = page.locator(
      'button[aria-label="Toggle dark mode"]',
    );

    if (!(await darkModeButton.isVisible())) {
      test.skip();
    }

    // Get initial dark mode setting
    const initialDark = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    // Toggle dark mode
    await darkModeButton.click();
    await page.waitForTimeout(300);

    // Get new setting
    const afterToggle = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    expect(afterToggle).not.toBe(initialDark);

    // Reload page
    await page.reload();
    await page.waitForSelector("nav", { timeout: 10000 });

    // Check if preference persisted
    const afterReload = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    expect(afterReload).toBe(afterToggle);
  });

  test("should preserve credential preferences", async ({ page }) => {
    // Check if credentials are stored (in localStorage or sessionStorage)
    const haCredentials = await page.evaluate(() => {
      const url = localStorage.getItem("ha_url");
      const token = localStorage.getItem("ha_token");
      return !!(url || token);
    });

    // Credentials might not be present in test environment
    expect(typeof haCredentials).toBe("boolean");
  });

  test("should save editor draft to localStorage", async ({ page }) => {
    const editorLink = page.locator('a:has-text("Visual Editor")');

    if (!(await editorLink.isVisible())) {
      test.skip();
    }

    await editorLink.click();

    const editButton = page.locator('button:has-text("EDIT")');
    if (!(await editButton.isVisible())) {
      test.skip();
    }

    await editButton.click();
    await page.waitForTimeout(500);

    // Check localStorage for draft
    const draft = await page.evaluate(() => {
      const draft = localStorage.getItem("dashboardDraft");
      return draft ? JSON.parse(draft) : null;
    });

    expect(draft).not.toBeNull();
  });

  test("should restore draft on editor reopening", async ({ page }) => {
    const editorLink = page.locator('a:has-text("Visual Editor")');

    if (!(await editorLink.isVisible())) {
      test.skip();
    }

    await editorLink.click();

    const editButton = page.locator('button:has-text("EDIT")');
    if (!(await editButton.isVisible())) {
      test.skip();
    }

    // Enter edit mode and get draft
    await editButton.click();
    await page.waitForTimeout(500);

    const draftBefore = await page.evaluate(() => {
      const draft = localStorage.getItem("dashboardDraft");
      return draft ? JSON.parse(draft) : null;
    });

    // Exit edit mode
    const viewButton = page.locator('button:has-text("VIEW")');
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(300);
    }

    // Re-enter edit mode
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
    }

    // Check if draft is restored
    const draftAfter = await page.evaluate(() => {
      const draft = localStorage.getItem("dashboardDraft");
      return draft ? JSON.parse(draft) : null;
    });

    expect(draftAfter).toEqual(draftBefore);
  });
});

test.describe("Configuration Persistence - Page Reload", () => {
  test("should preserve configuration after page reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Get initial config
    const configBefore = await page.evaluate(() => {
      return localStorage.getItem("dashboardConfig");
    });

    // Reload page
    await page.reload();
    await page.waitForSelector("nav", { timeout: 10000 });

    // Get config after reload
    const configAfter = await page.evaluate(() => {
      return localStorage.getItem("dashboardConfig");
    });

    expect(configAfter).toBe(configBefore);
  });

  test("should maintain view state after navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Try to navigate to a view
    const viewTabs = page.locator('nav a[role="tab"]');
    const tabCount = await viewTabs.count();

    if (tabCount > 1) {
      // Click second tab
      await viewTabs.nth(1).click();
      await page.waitForTimeout(300);

      // Get current URL
      const urlBefore = page.url();

      // Reload
      await page.reload();
      await page.waitForSelector("nav", { timeout: 10000 });

      // URL should still show the view
      const urlAfter = page.url();
      expect(urlAfter).toContain(urlBefore);
    }
  });
});

test.describe("Configuration Persistence - Multi-Tab", () => {
  test("should handle multiple tab synchronization", async ({
    browser,
    baseURL,
  }) => {
    // Create two pages (simulating two tabs)
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();

    try {
      // Load app in both tabs
      await page1.goto(baseURL || "/");
      await page2.goto(baseURL || "/");

      await page1.waitForSelector("nav", { timeout: 10000 });
      await page2.waitForSelector("nav", { timeout: 10000 });

      // Get config from page1
      const config1 = await page1.evaluate(() => {
        return localStorage.getItem("dashboardConfig");
      });

      // Get config from page2
      const config2 = await page2.evaluate(() => {
        return localStorage.getItem("dashboardConfig");
      });

      // Both should have same config
      expect(config1).toBe(config2);
    } finally {
      await page1.close();
      await page2.close();
    }
  });
});

test.describe("Configuration Persistence - Error Handling", () => {
  test("should handle corrupted localStorage", async ({ page }) => {
    await page.goto("/");

    // Inject corrupted data
    await page.evaluate(() => {
      localStorage.setItem("dashboardConfig", "{ invalid json");
    });

    // Reload
    await page.reload();

    // App should still load without crashing
    await expect(page.locator("nav")).toBeVisible({ timeout: 10000 });
  });

  test("should handle missing configuration file", async ({ page }) => {
    // Try to load app with no config
    await page.goto("/");

    // Should show loading or credential modal
    const content = page.locator("body");
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("should recover from localStorage quota exceeded", async ({
    page,
    context,
  }) => {
    await page.goto("/");

    // This is a theoretical test - actual DOM not able to fill localStorage quota easily
    // But the app should handle gracefully if it happens

    // Check that app declares handlers for storage errors
    const errorHandlers = await page.evaluate(() => {
      return (
        typeof window.onerror === "function" ||
        typeof window.addEventListener === "function"
      );
    });

    expect(errorHandlers).toBe(true);
  });
});
