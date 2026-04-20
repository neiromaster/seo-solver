import type { ExtractedPageError } from '@seo-solver/types/extract';
import type { Diagnostic } from '@seo-solver/types/validate';

export function toExtractErrorDiagnostics(
  errors: ExtractedPageError[],
  source: string,
): Array<{ type: string; source: string; diagnostics: Diagnostic[] }> {
  return errors.map((error) => ({
    type: error.extractor,
    source,
    diagnostics: [
      {
        severity: 'error',
        rule: `extract/${error.extractor}-warning`,
        message: error.message,
        ...(error.path ? { path: error.path } : {}),
      },
    ],
  }));
}
