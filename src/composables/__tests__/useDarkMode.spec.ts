import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDarkMode } from "../useDarkMode";

describe("useDarkMode", () => {
  beforeEach(() => {
    // Clear localStorage and reset DOM before each test
    localStorage.clear();
    document.documentElement.removeAttribute("data-bs-theme");
    document.documentElement.style.colorScheme = "";
  });

  it("should toggle dark mode from light to dark", () => {
    const { toggleDarkMode } = useDarkMode();
    const emitMock = vi.fn();

    toggleDarkMode(false, emitMock);

    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("ha-dashboard-dark-mode")).toBe("true");
    expect(emitMock).toHaveBeenCalledWith("update:darkMode", true);
  });

  it("should toggle dark mode from dark to light", () => {
    const { toggleDarkMode } = useDarkMode();
    const emitMock = vi.fn();

    toggleDarkMode(true, emitMock);

    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem("ha-dashboard-dark-mode")).toBe("false");
    expect(emitMock).toHaveBeenCalledWith("update:darkMode", false);
  });

  it("should set data-bs-theme attribute for Bootstrap theme switching", () => {
    const { toggleDarkMode } = useDarkMode();
    const emitMock = vi.fn();

    toggleDarkMode(false, emitMock);
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");

    toggleDarkMode(true, emitMock);
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("light");
  });

  it("should set colorScheme style for browser UI elements", () => {
    const { toggleDarkMode } = useDarkMode();
    const emitMock = vi.fn();

    toggleDarkMode(false, emitMock);
    expect(document.documentElement.style.colorScheme).toBe("dark");

    toggleDarkMode(true, emitMock);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("should persist dark mode preference to localStorage", () => {
    const { toggleDarkMode } = useDarkMode();
    const emitMock = vi.fn();

    toggleDarkMode(false, emitMock);
    expect(localStorage.getItem("ha-dashboard-dark-mode")).toBe("true");

    toggleDarkMode(true, emitMock);
    expect(localStorage.getItem("ha-dashboard-dark-mode")).toBe("false");
  });

  it("should clean up iOS focus state artifacts", () => {
    const { toggleDarkMode } = useDarkMode();

    // Create a dark mode toggle button
    const button = document.createElement("button");
    button.setAttribute("aria-label", "Toggle dark mode");
    button.style.outline = "2px solid blue";
    button.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    button.style.backgroundColor = "lightblue";
    document.body.appendChild(button);

    const emitMock = vi.fn();
    toggleDarkMode(false, emitMock);

    // Verify focus state was cleaned up
    // outline normalizes to "none" in the DOM
    expect(button.style.outline).toContain("none");
    expect(button.style.boxShadow).toBe("none");
    expect(button.style.backgroundColor).toBe("transparent");

    // Clean up
    document.body.removeChild(button);
  });

  it("should call emit with correct arguments", () => {
    const { toggleDarkMode } = useDarkMode();
    const emitMock = vi.fn();

    toggleDarkMode(false, emitMock);
    expect(emitMock).toHaveBeenCalledWith("update:darkMode", true);
    expect(emitMock).toHaveBeenCalledTimes(1);

    emitMock.mockClear();

    toggleDarkMode(true, emitMock);
    expect(emitMock).toHaveBeenCalledWith("update:darkMode", false);
    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it("should handle missing dark mode button gracefully", () => {
    const { toggleDarkMode } = useDarkMode();
    const emitMock = vi.fn();

    // No button exists in DOM
    expect(() => {
      toggleDarkMode(false, emitMock);
    }).not.toThrow();

    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
    expect(emitMock).toHaveBeenCalledWith("update:darkMode", true);
  });

  it("should return toggleDarkMode function", () => {
    const { toggleDarkMode } = useDarkMode();
    expect(typeof toggleDarkMode).toBe("function");
  });
});
