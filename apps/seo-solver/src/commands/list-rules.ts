import { createValidationPipeline } from '@seo-solver/validate';
import { command } from 'cmd-ts';
import { formatFlag } from '../flags/format.js';
import { outputFlag } from '../flags/output.js';
import { quietFlag, verboseFlag } from '../flags/verbosity.js';
import { handleError } from '../shared/error-handler.js';
import { writeOutput } from '../shared/write-output.js';
import { resolveListRulesFormat } from '../types.js';

export const listRulesCommand = command({
  name: 'list-rules',
  description: 'List all available validation rules',
  args: {
    format: formatFlag,
    verbose: verboseFlag,
    quiet: quietFlag,
    output: outputFlag,
  },
  handler: async (args) => {
    try {
      const pipeline = createValidationPipeline();
      const rules = pipeline.rules;
      const format = resolveListRulesFormat(args.format);

      if (format === 'json') {
        await writeOutput(JSON.stringify(rules, null, 2), args.output);
        return;
      }

      const lines: string[] = [`Available rules (${rules.length}):`, ''];
      const grouped = new Map<string, (typeof rules)[number][]>();

      for (const rule of rules) {
        const group = grouped.get(rule.validator) ?? [];
        group.push(rule);
        grouped.set(rule.validator, group);
      }

      for (const [validator, group] of grouped) {
        lines.push(`── ${validator} ──`);

        for (const rule of group) {
          const severity = rule.severity.padEnd(7);
          lines.push(`  ${severity}  ${rule.rule}`);
        }

        lines.push('');
      }

      await writeOutput(lines.join('\n'), args.output);
    } catch (error) {
      handleError(error);
    }
  },
});
