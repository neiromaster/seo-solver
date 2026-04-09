import type { ExtractionEnvelope, HeadingsData } from '@seo-solver/types';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules.js';

export class HeadingsValidator {
  readonly type = 'headings';

  readonly rules: readonly RuleDefinition<HeadingsData>[] = [
    {
      id: 'headings/missing-h1',
      severity: 'error',
      message: 'Page has no <h1> heading',
      check: (data) => (data.some((heading) => heading.level === 1) ? null : {}),
    },
    {
      id: 'headings/multiple-h1',
      severity: 'warning',
      message: 'Page has multiple <h1> headings',
      check: (data) => {
        const h1Count = data.filter((heading) => heading.level === 1).length;
        return h1Count > 1 ? { actual: h1Count, message: `Page has ${h1Count} <h1> headings (recommended: 1)` } : null;
      },
    },
    {
      id: 'headings/skipped-level',
      severity: 'warning',
      message: 'Heading level skipped',
      check: (data) => {
        const diagnostics = data.flatMap((heading, index) => {
          if (index === 0) {
            return [];
          }

          const previous = data[index - 1];
          if (!previous || heading.level <= previous.level + 1) {
            return [];
          }

          return [
            {
              path: `h${heading.level}:nth-of-type(${index + 1})`,
              expected: previous.level + 1,
              actual: heading.level,
              message: `Heading level skipped: <h${previous.level}> followed by <h${heading.level}>`,
            },
          ];
        });

        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
    {
      id: 'headings/empty-heading',
      severity: 'warning',
      message: 'Empty heading found',
      check: (data) => {
        const diagnostics = data.flatMap((heading, index) =>
          heading.text === ''
            ? [
                {
                  path: `h${heading.level}:nth-of-type(${index + 1})`,
                  message: `Empty <h${heading.level}> heading found`,
                },
              ]
            : [],
        );
        return diagnostics.length > 0 ? diagnostics : null;
      },
    },
    {
      id: 'headings/first-not-h1',
      severity: 'info',
      message: 'First heading is not <h1>',
      check: (data) =>
        data.length > 0 && data[0] && data[0].level !== 1
          ? {
              path: `h${data[0].level}:nth-of-type(1)`,
              actual: data[0].level,
              message: `First heading is <h${data[0].level}>, expected <h1>`,
            }
          : null,
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<HeadingsData>,
    _context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ): Promise<ReturnType<typeof runRules<HeadingsData>>> {
    return runRules(envelope, undefined, this.rules, options);
  }
}

export const headingsRuleCatalog = createRuleCatalog('headings', new HeadingsValidator().rules);
