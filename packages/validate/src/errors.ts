export class ValidationError extends Error {
  readonly code?: string | undefined;
  readonly input?: string | undefined;

  constructor(message: string, code?: string, input?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
    this.code = code;
    this.input = input;
  }
}
