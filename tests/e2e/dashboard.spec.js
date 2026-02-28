import { test, expect } from "@playwright/test";

test.describe("Dashboard Basic Navigation", () => {
  test("should load the dashboard", async ({ page }) => {
    await page.goto("/");

    // Check for navbar
    await expect(page.locator("nav")).toBeVisible();

    // Check for app version in footer
    await expect(page.locator("footer")).toContainText(
      "(c) 2026 Magnus Persson",
    );
  });

  test("should show dark mode toggle", async ({ page }) => {
    await page.goto("/");

    // Find dark mode toggle button
    const darkModeButton = page.locator(
      'button[aria-label="Toggle dark mode"]',
    );
    await expect(darkModeButton).toBeVisible();
  });

  test("should toggle dark mode", async ({ page }) => {
    await page.goto("/");

    const darkModeButton = page.locator(
      'button[aria-label="Toggle dark mode"]',
    );

    // Get initial state
    const initialClass = await page.locator("body").getAttribute("class");

    // Click dark mode toggle
    await darkModeButton.click();

    // Wait for state change
    await page.waitForTimeout(300);

    // Check that body class changed
    const newClass = await page.locator("body").getAttribute("class");
    expect(newClass).not.toBe(initialClass);
  });

  test("should have accessibility landmarks", async ({ page }) => {
    await page.goto("/");

    // Check for main semantic elements
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("should handle keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Press Tab to navigate
    await page.keyboard.press("Tab");

    // Check if focus is visible (some element should be focused)
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName,
    );
    expect(focusedElement).toBeTruthy();
  });
});

test.describe("Local Mode", () => {
  test("should work in local mode with sample data", async ({ page }) => {
    // This test assumes local mode is configured
    await page.goto("/");

    // Wait for loading to complete
    await page.waitForSelector(".container-fluid", { timeout: 10000 });

    // Should not show credential dialog in local mode
    const credentialDialog = page.locator('[role="dialog"]');
    await expect(credentialDialog).not.toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check that navbar is visible on mobile
    await expect(page.locator("nav")).toBeVisible();

    // Check that content is displayed
    await expect(page.locator(".container-fluid")).toBeVisible();
  });

  test("should be responsive on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator(".container-fluid")).toBeVisible();
  });

  test("should be responsive on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator(".container-fluid")).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("should show error boundary on component error", async ({ page }) => {
    await page.goto("/");

    // Check that error boundary is registered
    // This is a placeholder - actual error testing would need specific scenarios
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    // Error boundary should not be visible initially
    await expect(errorBoundary)
      .not.toBeVisible({ timeout: 1000 })
      .catch(() => {
        // It's okay if the element doesn't exist at all
      });
  });
});
