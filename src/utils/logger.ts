/**
 * Centralized logging utility.
 * Suppresses log output when running in the 'test' environment.
 */
export const loggerUtil = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.info(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(...args);
    }
  },
};
