import { z } from 'zod';
import { MAX_REPORT_RANGE_DAYS } from '../application/services/report-filter-pipeline.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const reportSearchSchema = z
  .string()
  .trim()
  .min(2, 'search must be at least 2 characters')
  .optional();

export const reportPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reportSortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export const reportEntityFilterSchema = z.object({
  branchId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  includeArchived: z.coerce.boolean().default(false),
  search: reportSearchSchema,
});

export const reportExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf']),
  disposition: z.enum(['attachment', 'inline']).default('attachment'),
});

function validateDateRange(
  value: { from?: Date; to?: Date },
  ctx: z.RefinementCtx,
  required: boolean,
) {
  if (required) {
    if (!value.from) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'from is required', path: ['from'] });
    }
    if (!value.to) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'to is required', path: ['to'] });
    }
  } else if ((value.from && !value.to) || (!value.from && value.to)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'from and to must both be provided when using a date range',
      path: ['to'],
    });
  }
  if (value.from && value.to) {
    if (value.to < value.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'to must be greater than or equal to from',
        path: ['to'],
      });
    }
    const spanDays = (value.to.getTime() - value.from.getTime()) / MS_PER_DAY;
    if (spanDays > MAX_REPORT_RANGE_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date range cannot exceed ${MAX_REPORT_RANGE_DAYS} days`,
        path: ['to'],
      });
    }
  }
}

const requiredDateRangeBase = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .merge(reportEntityFilterSchema)
  .merge(reportPaginationSchema);

const optionalDateRangeBase = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .merge(reportEntityFilterSchema)
  .merge(reportPaginationSchema);

function withRequiredDateRange<T extends z.ZodRawShape>(sortShape: T) {
  return requiredDateRangeBase
    .extend(sortShape)
    .superRefine((value, ctx) => validateDateRange(value, ctx, true));
}

function withOptionalDateRange<T extends z.ZodRawShape>(sortShape: T) {
  return optionalDateRangeBase
    .extend(sortShape)
    .superRefine((value, ctx) => validateDateRange(value, ctx, false));
}

export const transactionReportQuerySchema = withRequiredDateRange({
  sortBy: z
    .enum(['transactionDate', 'transactionNumber', 'createdAt', 'partyName', 'status'])
    .default('transactionDate'),
  sortOrder: reportSortOrderSchema,
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  status: z.enum(['DRAFT', 'FINISHED', 'SUBMITTED', 'PAID', 'CANCELLED', 'REOPENED']).optional(),
  transactionNumber: z.string().trim().min(1).optional(),
});

export const tripReportQuerySchema = withRequiredDateRange({
  sortBy: z.enum(['scheduledStart', 'tripNumber', 'status', 'createdAt']).default('scheduledStart'),
  sortOrder: reportSortOrderSchema,
  status: z.enum(['DRAFT', 'SCHEDULED', 'STARTED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const expenseReportQuerySchema = withRequiredDateRange({
  sortBy: z.enum(['date', 'category', 'amount']).default('date'),
  sortOrder: reportSortOrderSchema,
  category: z.string().trim().min(1).optional(),
  referenceType: z.string().trim().min(1).optional(),
});

export const attendanceReportQuerySchema = withRequiredDateRange({
  sortBy: z.enum(['timeInAt', 'status']).default('timeInAt'),
  sortOrder: reportSortOrderSchema,
});

export const leaveReportQuerySchema = withRequiredDateRange({
  sortBy: z.enum(['leaveDate', 'leaveType', 'status']).default('leaveDate'),
  sortOrder: reportSortOrderSchema,
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
});

export const cashAdvanceReportQuerySchema = withRequiredDateRange({
  sortBy: z.enum(['issuedAt', 'createdAt', 'amount', 'status']).default('issuedAt'),
  sortOrder: reportSortOrderSchema,
  status: z.enum(['OUTSTANDING', 'SETTLED']).optional(),
});

export const payrollReportQuerySchema = withRequiredDateRange({
  sortBy: z.enum(['payPeriodStart', 'payPeriodEnd', 'status']).default('payPeriodStart'),
  sortOrder: reportSortOrderSchema,
  status: z.enum(['PAYABLE', 'PAID']).optional(),
});

export const employeeReportQuerySchema = withOptionalDateRange({
  sortBy: z.enum(['lastName', 'firstName', 'createdAt', 'employeeNumber']).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const branchReportQuerySchema = withOptionalDateRange({
  sortBy: z.enum(['name', 'createdAt', 'status']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const warehouseReportQuerySchema = withOptionalDateRange({
  sortBy: z.enum(['name', 'createdAt', 'status']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const vehicleReportQuerySchema = withOptionalDateRange({
  sortBy: z.enum(['plateNumber', 'createdAt', 'status']).default('plateNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE']).optional(),
});

export const transactionReportExportQuerySchema =
  transactionReportQuerySchema.and(reportExportSchema);
export const tripReportExportQuerySchema = tripReportQuerySchema.and(reportExportSchema);
export const expenseReportExportQuerySchema = expenseReportQuerySchema.and(reportExportSchema);
export const attendanceReportExportQuerySchema =
  attendanceReportQuerySchema.and(reportExportSchema);
export const leaveReportExportQuerySchema = leaveReportQuerySchema.and(reportExportSchema);
export const cashAdvanceReportExportQuerySchema =
  cashAdvanceReportQuerySchema.and(reportExportSchema);
export const payrollReportExportQuerySchema = payrollReportQuerySchema.and(reportExportSchema);
export const employeeReportExportQuerySchema = employeeReportQuerySchema.and(reportExportSchema);
export const branchReportExportQuerySchema = branchReportQuerySchema.and(reportExportSchema);
export const warehouseReportExportQuerySchema = warehouseReportQuerySchema.and(reportExportSchema);
export const vehicleReportExportQuerySchema = vehicleReportQuerySchema.and(reportExportSchema);

export type TransactionReportQuery = z.infer<typeof transactionReportQuerySchema>;
export type TripReportQuery = z.infer<typeof tripReportQuerySchema>;
export type ExpenseReportQuery = z.infer<typeof expenseReportQuerySchema>;
export type AttendanceReportQuery = z.infer<typeof attendanceReportQuerySchema>;
export type LeaveReportQuery = z.infer<typeof leaveReportQuerySchema>;
export type CashAdvanceReportQuery = z.infer<typeof cashAdvanceReportQuerySchema>;
export type PayrollReportQuery = z.infer<typeof payrollReportQuerySchema>;
export type EmployeeReportQuery = z.infer<typeof employeeReportQuerySchema>;
export type BranchReportQuery = z.infer<typeof branchReportQuerySchema>;
export type WarehouseReportQuery = z.infer<typeof warehouseReportQuerySchema>;
export type VehicleReportQuery = z.infer<typeof vehicleReportQuerySchema>;
