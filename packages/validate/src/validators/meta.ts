import type { ExtractionEnvelope, MetaTagsData } from '@seo-solver/types/extract';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';

const TITLE_LIMIT = 60;
const TITLE_MIN = 10;
const DESCRIPTION_LIMIT = 160;
const DESCRIPTION_MIN = 50;

export class MetaTagsValidator {
  readonly type = 'meta';

  readonly rules: readonly RuleDefinition<MetaTagsData>[] = [
    {
      id: 'meta/title-missing',
      severity: 'error',
      message: '<title> tag is missing',
      check: (data) => (data.title === null ? {} : null),
    },
    {
      id: 'meta/title-empty',
      severity: 'error',
      message: '<title> tag is empty',
      check: (data) => (data.title === '' ? {} : null),
    },
    {
      id: 'meta/title-too-long',
      severity: 'warning',
      message: `Title exceeds ${TITLE_LIMIT} characters`,
      check: (data) =>
        typeof data.title === 'string' && data.title.length > TITLE_LIMIT
          ? {
              path: 'title',
              expected: TITLE_LIMIT,
              actual: data.title.length,
              message: `Title exceeds ${TITLE_LIMIT} characters (actual: ${data.title.length}). Search engines may truncate it`,
            }
          : null,
    },
    {
      id: 'meta/title-too-short',
      severity: 'info',
      message: 'Title is very short',
      check: (data) =>
        typeof data.title === 'string' && data.title !== '' && data.title.length < TITLE_MIN
          ? {
              path: 'title',
              actual: data.title.length,
              message: `Title is very short (${data.title.length} characters)`,
            }
          : null,
    },
    {
      id: 'meta/description-missing',
      severity: 'warning',
      message: 'Meta description is missing',
      check: (data) => (data.name.description === undefined ? {} : null),
    },
    {
      id: 'meta/description-too-long',
      severity: 'warning',
      message: `Meta description exceeds ${DESCRIPTION_LIMIT} characters`,
      check: (data) =>
        data.name.description !== undefined && data.name.description.length > DESCRIPTION_LIMIT
          ? {
              path: 'name.description',
              expected: DESCRIPTION_LIMIT,
              actual: data.name.description.length,
              message: `Meta description exceeds ${DESCRIPTION_LIMIT} characters (actual: ${data.name.description.length})`,
            }
          : null,
    },
    {
      id: 'meta/description-too-short',
      severity: 'info',
      message: 'Meta description is very short',
      check: (data) =>
        data.name.description !== undefined && data.name.description.length < DESCRIPTION_MIN
          ? {
              path: 'name.description',
              actual: data.name.description.length,
              message: `Meta description is very short (${data.name.description.length} characters)`,
            }
          : null,
    },
    {
      id: 'meta/viewport-missing',
      severity: 'warning',
      message: 'Viewport meta tag is missing (required for mobile)',
      check: (data) => (data.name.viewport === undefined ? {} : null),
    },
    {
      id: 'meta/charset-missing',
      severity: 'info',
      message: 'Charset declaration is missing',
      check: (data) => (data.charset === null ? {} : null),
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<MetaTagsData>,
    _context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<ReturnType<typeof runRules<MetaTagsData>>> {
    return runRules(envelope, undefined, this.rules, options);
  }
}

export const metaTagsRuleCatalog = createRuleCatalog('meta', new MetaTagsValidator().rules);
