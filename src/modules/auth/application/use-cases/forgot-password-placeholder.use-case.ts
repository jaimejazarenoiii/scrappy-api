export class ForgotPasswordPlaceholderUseCase {
  async execute(): Promise<{ accepted: boolean }> {
    return { accepted: true };
  }
}
