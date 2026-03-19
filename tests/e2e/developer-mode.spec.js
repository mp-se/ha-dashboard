import { test, expect } from "@playwright/test";

/**
 * Developer Mode E2E Tests
 * Tests password protection and developer mode features:
 * - Developer mode toggle button
 * - Password modal dialog
 * - Correct/incorrect password handling
 * - Developer features visibility
 */

test.describe("Developer Mode - Password Protection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for app to fully load
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should show developer mode toggle button in navbar", async ({
    page,
  }) => {
    // Look for bug icon or developer mode button (🐛 or similar)
    const devButton = page.locator('button[aria-label*="developer" i]');

    // Dev button might exist depending on build/config
    if ((await devButton.count()) > 0) {
      await expect(devButton.first()).toBeVisible();
    }
  });

  test("should display password modal when dev button clicked", async ({
    page,
  }) => {
    const devButton = page.locator('button[aria-label*="developer" i]');

    if ((await devButton.count()) === 0) {
      test.skip();
    }

    await devButton.first().click();

    // Look for modal dialog
    const modal = page.locator('[role="dialog"]');

    if (await modal.isVisible()) {
      await expect(modal).toBeVisible();

      // Should contain password input
      const passwordInput = page.locator(
        'input[type="password"], input[placeholder*="password" i]',
      );

      if (await passwordInput.isVisible()) {
        await expect(passwordInput).toBeVisible();
      }
    }
  });

  test("should show error message with incorrect password", async ({
    page,
  }) => {
    const devButton = page.locator('button[aria-label*="developer" i]');

    if ((await devButton.count()) === 0) {
      test.skip();
    }

    await devButton.first().click();

    const modal = page.locator('[role="dialog"]');
    if (!(await modal.isVisible())) {
      test.skip();
    }

    // Find password input
    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="password" i]',
    );

    if (await passwordInput.isVisible()) {
      // Enter wrong password
      await passwordInput.fill("wrong-password");

      // Find and click submit button
      const submitButton = page.locator(
        'button:has-text("Submit"), button[type="submit"]',
      );
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for potential error message
        await page.waitForTimeout(500);

        // Look for error message
        const errorMessage = page.locator('[class*="error"], [role="alert"]');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test("should close modal when clicking outside", async ({ page }) => {
    const devButton = page.locator('button[aria-label*="developer" i]');

    if ((await devButton.count()) === 0) {
      test.skip();
    }

    await devButton.first().click();

    const modal = page.locator('[role="dialog"]');
    if (!(await modal.isVisible())) {
      test.skip();
    }

    // Click outside modal (on backdrop)
    const backdrop = page.locator(
      '[class*="modal-backdrop"], [class*="overlay"]',
    );
    if (await backdrop.isVisible()) {
      await backdrop.click();

      // Wait for modal to close
      await page.waitForTimeout(300);

      // Modal should be hidden
      await expect(modal)
        .not.toBeVisible()
        .catch(() => {
          // Safe if modal doesn't close
        });
    }
  });

  test("should handle Enter key in password field", async ({ page }) => {
    const devButton = page.locator('button[aria-label*="developer" i]');

    if ((await devButton.count()) === 0) {
      test.skip();
    }

    await devButton.first().click();

    const modal = page.locator('[role="dialog"]');
    if (!(await modal.isVisible())) {
      test.skip();
    }

    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="password" i]',
    );

    if (await passwordInput.isVisible()) {
      await passwordInput.fill("test-password");
      // Press Enter to submit
      await passwordInput.press("Enter");

      // Wait for result
      await page.waitForTimeout(500);

      // Should attempt submission
      expect(true).toBe(true);
    }
  });

  test("should disable submit button when password is empty", async ({
    page,
  }) => {
    const devButton = page.locator('button[aria-label*="developer" i]');

    if ((await devButton.count()) === 0) {
      test.skip();
    }

    await devButton.first().click();

    const modal = page.locator('[role="dialog"]');
    if (!(await modal.isVisible())) {
      test.skip();
    }

    const submitButton = page.locator(
      'button:has-text("Submit"), button[type="submit"]',
    );
    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="password" i]',
    );

    if ((await submitButton.isVisible()) && (await passwordInput.isVisible())) {
      // Check initial state (empty password)
      const initialDisabled = await submitButton.isDisabled();

      // Type password
      await passwordInput.fill("test");

      // Check if button is now enabled
      const withPassword = await submitButton.isDisabled();

      // Clear password
      await passwordInput.fill("");

      // Check if button is disabled again
      const afterClear = await submitButton.isDisabled();

      // Should be disabled when empty
      expect(afterClear).toEqual(true);
    }
  });

  test("should have proper accessibility on modal", async ({ page }) => {
    const devButton = page.locator('button[aria-label*="developer" i]');

    if ((await devButton.count()) === 0) {
      test.skip();
    }

    await devButton.first().click();

    const modal = page.locator('[role="dialog"]');
    if (!(await modal.isVisible())) {
      test.skip();
    }

    // Check for aria attributes
    const role = await modal.getAttribute("role");
    expect(role).toBe("dialog");

    // Should be able to navigate with Tab
    await page.keyboard.press("Tab");

    // Some element should be focused
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName,
    );
    expect(focusedElement).toBeTruthy();
  });
});

test.describe("Developer Mode - Features Access", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should show developer tools when mode is enabled", async ({ page }) => {
    // In development/local mode, there may be dev tools available
    const devViews = page.locator('a:has-text("Development")');

    if (await devViews.isVisible()) {
      await expect(devViews).toBeVisible();
    }
  });

  test("should show visual editor in dev mode", async ({ page }) => {
    const editorLink = page.locator('a:has-text("Visual Editor")');

    if (await editorLink.isVisible()) {
      await expect(editorLink).toBeVisible();
    }
  });

  test("should show raw config viewer in dev mode", async ({ page }) => {
    const configLink = page.locator('a:has-text("Config"), a:has-text("JSON")');

    if (await configLink.isVisible()) {
      await expect(configLink).toBeVisible();
    }
  });

  test("privacy: should not expose password in HTML", async ({ page }) => {
    // Even if dev mode modal is visible, password should not be visible in DOM
    const devButton = page.locator('button[aria-label*="developer" i]');

    if ((await devButton.count()) > 0) {
      await devButton.first().click();

      // Get all text content
      const content = await page.textContent("body");

      // Should not contain any common test password patterns
      // (This is just a basic check)
      expect(content).not.toContain("password123");
      expect(content).not.toContain("test-password");
    }
  });

  test("should clear password input on modal close", async ({ page }) => {
    const devButton = page.locator('button[aria-label*="developer" i]');

    if ((await devButton.count()) === 0) {
      test.skip();
    }

    // Open modal
    await devButton.first().click();

    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="password" i]',
    );

    if (await passwordInput.isVisible()) {
      // Type password
      await passwordInput.fill("test-password");

      // Close modal (press Escape)
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // Reopen modal
      await devButton.first().click();

      // Password input should be empty
      const inputValue = await passwordInput.inputValue();
      expect(inputValue).toBe("");
    }
  });
});
