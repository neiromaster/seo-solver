import type { Severity } from '@seo-solver/types/validate';
import type { ValidationPipelineConfig } from '@seo-solver/types/validate-advanced';
import { validatePageBuiltIns } from '../basic-core/validate-page-built-ins.js';

export type ValidatePageOptions = {
  disableRules?: string[];
  severityOverrides?: Record<string, Severity>;
  runtime?: ValidationPipelineConfig['runtime'];
};

export async function validatePage(
  input: Parameters<typeof validatePageBuiltIns>[0],
  options: ValidatePageOptions = {},
) {
  return await validatePageBuiltIns(input, options);
}
