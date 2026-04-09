/*
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
/**
 * Logger factory utility with environment-aware output.
 *
 * This is a plain factory function (not a Vue composable) since it does not
 * use any Vue reactivity APIs. It is intentionally placed in `utils/` rather
 * than `composables/` to reflect that distinction.
 *
 * - `log` and `warn` are suppressed in production builds (DEV only).
 * - `error` always fires so real errors are visible in production.
 *
 * Usage:
 *   const logger = createLogger('MyComponent');
 *   logger.log('mounted');        // prints "[MyComponent] mounted" in DEV only
 *   logger.warn('missing prop');  // prints "[MyComponent] missing prop" in DEV only
 *   logger.error('fetch failed'); // always prints "[MyComponent] fetch failed"
 *
 * @param {string} [prefix] - Optional context label shown as [prefix] in output
 * @returns {{ log: Function, warn: Function, error: Function }}
 */
export interface Logger {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export const createLogger = (prefix = ""): Logger => {
  const tag = prefix ? `[${prefix}]` : "";
  const debugEnabled =
    import.meta.env.DEV ||
    String(import.meta.env.VITE_DEBUG_LOGS).toLowerCase() === "true";

  return {
    log(...args: unknown[]): void {
      if (debugEnabled) {
        tag ? console.log(tag, ...args) : console.log(...args);
      }
    },
    warn(...args: unknown[]): void {
      if (debugEnabled) {
        tag ? console.warn(tag, ...args) : console.warn(...args);
      }
    },
    error(...args: unknown[]): void {
      tag ? console.error(tag, ...args) : console.error(...args);
    },
  };
};
