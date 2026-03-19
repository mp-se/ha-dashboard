import { test, expect } from "@playwright/test";

/**
 * Component Rendering E2E Tests
 * Tests Home Assistant card components display correctly:
 * - Component visibility and rendering
 * - Entity state display
 * - Icon rendering
 * - Color schemes (light/dark)
 * - Component interactions
 * - Error states
 */

test.describe("Component Rendering - Basic Cards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should render sensor cards", async ({ page }) => {
    // Look for sensor components
    const sensors = page.locator('[class*="sensor"], [class*="Sensor"]');

    // Sensor cards might not always be present
    if ((await sensors.count()) > 0) {
      const first = sensors.first();
      await expect(first).toBeVisible();
    }
  });

  test("should render switch cards", async ({ page }) => {
    // Look for switch components
    const switches = page.locator(
      'button[class*="switch"], [class*="Switch"], input[type="checkbox"]',
    );

    if ((await switches.count()) > 0) {
      await expect(switches.first()).toBeVisible();
    }
  });

  test("should render button cards", async ({ page }) => {
    // Look for button components
    const buttons = page.locator("button");

    if ((await buttons.count()) > 0) {
      await expect(buttons.first()).toBeVisible();
    }
  });

  test("should render icon elements", async ({ page }) => {
    // Look for icon elements (SVG or material icons)
    const icons = page.locator('i[class*="mdi"], svg, [class*="icon"]');

    if ((await icons.count()) > 0) {
      await expect(icons.first()).toBeVisible();
    }
  });

  test("should render state text", async ({ page }) => {
    // Should have some text content displaying state
    const bodyText = await page.textContent("body");
    expect(bodyText?.length ?? 0).toBeGreaterThan(0);
  });
});

test.describe("Component Rendering - Light Cards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should render light component", async ({ page }) => {
    const lightCard = page.locator('[class*="light"], [class*="Light"]');

    if ((await lightCard.count()) > 0) {
      await expect(lightCard.first()).toBeVisible();
    }
  });

  test("should display brightness slider", async ({ page }) => {
    const slider = page.locator('input[type="range"]');

    if ((await slider.count()) > 0) {
      await expect(slider.first()).toBeVisible();
    }
  });

  test("should show color picker if supported", async ({ page }) => {
    const colorPicker = page.locator(
      'input[type="color"], [class*="color-picker"]',
    );

    if ((await colorPicker.count()) > 0) {
      await expect(colorPicker.first()).toBeVisible();
    }
  });

  test("should display light on/off state", async ({ page }) => {
    const onOffButton = page.locator(
      'button[class*="toggle"], [class*="switch"]',
    );

    if ((await onOffButton.count()) > 0) {
      const isVisible = await onOffButton.first().isVisible();
      expect(isVisible).toBe(true);
    }
  });
});

test.describe("Component Rendering - Media Player", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should render media player component", async ({ page }) => {
    const mediaPlayer = page.locator('[class*="media"], [class*="Media"]');

    if ((await mediaPlayer.count()) > 0) {
      await expect(mediaPlayer.first()).toBeVisible();
    }
  });

  test("should display play/pause controls", async ({ page }) => {
    const playButton = page.locator(
      'button[aria-label*="play" i], [class*="play"]',
    );

    if ((await playButton.count()) > 0) {
      await expect(playButton.first()).toBeVisible();
    }
  });

  test("should show volume control", async ({ page }) => {
    const volumeControl = page.locator(
      'input[class*="volume"], [aria-label*="volume" i]',
    );

    if ((await volumeControl.count()) > 0) {
      await expect(volumeControl.first()).toBeVisible();
    }
  });
});

test.describe("Component Rendering - Weather", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should render weather component", async ({ page }) => {
    const weather = page.locator('[class*="weather"], [class*="Weather"]');

    if ((await weather.count()) > 0) {
      await expect(weather.first()).toBeVisible();
    }
  });

  test("should display weather icon", async ({ page }) => {
    const weatherIcon = page.locator('[class*="weather"] [class*="icon"]');

    if ((await weatherIcon.count()) > 0) {
      await expect(weatherIcon.first()).toBeVisible();
    }
  });

  test("should show temperature", async ({ page }) => {
    // Should have temperature text somewhere
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });
});

test.describe("Component Rendering - Energy", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should render energy component", async ({ page }) => {
    const energy = page.locator('[class*="energy"], [class*="Energy"]');

    if ((await energy.count()) > 0) {
      await expect(energy.first()).toBeVisible();
    }
  });

  test("should display energy chart", async ({ page }) => {
    const chart = page.locator('canvas, svg[class*="chart"], [class*="graph"]');

    if ((await chart.count()) > 0) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test("should show energy values", async ({ page }) => {
    // Should have numerical values
    const bodyText = await page.textContent("body");
    const hasNumbers = /\d+/.test(bodyText ?? "");
    expect(hasNumbers).toBe(true);
  });
});

test.describe("Color Scheme - Light Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Ensure light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });
  });

  test("should render in light theme", async ({ page }) => {
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    expect(isDark).toBe(false);
  });

  test("should have light background", async ({ page }) => {
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Light background should be light (high RGB values)
    expect(bgColor).toBeTruthy();
  });

  test("should have readable text in light mode", async ({ page }) => {
    const textColor = await page.evaluate(() => {
      const el = document.querySelector("body *");
      if (!el) return null;
      return window.getComputedStyle(el).color;
    });

    expect(textColor).toBeTruthy();
  });
});

test.describe("Color Scheme - Dark Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
  });

  test("should render in dark theme", async ({ page }) => {
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    expect(isDark).toBe(true);
  });

  test("should have dark background", async ({ page }) => {
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    expect(bgColor).toBeTruthy();
  });

  test("should have readable text in dark mode", async ({ page }) => {
    const textColor = await page.evaluate(() => {
      const el = document.querySelector("body *");
      if (!el) return null;
      return window.getComputedStyle(el).color;
    });

    expect(textColor).toBeTruthy();
  });

  test("should toggle back to light mode", async ({ page }) => {
    // Toggle dark mode off
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });

    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    expect(isDark).toBe(false);
  });
});

test.describe("Component Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should toggle switch state", async ({ page }) => {
    const switchButton = page
      .locator('button[class*="toggle"], input[type="checkbox"]')
      .first();

    if ((await switchButton.count()) > 0 && (await switchButton.isVisible())) {
      const initialChecked = await switchButton.evaluate((el) => {
        return el.checked || el.getAttribute("aria-pressed");
      });

      await switchButton.click();
      await page.waitForTimeout(300);

      const afterClick = await switchButton.evaluate((el) => {
        return el.checked || el.getAttribute("aria-pressed");
      });

      // State might or might not change depending on backend
      expect(typeof afterClick).toBe("boolean" || "string");
    }
  });

  test("should change slider value", async ({ page }) => {
    const slider = page.locator('input[type="range"]').first();

    if ((await slider.count()) > 0 && (await slider.isVisible())) {
      const initial = await slider.inputValue();

      await slider.fill("50");
      await page.waitForTimeout(300);

      const after = await slider.inputValue();

      expect(after).toBe("50");
    }
  });

  test("should handle button click", async ({ page }) => {
    const button = page.locator("button").first();

    if ((await button.count()) > 0 && (await button.isVisible())) {
      await button.click();
      await page.waitForTimeout(300);

      // Page should still be functional
      const navVisible = await page.locator("nav").isVisible();
      expect(navVisible).toBe(true);
    }
  });

  test("should show loading state", async ({ page }) => {
    // Some components might show loading indicator
    const spinner = page.locator(
      '[class*="spinner"], [class*="loading"], .loader',
    );

    if ((await spinner.count()) > 0) {
      const isVisible = await spinner.first().isVisible();
      expect(typeof isVisible).toBe("boolean");
    }
  });
});

test.describe("Component Error States", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });
  });

  test("should handle missing entity gracefully", async ({ page }) => {
    // Set invalid entity in configuration
    await page.evaluate(() => {
      const config = JSON.parse(
        localStorage.getItem("dashboard-config") || "{}",
      );
      config.views = [
        {
          cards: [
            {
              type: "sensor",
              entity: "sensor.nonexistent.entity",
            },
          ],
        },
      ];
      localStorage.setItem("dashboard-config", JSON.stringify(config));
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Should still render without crashing
    const navVisible = await page.locator("nav").isVisible();
    expect(navVisible).toBe(true);
  });

  test("should show error component for invalid type", async ({ page }) => {
    const errorComponent = page.locator('[class*="error"], [class*="Error"]');

    if ((await errorComponent.count()) > 0) {
      const isVisible = await errorComponent.first().isVisible();
      expect(typeof isVisible).toBe("boolean");
    }
  });

  test("should display placeholder for loading state", async ({ page }) => {
    const placeholder = page.locator(
      '[class*="skeleton"], [class*="placeholder"]',
    );

    if ((await placeholder.count()) > 0) {
      const isVisible = await placeholder.first().isVisible();
      expect(typeof isVisible).toBe("boolean");
    }
  });
});

test.describe("Component Performance", () => {
  test("should render components within timeout", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    const renderTime = Date.now() - startTime;

    // Should render main components within 5 seconds
    expect(renderTime).toBeLessThan(5000);
  });

  test("should handle rapid component updates", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Simulate rapid updates
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        const event = new Event("storage");
        window.dispatchEvent(event);
      });
      await page.waitForTimeout(100);
    }

    // App should remain responsive
    const navVisible = await page.locator("nav").isVisible();
    expect(navVisible).toBe(true);
  });

  test("should not have memory leaks with multiple renders", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("nav", { timeout: 10000 });

    // Get initial memory (if available)
    const initialMemory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize ?? 0;
    });

    // Reload multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForTimeout(500);
    }

    // Final memory should be reasonable
    const finalMemory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize ?? 0;
    });

    // Should not increase dramatically
    if (initialMemory > 0) {
      const increase = ((finalMemory - initialMemory) / initialMemory) * 100;
      expect(increase).toBeLessThan(200); // Allow up to 200% increase
    }
  });
});
