module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/dashboard',
        'http://localhost:4173/cards',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
          cpuSlowdownMultiplier: 1
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        // Resource limits
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }], // 1MB
        'resource-summary:total:size': ['warn', { maxNumericValue: 3000000 }], // 3MB
        // Performance
        'unused-javascript': ['warn', { maxNumericValue: 0.2 }],
        'unused-css-rules': ['warn', { maxNumericValue: 0.2 }],
        'modern-image-formats': 'warn',
        'uses-webp-images': 'warn',
        'uses-optimized-images': 'warn',
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'uses-text-compression': 'error',
        'uses-long-cache-ttl': 'warn',
      }
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};


















