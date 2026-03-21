/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals using native Performance API
 * 
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms  
 * - CLS (Cumulative Layout Shift): < 0.1
 */

interface WebVitalMetric {
  value: number;
  name: string;
  id: string;
}

interface PerformanceMetrics {
  lcp?: WebVitalMetric;
  fid?: WebVitalMetric;
  cls?: WebVitalMetric;
  pageLoadTime?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  timeToFirstByte?: number;
}

export class PerformanceMonitoringService {
  private static metrics: PerformanceMetrics = {};
  private static initialized = false;
  private static clsValue = 0;
  private static clsEntries: PerformanceEntry[] = [];

  /**
   * Initialize performance monitoring using native APIs
   */
  static initialize() {
    if (this.initialized) return;
    this.initialized = true;

    // Setup monitoring
    this.setupNativeMonitoring();
    this.setupErrorTracking();
    this.setupResourceTiming();
    this.setupCLSTracking();

  }

  /**
   * Setup native Performance API monitoring
   */
  private static setupNativeMonitoring() {
    if (typeof window === 'undefined' || !window.performance) return;

    // Wait for page load to collect metrics
    window.addEventListener('load', () => {
      setTimeout(() => this.collectMetrics(), 100);
    });

    // Also collect after a delay (for SPA navigation)
    setTimeout(() => this.collectMetrics(), 3000);
  }

  /**
   * Collect metrics from Performance API
   */
  private static collectMetrics() {
    if (typeof window === 'undefined' || !window.performance) return;

    const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (perfData) {
      // Page Load Time
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      if (pageLoadTime > 0) {
        this.metrics.pageLoadTime = pageLoadTime;
      }

      // Time to First Byte
      if (perfData.responseStart && perfData.navigationStart) {
        this.metrics.timeToFirstByte = perfData.responseStart - perfData.navigationStart;
      }
    }

    // First Paint
    const fpEntries = window.performance.getEntriesByName('first-paint');
    if (fpEntries.length > 0) {
      this.metrics.firstPaint = (fpEntries[0] as PerformancePaintTiming).startTime;
    }

    // First Contentful Paint
    const fcpEntries = window.performance.getEntriesByName('first-contentful-paint');
    if (fcpEntries.length > 0) {
      this.metrics.firstContentfulPaint = (fcpEntries[0] as PerformancePaintTiming).startTime;
    }

    // Estimate LCP from largest image or text
    this.estimateLCP();

    // Estimate FID from event timing
    this.estimateFID();
  }

  /**
   * Estimate LCP from Performance Observer (if available)
   */
  private static estimateLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry.renderTime || lastEntry.loadTime) {
          this.metrics.lcp = {
            value: (lastEntry.renderTime || lastEntry.loadTime),
            name: 'LCP',
            id: 'lcp',
          };
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Stop observing after 5 seconds (LCP should be detected by then)
      setTimeout(() => observer.disconnect(), 5000);
    } catch (e) {
      // PerformanceObserver not supported
      console.debug('LCP observation not available');
    }
  }

  /**
   * Estimate FID from event timing entries
   */
  private static estimateFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        const firstInput = entries[0];
        
        if (firstInput && firstInput.processingStart) {
          const fid = firstInput.processingStart - firstInput.startTime;
          this.metrics.fid = {
            value: fid,
            name: 'FID',
            id: 'fid',
          };
        }
      });

      observer.observe({ entryTypes: ['first-input'] });

      // Stop after first input
      setTimeout(() => observer.disconnect(), 30000);
    } catch (e) {
      // PerformanceObserver not supported
      console.debug('FID observation not available');
    }
  }

  /**
   * Setup CLS tracking using PerformanceObserver
   */
  private static setupCLSTracking() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        
        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            this.clsValue += entry.value;
            this.clsEntries.push(entry);
          }
        }

        this.metrics.cls = {
          value: this.clsValue,
          name: 'CLS',
          id: 'cls',
        };
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.debug('CLS observation not available');
    }
  }

  /**
   * Setup error tracking
   */
  private static setupErrorTracking() {
    if (typeof window === 'undefined') return;

    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      // Filter out non-critical browser errors
      const ignoredMessages = [
        'ResizeObserver loop completed',
        'ResizeObserver loop',
        'NetworkError',
        'CancelledError',
        'User cancelled',
        'CoreLocationProvider',
        'kCLErrorLocationUnknown',
        'CoreLocation framework reported',
      ];

      const isIgnored = ignoredMessages.some(msg =>
        event.message?.includes(msg)
      );

      if (isIgnored) return;

      const errorData = {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        col: event.colno,
        timestamp: new Date().toISOString(),
      };

      console.error('🔴 JS Error:', errorData);
      this.sendToAnalytics('js_error', errorData);
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Filter out non-critical rejections
      const reason = String(event.reason);
      const ignoredReasons = [
        'CancelledError',
        'ResizeObserver',
        'NetworkError',
        'User cancelled',
        'CoreLocationProvider',
        'kCLErrorLocationUnknown',
        'CoreLocation framework reported',
      ];

      const isIgnored = ignoredReasons.some(msg => reason.includes(msg));
      if (isIgnored) return;

      const errorData = {
        reason: reason,
        timestamp: new Date().toISOString(),
      };

      console.error('🔴 Promise Rejection:', errorData);
      this.sendToAnalytics('promise_rejection', errorData);
    });
  }

  /**
   * Track resource timing (images, scripts, stylesheets)
   */
  private static setupResourceTiming() {
    window.addEventListener('load', () => {
      if (!window.performance || !window.performance.getEntriesByType) return;

      const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Analyze slow resources (> 1 second)
      const slowResources = resources.filter(r => r.duration > 1000);
      
      if (slowResources.length > 0) {
        console.warn('⚠️ Slow resources detected:', slowResources.slice(0, 3).map(r => ({
          name: r.name.split('/').pop(),
          duration: r.duration.toFixed(0) + 'ms',
          size: ((r.transferSize || 0) / 1024).toFixed(1) + 'KB',
        })));
      }
    });
  }

  /**
   * Send metrics to analytics (GA4, etc)
   */
  private static sendToAnalytics(metricName: string, data: any) {
    // Check if GA4 is available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', `perf_${metricName}`, {
        value: data.value || data,
        metric_name: metricName,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get current metrics
   */
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if metrics meet Google thresholds
   */
  static checkThresholds() {
    return {
      lcp: (this.metrics.lcp?.value || Infinity) < 2500,
      fid: (this.metrics.fid?.value || Infinity) < 100,
      cls: (this.metrics.cls?.value || Infinity) < 0.1,
      passing:
        ((this.metrics.lcp?.value || Infinity) < 2500) &&
        ((this.metrics.fid?.value || Infinity) < 100) &&
        ((this.metrics.cls?.value || Infinity) < 0.1),
    };
  }

  /**
   * Helper: Use requestIdleCallback for non-critical tasks
   */
  static scheduleIdleTask(callback: () => void) {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 1000);
    }
  }

  /**
   * Helper: Break long tasks to prevent FID issues
   */
  static async processLargeDataset<T>(items: T[], processor: (item: T) => void, batchSize = 100) {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      batch.forEach(processor);
      
      // Yield to browser
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    PerformanceMonitoringService.initialize();
  }, { once: true });
}
