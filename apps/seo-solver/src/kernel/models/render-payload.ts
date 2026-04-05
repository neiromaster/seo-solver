import type { DiffResult } from './diff-result';
import type { ExtractedDocument } from './extracted-document';
import type { ValidationReport } from './validation-report';

export type DiffRenderPayload = {
  mode: 'diff';
  extractorId: string;
  leftDocument: ExtractedDocument;
  rightDocument: ExtractedDocument;
  diff: DiffResult;
};

export type ValidateRenderPayload = {
  mode: 'validate';
  extractorId: string;
  document: ExtractedDocument;
  reports: ValidationReport[];
};

export type InspectRenderPayload = {
  mode: 'inspect';
  extractorId: string;
  document: ExtractedDocument;
};

export type RenderPayload = DiffRenderPayload | ValidateRenderPayload | InspectRenderPayload;
