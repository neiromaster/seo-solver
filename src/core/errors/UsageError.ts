import { AppError } from './AppError';

export class UsageError extends AppError {
  readonly exitCode = 1;
  readonly userMessage: string;

  constructor(message: string) {
    super(message);
    this.userMessage = message;
  }
}
