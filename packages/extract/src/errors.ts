export class ExtractionError extends Error {
  readonly extractorType: string;

  constructor(message: string, extractorType: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ExtractionError';
    this.extractorType = extractorType;
  }
}
