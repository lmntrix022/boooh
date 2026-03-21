import React from 'react'
import ReactDOM from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persister } from './lib/queryClient'
import { PerformanceMonitoringService } from './services/performanceMonitoring'
import { initSentry, SentryErrorBoundary } from './lib/sentry'
import './config/i18n' // Initialiser i18n
import App from './App'
import './index.css'

// Initialize Sentry (AVANT tout le reste)
initSentry();

// Suppress CoreLocation errors from Google Maps (non-critical)
// These errors occur when location services are unavailable but don't affect functionality
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args.join(' ');
  // Filter out CoreLocation errors from Google Maps
  if (
    typeof message === 'string' &&
    (message.includes('CoreLocationProvider') ||
     message.includes('kCLErrorLocationUnknown') ||
     message.includes('CoreLocation framework reported'))
  ) {
    // Silently ignore - these are non-critical location errors from Google Maps
    return;
  }
  // Call original console.error for all other errors
  originalConsoleError.apply(console, args);
};

// Initialize performance monitoring
PerformanceMonitoringService.initialize();

// Log Core Web Vitals status on load
window.addEventListener('load', () => {
  // Give metrics time to be collected
  setTimeout(() => {
    const thresholds = PerformanceMonitoringService.checkThresholds();
    const metrics = PerformanceMonitoringService.getMetrics();
    
    // Log Core Web Vitals status
    console.log('📊 Core Web Vitals Status:', {
      lcp: { value: metrics.lcp?.value?.toFixed(2), passing: thresholds.lcp, target: '< 2.5s' },
      fid: { value: metrics.fid?.value?.toFixed(2), passing: thresholds.fid, target: '< 100ms' },
      cls: { value: metrics.cls?.value?.toFixed(2), passing: thresholds.cls, target: '< 0.1' },
      overall: thresholds.passing ? '✅ PASS' : '❌ NEEDS IMPROVEMENT'
    });
  }, 3000);
}, { once: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Une erreur est survenue</h1>
          <p>{error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite'}</p>
          <button onClick={resetError} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Réessayer
          </button>
        </div>
      )}
      showDialog={false}
    >
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
      >
        <App />
      </PersistQueryClientProvider>
    </SentryErrorBoundary>
  </React.StrictMode>
)
