/**
 * Base application error with HTTP status code and error code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  /**
   * @param message - Client-safe error message
   * @param statusCode - HTTP status code
   * @param code - Machine-readable error code
   */
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
