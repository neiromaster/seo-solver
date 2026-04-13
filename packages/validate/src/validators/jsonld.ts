import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { CanonicalData, JsonLdData, JsonLdEntry, OpenGraphData } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import type { Diagnostic } from '@seo-solver/types/validate';
import { validateJsonLdWithAdobe } from '../runtime/jsonld-adobe-adapter.js';
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

const ADOBE_PATTERNS: ReadonlyArray<readonly [pattern: RegExp, ruleId: string]> = [
  [/Property ".*?" for type ".*?" is not supported/i, 'unsupported-property'],
  [/Required attribute ".*?" is missing/i, 'required-missing'],
  [/Recommended attribute ".*?" is missing/i, 'recommended-missing'],
  [/Invalid value .* for property/i, 'invalid-value'],
  [/expects type ".*?" but got/i, 'type-mismatch'],
  [/Unknown type/i, 'unknown-type'],
];

export class JsonLdValidator {
  readonly type = 'jsonld';

  constructor(
    private readonly runtime: {
      enabled?: boolean;
      cacheFile?: string | null;
      refreshTtlMs?: number;
      schemaUrl?: string;
    } = {},
  ) {}

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
      id: 'jsonld/url-mismatch-canonical',
      severity: 'info',
      message: 'JSON-LD url does not match the canonical URL',
      check: (data, context) => {
        const canonical = findCanonicalEnvelope(context)?.data.canonical;
        if (!canonical) {
          return null;
        }

        const diagnostics = flattenJsonLdObjects(data)
          .map((entry) => ({ entry, url: getJsonLdString(entry.value, 'url') }))
          .filter(({ url }) => typeof url === 'string' && url !== canonical)
          .map(({ entry, url }) => ({ path: `${entry.path}.url`, expected: canonical, actual: url }));

        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
    {
      id: 'jsonld/name-mismatch-og-title',
      severity: 'info',
      message: 'JSON-LD name does not match og:title',
      check: (data, context) => {
        const ogTitle = getFirstOpenGraphValue(findOpenGraphEnvelope(context)?.data, 'og:title');
        if (!ogTitle) {
          return null;
        }

        const diagnostics = flattenJsonLdObjects(data)
          .filter((entry) => hasAnyType(entry.value, ['Article', 'Product']))
          .map((entry) => ({ entry, name: getJsonLdString(entry.value, 'name') }))
          .filter(({ name }) => typeof name === 'string' && name !== ogTitle)
          .map(({ entry, name }) => ({ path: `${entry.path}.name`, expected: ogTitle, actual: name }));

        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
    {
      id: 'jsonld/image-mismatch-og-image',
      severity: 'info',
      message: 'JSON-LD image does not match og:image',
      check: (data, context) => {
        const ogImage = getFirstOpenGraphValue(findOpenGraphEnvelope(context)?.data, 'og:image');
        if (!ogImage) {
          return null;
        }

        const diagnostics = flattenJsonLdObjects(data)
          .map((entry) => ({ entry, image: getJsonLdImage(entry.value) }))
          .filter(({ image }) => typeof image === 'string' && image !== ogImage)
          .map(({ entry, image }) => ({ path: `${entry.path}.image`, expected: ogImage, actual: image }));

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

    return await validateJsonLdWithAdobe(grouped, this.runtime);
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

function hasAnyType(value: Record<string, unknown>, expectedTypes: string[]): boolean {
  const types = new Set(getTypeValues(value));
  return expectedTypes.some((entry) => types.has(entry));
}

function getJsonLdString(value: Record<string, unknown>, key: string): string | null {
  const candidate = value[key];
  return typeof candidate === 'string' && candidate !== '' ? candidate : null;
}

function getJsonLdImage(value: Record<string, unknown>): string | null {
  const image = value.image;
  if (typeof image === 'string' && image !== '') {
    return image;
  }

  if (Array.isArray(image)) {
    return image.find((entry): entry is string => typeof entry === 'string' && entry !== '') ?? null;
  }

  if (typeof image === 'object' && image !== null) {
    const imageRecord = image as Record<string, unknown>;
    return typeof imageRecord.url === 'string' && imageRecord.url !== '' ? imageRecord.url : null;
  }

  return null;
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

function findCanonicalEnvelope(
  context: ExtractionEnvelope[] | undefined,
): ExtractionEnvelope<CanonicalData> | undefined {
  return context?.find((entry): entry is ExtractionEnvelope<CanonicalData> => entry.type === 'canonical');
}

function findOpenGraphEnvelope(
  context: ExtractionEnvelope[] | undefined,
): ExtractionEnvelope<OpenGraphData> | undefined {
  return context?.find((entry): entry is ExtractionEnvelope<OpenGraphData> => entry.type === 'opengraph');
}

function getFirstOpenGraphValue(data: OpenGraphData | undefined, key: string): string | null {
  if (!data) {
    return null;
  }

  const value = data[key];
  if (typeof value === 'string') {
    return value || null;
  }

  return Array.isArray(value) ? (value.find((entry) => entry !== '') ?? null) : null;
}
