export abstract class AppError extends Error {
  abstract readonly exitCode: number;
  abstract readonly userMessage: string;

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = this.constructor.name;
  }

  format(): string {
    let output = `${this.userMessage}`;
    if (this.cause instanceof Error && this.cause.message !== this.message) {
      output += `\n\n  ${this.cause.message}`;
    }
    return output;
  }
}
