export interface PasswordStatusResponseDto {
  passwordChangeRequired: boolean;
  passwordChangedAt: string | null;
}
