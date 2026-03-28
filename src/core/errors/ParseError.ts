import { red } from 'ansis';
import { AppError } from './AppError';

export class ParseError extends AppError {
  readonly exitCode = 1;
  readonly userMessage: string;

  constructor(
    message: string,
    public readonly url: string,
    public readonly parseType: 'jsonld' | 'opengraph' | 'html',
    cause?: unknown,
  ) {
    super(message, cause);
    this.userMessage = `${red`Parse error`} (${parseType}) for ${url}`;
  }
}

export class JsonParseError extends ParseError {
  constructor(url: string, cause?: unknown) {
    super('Failed to parse JSON-LD', url, 'jsonld', cause);
  }
}

export class HtmlStructureError extends ParseError {
  constructor(url: string, details: string) {
    super(`Invalid HTML structure: ${details}`, url, 'html');
  }
}

export class NoDataFoundError extends AppError {
  readonly exitCode = 0;
  readonly userMessage: string;

  constructor(url: string, type: 'schemas' | 'opengraph') {
    super(`No ${type} found`);
    this.userMessage = `No ${type} found on ${url}`;
  }
}
