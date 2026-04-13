import type { Diagnostic } from './diagnostic';

export type ValidationResult = {
  type: string;
  source: string;
  diagnostics: Diagnostic[];
};
