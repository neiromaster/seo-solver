import type { SchemaOrgRuntimeIssue, SchemaOrgValidationRuntime } from '#adapters/validation';
import { AppError, type ExtractedDocument, type ValidationReport, type Validator } from '#kernel';

export class SchemaOrgValidator implements Validator {
  readonly id = 'schema-org';

  constructor(private readonly runtime: SchemaOrgValidationRuntime) {}

  async validate(document: ExtractedDocument): Promise<ValidationReport> {
    try {
      const issues = await this.runtime.validateJsonLd(groupSchemasByType(document));

      return {
        validatorId: this.id,
        documentKind: document.kind,
        ok: issues.length === 0,
        issues: issues.map(toValidationIssue),
      };
    } catch (error) {
      throw new AppError(`Schema.org validation failed for ${document.source.url}`, { cause: error });
    }
  }
}

function groupSchemasByType(document: ExtractedDocument): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};
  const schemas = document.data as Record<string, unknown>[];

  for (const schema of schemas) {
    const type = String(schema['@type'] ?? 'undefined');

    if (!result[type]) {
      result[type] = [];
    }

    result[type].push(schema);
  }

  return result;
}

function toValidationIssue(issue: SchemaOrgRuntimeIssue) {
  return {
    severity: issue.severity === 'ERROR' ? 'error' : 'warning',
    code: issue.fieldNames.join('.') || 'validation',
    message: issue.issueMessage,
    path: issue.path?.map(formatPathPart).join('.'),
  } satisfies ValidationReport['issues'][number];
}

function formatPathPart(part: NonNullable<SchemaOrgRuntimeIssue['path']>[number]): string {
  const { index } = part;
  const hasFiniteIndex = typeof index === 'number' && Number.isFinite(index);
  return hasFiniteIndex ? `${part.type}[${index + 1}]` : part.type;
}
