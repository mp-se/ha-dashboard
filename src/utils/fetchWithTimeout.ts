import { TIMEOUT_DEFAULT } from "./constants";

/**
 * Utility for making fetch requests with timeout support
 * Uses AbortController for proper request cancellation
 *
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 10000ms)
 * @returns {Promise<Response>} The fetch response
 * @throws {Error} Throws on timeout or fetch failure
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = TIMEOUT_DEFAULT,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Request timeout: Failed to fetch ${url} within ${timeout}ms`,
      );
    }

    const debugEnabled =
      (import.meta as any).env.DEV ||
      String((import.meta as any).env.VITE_DEBUG_LOGS).toLowerCase() === "true";
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    const shouldWrap =
      error instanceof Error &&
      (message.includes("Load failed") ||
        message.includes("Failed to fetch") ||
        message.includes("Network error"));

    if (debugEnabled) {
      const errorInfo = {
        url,
        timeout,
        name: error instanceof Error ? error.name : undefined,
        message,
        stack: error instanceof Error ? error.stack : undefined,
        code: error instanceof Error ? (error as any).code : undefined,
      };
      console.error("[fetchWithTimeout] request failed", errorInfo);
    }

    if (shouldWrap) {
      const extraDetail = message.includes("Load failed")
        ? " This often indicates a native WebView network/CORS/security failure when requesting from capacitor://localhost. Check Home Assistant CORS configuration and certificate trust."
        : "";
      const wrappedError = new Error(
        `[fetchWithTimeout] request failed for ${url}: ${message}${extraDetail}`,
      );
      if (error instanceof Error) {
        wrappedError.name = error.name;
        (wrappedError as any).stack = error.stack;
        (wrappedError as any).code = (error as any).code;
        (wrappedError as any).cause = error;
      }
      throw wrappedError;
    }

    throw error;
  }
};

/**
 * Fetch JSON with timeout support
 * Combines fetchWithTimeout with JSON parsing
 *
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 10000ms)
 * @returns {Promise<any>} The parsed JSON data
 * @throws {Error} Throws on timeout, fetch failure, or invalid JSON
 */
export const fetchJsonWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = TIMEOUT_DEFAULT,
): Promise<unknown> => {
  const response = await fetchWithTimeout(url, options, timeout);
  if (!response.ok) {
    let body = "<unable to read response body>";
    try {
      if (response && typeof (response as any).text === "function") {
        body = await (response as any).text().catch(() => "<unable to read response body>");
      }
    } catch (err) {
      body = "<unable to read response body>";
      void err;
    }

    throw new Error(
      `HTTP error! status: ${response.status} ${response.statusText} - ${body}`,
    );
  }
  return await response.json();
};
