import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Diagnostic, ExtractionEnvelope, JsonLdData, JsonLdEntry } from '@seo-solver/types';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';

const SCHEMA_CACHE_FILE = join(homedir(), '.cache', 'seo-solver', 'schema-org.jsonld');
const SCHEMA_URL = 'https://schema.org/version/latest/schemaorg-all-https.jsonld';
const SCHEMA_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AdobeIssue = {
  issueMessage?: string;
  severity?: 'ERROR' | 'WARNING';
  path?: Array<{ type?: string; index?: number; property?: string }>;
  fieldNames?: string[];
};

type WaeData = {
  jsonld: Record<string, Record<string, unknown>[]>;
  microdata: Record<string, never[]>;
  rdfa: Record<string, never[]>;
  errors: unknown[];
};

export class JsonLdValidator {
  readonly type = 'jsonld';

  readonly rules: readonly RuleDefinition<JsonLdData>[] = [
    {
      id: 'jsonld/missing-context',
      severity: 'error',
      message: 'JSON-LD object is missing @context',
      check: (data) =>
        collectJsonLdObjects(
          data,
          (entry) => !hasContext(entry.value),
          'JSON-LD object is missing @context',
          '@context',
        ),
    },
    {
      id: 'jsonld/missing-type',
      severity: 'error',
      message: 'JSON-LD object is missing @type',
      check: (data) =>
        collectJsonLdObjects(data, (entry) => !hasType(entry.value), 'JSON-LD object is missing @type', '@type'),
    },
    {
      id: 'jsonld/empty-block',
      severity: 'warning',
      message: 'JSON-LD block is an empty object',
      check: (data) =>
        collectJsonLdObjects(
          data,
          (entry) => Object.keys(entry.value).length === 0,
          'JSON-LD block is an empty object',
        ),
    },
    {
      id: 'jsonld/duplicate-type',
      severity: 'info',
      message: 'Multiple JSON-LD blocks have the same @type',
      check: (data) => {
        const counts = new Map<string, number>();
        for (const entry of flattenJsonLdObjects(data)) {
          for (const type of getTypeValues(entry.value)) {
            counts.set(type, (counts.get(type) ?? 0) + 1);
          }
        }

        const diagnostics = [...counts.entries()].flatMap(([type, count]) =>
          count > 1 ? [{ actual: count, message: `Multiple JSON-LD blocks with @type '${type}'` }] : [],
        );
        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
    {
      id: 'jsonld/adobe/schema-unavailable',
      severity: 'warning',
      message: 'Schema.org schema is unavailable, so Adobe validation was skipped',
      check: () => null,
    },
    {
      id: 'jsonld/adobe/validation-failed',
      severity: 'warning',
      message: 'Adobe structured data validation failed and was skipped',
      check: () => null,
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<JsonLdData>,
    context?: ExtractionEnvelope[],
    options?: { disableAdobeValidation?: boolean; isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<Diagnostic[]> {
    const diagnostics = runRules(envelope, context, this.rules, options);
    const adobeDiagnostics = await this.validateWithAdobe(envelope.data, options);
    return [...diagnostics, ...adobeDiagnostics];
  }

  private async validateWithAdobe(
    data: JsonLdData,
    options?: { disableAdobeValidation?: boolean; isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<Diagnostic[]> {
    if (options?.disableAdobeValidation) {
      return [];
    }

    const grouped = toWaeData(data);
    if (Object.keys(grouped.jsonld).length === 0) {
      return [];
    }

    const schema = await loadSchemaOrgJson();
    if (schema === null) {
      return [
        {
          severity: 'warning',
          rule: 'jsonld/adobe/schema-unavailable',
          message: 'Schema.org schema is unavailable, so Adobe validation was skipped',
        },
      ];
    }

    try {
      const AdobeValidator = await loadAdobeValidator();
      const validator = new AdobeValidator(schema);
      const issues = (await validator.validate(grouped)) as AdobeIssue[];
      return issues.map((issue) => ({
        severity: issue.severity === 'ERROR' ? 'error' : 'warning',
        rule: `jsonld/adobe/${slugify(issue.issueMessage ?? 'issue')}`,
        message: issue.issueMessage ?? 'Structured data validation issue',
        path: serializeAdobePath(issue),
      }));
    } catch (error) {
      return [
        {
          severity: 'warning',
          rule: 'jsonld/adobe/validation-failed',
          message:
            error instanceof Error
              ? `Adobe structured data validation failed and was skipped: ${error.message}`
              : 'Adobe structured data validation failed and was skipped',
        },
      ];
    }
  }
}

export const jsonLdRuleCatalog = createRuleCatalog('jsonld', new JsonLdValidator().rules);

function collectJsonLdObjects(
  data: JsonLdData,
  predicate: (entry: { value: Record<string, unknown>; path: string }) => boolean,
  message: string,
  pathSuffix?: string,
) {
  const diagnostics = flattenJsonLdObjects(data)
    .filter(predicate)
    .map((entry) => ({ path: pathSuffix ? `${entry.path}.${pathSuffix}` : entry.path, message }));

  return diagnostics.length > 0 ? diagnostics : null;
}

function flattenJsonLdObjects(data: JsonLdData): Array<{ value: Record<string, unknown>; path: string }> {
  return data.flatMap((entry, index) => flattenJsonLdEntry(entry, `$[${index}]`));
}

function flattenJsonLdEntry(entry: JsonLdEntry, path: string): Array<{ value: Record<string, unknown>; path: string }> {
  if (Array.isArray(entry)) {
    return entry.flatMap((child, index) =>
      typeof child === 'object' && child !== null && !Array.isArray(child)
        ? [{ value: child as Record<string, unknown>, path: `${path}[${index}]` }]
        : [],
    );
  }

  return [{ value: entry, path }];
}

function hasContext(value: Record<string, unknown>): boolean {
  const context = value['@context'];
  if (typeof context !== 'string') {
    return false;
  }

  return ['https://schema.org', 'http://schema.org', 'https://schema.org/'].includes(context);
}

function hasType(value: Record<string, unknown>): boolean {
  const type = value['@type'];
  if (typeof type === 'string') {
    return type !== '';
  }

  return Array.isArray(type) && type.some((entry) => typeof entry === 'string' && entry !== '');
}

function getTypeValues(value: Record<string, unknown>): string[] {
  const type = value['@type'];
  if (typeof type === 'string') {
    return type === '' ? [] : [type];
  }

  if (!Array.isArray(type)) {
    return [];
  }

  return type.filter((entry): entry is string => typeof entry === 'string' && entry !== '');
}

function toWaeData(data: JsonLdData): WaeData {
  const grouped: Record<string, Record<string, unknown>[]> = {};

  for (const entry of flattenJsonLdObjects(data)) {
    for (const type of getTypeValues(entry.value)) {
      grouped[type] ??= [];
      grouped[type].push(entry.value);
    }
  }

  return {
    jsonld: grouped,
    microdata: {},
    rdfa: {},
    errors: [],
  };
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

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'issue'
  );
}

async function loadSchemaOrgJson(): Promise<unknown | null> {
  const cached = await readCachedSchema();
  if (cached.fresh) {
    return cached.value;
  }

  try {
    const response = await fetch(SCHEMA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema.org schema: ${response.status}`);
    }

    const json = await response.json();
    await mkdir(dirname(SCHEMA_CACHE_FILE), { recursive: true });
    await writeFile(SCHEMA_CACHE_FILE, JSON.stringify(json), 'utf8');
    return json;
  } catch {
    return cached.value;
  }
}

async function readCachedSchema(): Promise<{ value: unknown | null; fresh: boolean }> {
  try {
    const [contents, details] = await Promise.all([readFile(SCHEMA_CACHE_FILE, 'utf8'), stat(SCHEMA_CACHE_FILE)]);
    return {
      value: JSON.parse(contents) as unknown,
      fresh: Date.now() - details.mtimeMs < SCHEMA_TTL_MS,
    };
  } catch {
    return { value: null, fresh: false };
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
