import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWithTimeout, fetchJsonWithTimeout } from "../fetchWithTimeout.js";

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should successfully fetch data", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: "test" }),
      }),
    );

    const response = await fetchWithTimeout("https://example.com/api");

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("should pass through fetch options", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
      }),
    );

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "data" }),
    };

    await fetchWithTimeout("https://example.com/api", options);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        ...options,
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("should handle fetch errors", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

    await expect(fetchWithTimeout("https://example.com/api")).rejects.toThrow(
      "Network error",
    );
  });
});

describe("fetchJsonWithTimeout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch and parse JSON successfully", async () => {
    const testData = { success: true, data: [1, 2, 3] };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => testData,
      }),
    );

    const result = await fetchJsonWithTimeout("https://example.com/api");

    expect(result).toEqual(testData);
  });

  it("should throw on HTTP error status", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    await expect(
      fetchJsonWithTimeout("https://example.com/api"),
    ).rejects.toThrow(/HTTP error! status: 404 Not Found/);
  });

  it("should pass fetch options correctly", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: "ok" }),
      }),
    );

    const options = {
      method: "POST",
      headers: { Authorization: "Bearer token" },
    };

    await fetchJsonWithTimeout("https://example.com/api", options);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        ...options,
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("should handle invalid JSON", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      }),
    );

    await expect(
      fetchJsonWithTimeout("https://example.com/api"),
    ).rejects.toThrow(SyntaxError);
  });
});
