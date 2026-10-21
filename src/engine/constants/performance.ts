export const PERFORMANCE_BUDGETS = {
  desktop: {
    frameBudgetMs: 16.67,
    drawCalls: 100,
    initialPayloadMb: 2,
  },
  mobile: {
    frameBudgetMs: 33.33,
    drawCalls: 60,
    initialPayloadMb: 1.5,
  },
} as const;

