import React, { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  domLoad: number; // DOM Content Loaded
  windowLoad: number; // Window Load
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  onPerformanceIssue?: (issue: string, value: number) => void;
  enabled?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onMetricsUpdate,
  onPerformanceIssue,
  enabled = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    domLoad: 0,
    windowLoad: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Observer pour le LCP (Largest Contentful Paint)
  const observeLCP = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        const newLcp = lastEntry.startTime;
        setMetrics(prev => ({ ...prev, lcp: newLcp }));
        
        // Alerte si LCP > 2.5s
        if (newLcp > 2500) {
          onPerformanceIssue?.('LCP trop lent', newLcp);
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    return observer;
  }, [onPerformanceIssue]);

  // Observer pour le FID (First Input Delay)
  const observeFID = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const firstInputEntry = entry as PerformanceEventTiming;
        const newFid = firstInputEntry.processingStart - firstInputEntry.startTime;
        setMetrics(prev => ({ ...prev, fid: newFid }));
        
        // Alerte si FID > 100ms
        if (newFid > 100) {
          onPerformanceIssue?.('FID trop élevé', newFid);
        }
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    return observer;
  }, [onPerformanceIssue]);

  // Observer pour le CLS (Cumulative Layout Shift)
  const observeCLS = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          setMetrics(prev => ({ ...prev, cls: clsValue }));
          
          // Alerte si CLS > 0.1
          if (clsValue > 0.1) {
            onPerformanceIssue?.('CLS trop élevé', clsValue);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    return observer;
  }, [onPerformanceIssue]);

  // Mesurer les métriques de base
  const measureBasicMetrics = useCallback(() => {
    if (!('performance' in window)) return;

    const perf = performance;
    const navigation = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const newMetrics = {
        ...metrics,
        ttfb: navigation.responseStart - navigation.requestStart,
        domLoad: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        windowLoad: navigation.loadEventEnd - navigation.loadEventStart
      };
      
      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Mesurer le FCP (First Contentful Paint)
  const measureFCP = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        const newFcp = fcpEntry.startTime;
        setMetrics(prev => ({ ...prev, fcp: newFcp }));
        
        // Alerte si FCP > 1.8s
        if (newFcp > 1800) {
          onPerformanceIssue?.('FCP trop lent', newFcp);
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
    return observer;
  }, [onPerformanceIssue]);

  // Optimisations automatiques basées sur les métriques
  const applyOptimizations = useCallback((currentMetrics: PerformanceMetrics) => {
    // Si LCP est lent, précharger les images critiques
    if (currentMetrics.lcp > 2000) {
      const criticalImages = document.querySelectorAll('img[data-critical="true"]');
      criticalImages.forEach(img => {
        (img as HTMLImageElement).loading = 'eager';
        (img as HTMLImageElement).setAttribute('fetchpriority', 'high');
      });
    }

    // Si FID est élevé, réduire les animations
    if (currentMetrics.fid > 100) {
      document.body.style.setProperty('--animation-duration', '0.1s');
    }

    // Si CLS est élevé, fixer les dimensions des images
    if (currentMetrics.cls > 0.1) {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.style.width || !img.style.height) {
          img.style.aspectRatio = '16/9';
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    setIsMonitoring(true);
    const observers: PerformanceObserver[] = [];

    // Démarrer tous les observers
    const lcpObserver = observeLCP();
    const fidObserver = observeFID();
    const clsObserver = observeCLS();
    const fcpObserver = measureFCP();

    if (lcpObserver) observers.push(lcpObserver);
    if (fidObserver) observers.push(fidObserver);
    if (clsObserver) observers.push(clsObserver);
    if (fcpObserver) observers.push(fcpObserver);

    // Mesurer les métriques de base après le chargement
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', measureBasicMetrics);
    } else {
      measureBasicMetrics();
    }

    window.addEventListener('load', measureBasicMetrics);

    // Appliquer les optimisations quand les métriques changent
    const interval = setInterval(() => {
      applyOptimizations(metrics);
    }, 5000);

    return () => {
      observers.forEach(observer => observer.disconnect());
      document.removeEventListener('DOMContentLoaded', measureBasicMetrics);
      window.removeEventListener('load', measureBasicMetrics);
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [enabled, observeLCP, observeFID, observeCLS, measureFCP, measureBasicMetrics, applyOptimizations, metrics]);

  // Composant invisible - juste pour la surveillance
  return null;
};

// Hook pour utiliser le moniteur de performance
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [issues, setIssues] = useState<Array<{ type: string; value: number; timestamp: number }>>([]);

  const handleMetricsUpdate = useCallback((newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
  }, []);

  const handlePerformanceIssue = useCallback((issue: string, value: number) => {
    setIssues(prev => [...prev, { type: issue, value, timestamp: Date.now() }]);
  }, []);

  return {
    metrics,
    issues,
    handleMetricsUpdate,
    handlePerformanceIssue
  };
}; 