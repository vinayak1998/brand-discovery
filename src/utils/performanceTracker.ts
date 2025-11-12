/**
 * Performance tracking utility for GA4 perf_ready event
 * Captures navigation timing, DOM load, and time-to-interactive
 */

export interface PerformanceMetrics {
  dom_load_time: number;
  full_load_time: number;
  time_to_interactive: number;
  page_path: string;
}

/**
 * Collect performance metrics from Navigation Timing API
 */
export const collectPerformanceMetrics = (): PerformanceMetrics | null => {
  if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  const navigationStart = timing.navigationStart;

  // DOM Content Loaded (DOMContentLoaded event)
  const domLoadTime = timing.domContentLoadedEventEnd - navigationStart;

  // Full Page Load (window.onload event)
  const fullLoadTime = timing.loadEventEnd - navigationStart;

  // Time to Interactive (approximate: domInteractive)
  const timeToInteractive = timing.domInteractive - navigationStart;

  return {
    dom_load_time: Math.round(domLoadTime),
    full_load_time: Math.round(fullLoadTime),
    time_to_interactive: Math.round(timeToInteractive),
    page_path: window.location.pathname,
  };
};

/**
 * Track performance when page is fully loaded
 * Use this in useEffect with window.onload or document.readyState check
 */
export const trackPerformanceWhenReady = (
  callback: (metrics: PerformanceMetrics) => void
): void => {
  if (typeof window === 'undefined') return;

  const captureMetrics = () => {
    // Wait a bit for timing data to be available
    setTimeout(() => {
      const metrics = collectPerformanceMetrics();
      if (metrics && metrics.full_load_time > 0) {
        callback(metrics);
      }
    }, 100);
  };

  if (document.readyState === 'complete') {
    captureMetrics();
  } else {
    window.addEventListener('load', captureMetrics, { once: true });
  }
};
