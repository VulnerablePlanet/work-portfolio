export const REPORT_REASONS = [
  'spam',
  'harassment',
  'sexual',
  'violence',
  'copyright',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export function parseReportReason(value: string): ReportReason | null {
  return (REPORT_REASONS as readonly string[]).includes(value)
    ? (value as ReportReason)
    : null;
}
