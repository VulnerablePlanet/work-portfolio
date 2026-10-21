module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost:4173/', 'http://localhost:4173/fallback.html'],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        port: 9222,
        chromeFlags: '--disable-gpu --no-sandbox',
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        interactive: ['warn', { maxNumericValue: 2500 }],
        'total-byte-weight': ['warn', { maxNumericValue: 2200000 }],
        'resource-summary:script:size': ['warn', { maxNumericValue: 1700000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
