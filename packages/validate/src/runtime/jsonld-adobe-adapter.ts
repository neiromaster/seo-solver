import type { Diagnostic } from '@seo-solver/types/validate';
import { loadSchemaWithCache } from './schema-cache.js';

type AdobeIssue = {
  issueMessage?: string;
  severity?: 'ERROR' | 'WARNING';
  path?: Array<{ type?: string; index?: number; property?: string }>;
  fieldNames?: string[];
};

const ADOBE_PATTERNS: ReadonlyArray<readonly [pattern: RegExp, ruleId: string]> = [
  [/Property ".*?" for type ".*?" is not supported/i, 'unsupported-property'],
  [/Required attribute ".*?" is missing/i, 'required-missing'],
  [/Recommended attribute ".*?" is missing/i, 'recommended-missing'],
  [/Invalid value .* for property/i, 'invalid-value'],
  [/expects type ".*?" but got/i, 'type-mismatch'],
  [/Unknown type/i, 'unknown-type'],
];

export async function validateJsonLdWithAdobe(
  grouped: unknown,
  runtime: {
    enabled?: boolean;
    cacheFile?: string | null;
    refreshTtlMs?: number;
    schemaUrl?: string;
  } = {},
): Promise<Diagnostic[]> {
  if (!runtime.enabled) {
    return [];
  }

  const schema = await loadSchemaWithCache({
    cacheFile: runtime.cacheFile ?? null,
    refreshTtlMs: runtime.refreshTtlMs ?? 86_400_000,
    schemaUrl: runtime.schemaUrl ?? 'https://schema.org/version/latest/schemaorg-current-https.jsonld',
  });

  if (schema === null) {
    return [
      {
        severity: 'info',
        rule: 'jsonld/runtime-unavailable',
        message: 'JSON-LD runtime validation was unavailable and skipped',
      },
    ];
  }

  try {
    const AdobeValidator = await loadAdobeValidator();
    const validator = new AdobeValidator(schema);
    const issues = (await validator.validate(grouped)) as AdobeIssue[];
    return issues.map((issue) => ({
      severity: issue.severity === 'ERROR' ? 'error' : 'warning',
      rule: adobeRuleId(issue.issueMessage ?? 'issue'),
      message: issue.issueMessage ?? 'Structured data validation issue',
      path: serializeAdobePath(issue),
    }));
  } catch (error) {
    return [
      {
        severity: 'info',
        rule: 'jsonld/runtime-unavailable',
        message:
          error instanceof Error
            ? `JSON-LD runtime validation was unavailable and skipped: ${error.message}`
            : 'JSON-LD runtime validation was unavailable and skipped',
      },
    ];
  }
}

async function loadAdobeValidator(): Promise<
  new (
    schemaOrgJson?: unknown,
  ) => { validate(waeData: unknown): Promise<unknown[]> }
> {
  const module = (await import('@adobe/structured-data-validator')) as {
    default?:
      | (new (
          schemaOrgJson?: unknown,
        ) => { validate(waeData: unknown): Promise<unknown[]> })
      | { Validator?: new (schemaOrgJson?: unknown) => { validate(waeData: unknown): Promise<unknown[]> } };
  };

  if (typeof module.default === 'function') {
    return module.default;
  }

  if (typeof module.default === 'object' && module.default?.Validator) {
    return module.default.Validator;
  }

  throw new Error('Unable to load @adobe/structured-data-validator Validator export');
}

function serializeAdobePath(issue: AdobeIssue): string | undefined {
  if (issue.path && issue.path.length > 0) {
    return issue.path
      .map((segment) => {
        const parts = [segment.type, segment.index !== undefined ? `[${segment.index}]` : undefined, segment.property];
        return parts.filter(Boolean).join('.').replace('.[', '[');
      })
      .join('.');
  }

  return issue.fieldNames && issue.fieldNames.length > 0 ? issue.fieldNames[0] : undefined;
}

function adobeRuleId(issueMessage: string): string {
  for (const [pattern, id] of ADOBE_PATTERNS) {
    if (pattern.test(issueMessage)) {
      return `jsonld/adobe/${id}`;
    }
  }

  return `jsonld/adobe/${shortHash(issueMessage)}`;
}

function shortHash(value: string): string {
  let hash = 0;
  for (const char of value) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8) || 'issue';
}
