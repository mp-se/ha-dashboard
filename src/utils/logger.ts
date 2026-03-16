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

  return {
    log(...args: unknown[]): void {
      if (import.meta.env.DEV) {
        tag ? console.log(tag, ...args) : console.log(...args);
      }
    },
    warn(...args: unknown[]): void {
      if (import.meta.env.DEV) {
        tag ? console.warn(tag, ...args) : console.warn(...args);
      }
    },
    error(...args: unknown[]): void {
      tag ? console.error(tag, ...args) : console.error(...args);
    },
  };
};
