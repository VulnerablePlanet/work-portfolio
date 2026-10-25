import { describe, expect, it } from 'vitest';
import {
  parseReportReason,
  REPORT_REASONS,
} from '@/lib/moderation';

describe('moderación', () => {
  it('acepta los motivos permitidos', () => {
    for (const reason of REPORT_REASONS) {
      expect(parseReportReason(reason)).toBe(reason);
    }
  });

  it('rechaza motivos desconocidos', () => {
    expect(parseReportReason('doxxing')).toBeNull();
    expect(parseReportReason('')).toBeNull();
  });
});
