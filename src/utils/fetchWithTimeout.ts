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
    throw new Error(
      `HTTP error! status: ${response.status} ${response.statusText}`,
    );
  }
  return await response.json();
};
