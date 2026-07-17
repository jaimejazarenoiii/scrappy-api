import { formatPhDate } from '../datetime/philippine-time.js';

export type ReportExportDomain =
  | 'transactions'
  | 'trips'
  | 'expenses'
  | 'attendance'
  | 'leave'
  | 'cash-advances'
  | 'payroll'
  | 'employees'
  | 'branches'
  | 'warehouses'
  | 'vehicles';

export type ReportExportFormat = 'csv' | 'xlsx' | 'pdf';

function slugifyCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function formatDateSegment(date: Date | undefined): string {
  if (!date) return 'all';
  return formatPhDate(date).replaceAll('-', '');
}

export function buildExportFilename(
  domain: ReportExportDomain,
  companyName: string,
  from: Date | undefined,
  to: Date | undefined,
  format: ReportExportFormat,
): string {
  const slug = slugifyCompanyName(companyName) || 'company';
  const fromSeg = formatDateSegment(from);
  const toSeg = formatDateSegment(to);
  const ts = Math.floor(Date.now() / 1000);
  return `${domain}-${slug}-${fromSeg}-${toSeg}-${ts}.${format}`;
}
