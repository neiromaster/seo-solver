import type { ComparisonReport, ComparisonResult } from '@seo-solver/types/compare';
import type {
  ComparePipelineCallOptions,
  ComparisonPipeline,
  ComparisonPipelineConfig,
} from '@seo-solver/types/compare-advanced';
import type {
  CanonicalData,
  ExtractedDataByTarget,
  ExtractedPage,
  HeadingsData,
  JsonLdData,
  MetaTagsData,
  OpenGraphData,
  RobotsTxtData,
  TargetKey,
} from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import { GenericComparator } from './comparators/generic.js';
import { HeadingsComparator } from './comparators/headings.js';
import { resolveComparator } from './comparators/registry.js';
import { filterDiffs } from './field-filter.js';

export function createComparisonPipeline(config: ComparisonPipelineConfig = {}): ComparisonPipeline {
  return {
    compare(envelopesA, envelopesB, options) {
      const pageSourceA = envelopesA[0]?.source ?? '';
      const pageSourceB = envelopesB[0]?.source ?? '';
      const effectiveConfig = mergeConfig(config, options);
      const orderedTypes = getOrderedTypes(envelopesA, envelopesB, effectiveConfig.types);

      return orderedTypes.map((type) => {
        const envelopeA = envelopesA.find((entry) => entry.type === type);
        const envelopeB = envelopesB.find((entry) => entry.type === type);

        if (!envelopeA) {
          return {
            type,
            sourceA: pageSourceA,
            sourceB: envelopeB?.source ?? pageSourceB,
            diffs: [{ kind: 'added', path: '', after: envelopeB?.data }],
          } satisfies ComparisonResult;
        }

        if (!envelopeB) {
          return {
            type,
            sourceA: envelopeA.source,
            sourceB: pageSourceB,
            diffs: [{ kind: 'removed', path: '', before: envelopeA.data }],
          } satisfies ComparisonResult;
        }

        const comparator = resolveComparator(type, effectiveConfig);
        const ignoreFields = effectiveConfig.ignoreFields?.[type] ?? [];

        return {
          type,
          sourceA: envelopeA.source,
          sourceB: envelopeB.source,
          diffs: filterDiffs(comparator.compare(envelopeA, envelopeB), ignoreFields),
        } satisfies ComparisonResult;
      });
    },
  };
}

export function compareAll(envelopesA: ExtractionEnvelope[], envelopesB: ExtractionEnvelope[]): ComparisonResult[] {
  return createComparisonPipeline().compare(envelopesA, envelopesB);
}

export function comparePages(
  left: ExtractedPage,
  right: ExtractedPage,
  options: {
    targets?: TargetKey[];
    ignoreFields?: Record<string, string[]>;
    ignoreArrayOrder?: boolean;
  } = {},
): ComparisonReport {
  const pipeline = createComparisonPipeline({
    ignoreArrayOrder: options.ignoreArrayOrder,
    ignoreFields: options.ignoreFields,
  });
  const comparisons = pipeline.compare(
    filterExtractions(toEnvelopes(left), options.targets),
    filterExtractions(toEnvelopes(right), options.targets),
    {
      ignoreFields: options.ignoreFields,
    },
  );

  return {
    urlA: left.source.url,
    urlB: right.source.url,
    timestamp: new Date().toISOString(),
    fetchA: {
      statusCode: left.source.statusCode,
      timing: left.source.timing,
    },
    fetchB: {
      statusCode: right.source.statusCode,
      timing: right.source.timing,
    },
    comparisons,
  };
}

export function compareOpenGraph(a: OpenGraphData, b: OpenGraphData) {
  return new GenericComparator('opengraph').compare(toEnvelope('opengraph', a), toEnvelope('opengraph', b));
}

export function compareJsonLd(a: JsonLdData, b: JsonLdData) {
  return new GenericComparator('jsonld', { pathPrefix: '$' }).compare(toEnvelope('jsonld', a), toEnvelope('jsonld', b));
}

export function compareMetaTags(a: MetaTagsData, b: MetaTagsData) {
  return new GenericComparator('meta').compare(toEnvelope('meta', a), toEnvelope('meta', b));
}

export function compareHeadings(a: HeadingsData, b: HeadingsData) {
  return new HeadingsComparator().compare(toEnvelope('headings', a), toEnvelope('headings', b));
}

export function compareCanonical(a: CanonicalData, b: CanonicalData) {
  return new GenericComparator('canonical').compare(toEnvelope('canonical', a), toEnvelope('canonical', b));
}

export function compareRobotsTxt(a: RobotsTxtData, b: RobotsTxtData) {
  return new GenericComparator('robots-txt').compare(toEnvelope('robots-txt', a), toEnvelope('robots-txt', b));
}

function toEnvelope<T>(type: string, data: T): ExtractionEnvelope<T> {
  return {
    type,
    source: '',
    data,
  };
}

function mergeConfig(
  config: ComparisonPipelineConfig,
  options: ComparePipelineCallOptions | undefined,
): ComparisonPipelineConfig {
  return {
    ...config,
    types: options?.types ?? config.types,
    ignoreFields: {
      ...(config.ignoreFields ?? {}),
      ...(options?.ignoreFields ?? {}),
    },
  };
}

function getOrderedTypes(
  envelopesA: ExtractionEnvelope[],
  envelopesB: ExtractionEnvelope[],
  selectedTypes?: string[],
): string[] {
  const ordered = [...envelopesA.map((entry) => entry.type), ...envelopesB.map((entry) => entry.type)];
  const unique = ordered.filter((type, index) => ordered.indexOf(type) === index);

  if (!selectedTypes) {
    return unique;
  }

  return selectedTypes.filter((type) => unique.includes(type));
}

function filterExtractions(envelopes: ExtractionEnvelope[], targets?: TargetKey[]): ExtractionEnvelope[] {
  if (!targets) {
    return envelopes;
  }

  const allowed = new Set<string>(targets.map((target) => (target === 'robotsTxt' ? 'robots-txt' : target)));
  return envelopes.filter((entry) => allowed.has(entry.type));
}

function toEnvelopes(page: ExtractedPage): ExtractionEnvelope[] {
  const envelopes: ExtractionEnvelope[] = [];

  for (const entry of [
    toPageEnvelope(page, 'canonical'),
    toPageEnvelope(page, 'headings'),
    toPageEnvelope(page, 'jsonld'),
    toPageEnvelope(page, 'meta'),
    toPageEnvelope(page, 'opengraph'),
    toPageEnvelope(page, 'robotsTxt'),
  ]) {
    if (entry !== null) {
      envelopes.push(entry);
    }
  }

  return envelopes;
}

function toPageEnvelope<K extends TargetKey>(
  page: ExtractedPage,
  target: K,
): ExtractionEnvelope<ExtractedDataByTarget[K]> | null {
  if (!(target in page.data)) {
    return null;
  }

  const data = page.data[target];
  if (data === null || data === undefined) {
    return null;
  }

  return {
    type: target === 'robotsTxt' ? 'robots-txt' : target,
    source: page.source.url,
    data,
  };
}
