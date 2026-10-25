module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx vite preview --port 4173 --strictPort',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/u/demo',
        'http://localhost:4173/fallback.html',
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-gpu',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        interactive: ['warn', { maxNumericValue: 2500 }],
        'total-byte-weight': ['warn', { maxNumericValue: 2200000 }],
        'resource-summary:script:size': ['warn', { maxNumericValue: 1700000 }],
        'errors-in-console': ['error', { minScore: 0.9 }],
        'unused-javascript': ['warn', { maxLength: 4 }],
        'network-dependency-tree-insight': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
