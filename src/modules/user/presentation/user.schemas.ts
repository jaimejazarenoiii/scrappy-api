import { z } from 'zod';

export const passwordMinLength = 8;

export function passwordConfirmationPair(
  passwordKey: string,
  confirmKey: string,
  minLength = passwordMinLength,
) {
  return z
    .object({
      [passwordKey]: z.string().min(minLength),
      [confirmKey]: z.string().min(minLength),
    })
    .superRefine((value, ctx) => {
      const password = value[passwordKey] as string;
      const confirm = value[confirmKey] as string;
      if (password !== confirm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [confirmKey],
          message: 'Password confirmation does not match.',
        });
      }
    });
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(passwordMinLength),
    confirmPassword: z.string().min(passwordMinLength),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Password confirmation does not match.',
      });
    }
    if (value.newPassword === value.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'New password must be different from the current password.',
      });
    }
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
