import type { Diagnostic } from './diagnostic.js';

export type ValidationResult = {
  type: string;
  source: string;
  diagnostics: Diagnostic[];
};
