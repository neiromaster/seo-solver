export class ValidationError extends Error {
  readonly code?: string;
  readonly input?: string;

  constructor(message: string, code?: string, input?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
    this.code = code;
    this.input = input;
  }
}
