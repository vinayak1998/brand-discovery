/**
 * Centralized logging utility
 * Automatically gates logs based on environment
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info';

const isDev = import.meta.env.DEV;

/**
 * Log a message (only in development)
 */
export const log = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

/**
 * Log a warning (only in development)
 */
export const warn = (...args: any[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

/**
 * Log an error (always logged, even in production)
 */
export const error = (...args: any[]) => {
  console.error(...args);
};

/**
 * Log info (only in development)
 */
export const info = (...args: any[]) => {
  if (isDev) {
    console.info(...args);
  }
};

/**
 * Generic logger that respects environment
 */
export const logger = {
  log,
  warn,
  error,
  info,
};
