import { green, red, yellow } from 'ansis';
import type { DiffChange, Renderer, RenderPayload, RenderResult } from '#kernel';

export class TerminalRenderer implements Renderer<RenderPayload> {
  readonly id = 'terminal';

  async render(input: RenderPayload): Promise<RenderResult> {
    if (input.mode === 'inspect') {
      return {
        kind: 'text',
        content: `${green('Extracted')} ${input.document.kind} (${input.document.summary?.itemCount ?? 0})\n\n${JSON.stringify(input.document.data, null, 2)}`,
        exitCode: 0,
      };
    }

    if (input.mode === 'validate') {
      const lines = [`${green('Validated')} ${input.document.kind} (${input.document.summary?.itemCount ?? 0})`, ''];

      if (input.reports.length === 0) {
        lines.push(yellow('No validators configured'));
        return { kind: 'text', content: lines.join('\n'), exitCode: 0 };
      }

      for (const report of input.reports) {
        lines.push(report.ok ? green(`✓ ${report.validatorId}`) : red(`✗ ${report.validatorId}`));

        for (const issue of report.issues) {
          lines.push(`  [${issue.severity}] ${issue.code}: ${issue.message}`);
          if (issue.path) {
            lines.push(`    at ${issue.path}`);
          }
        }

        if (report.issues.length > 0) {
          lines.push('');
        }
      }

      return {
        kind: 'text',
        content: lines.join('\n').trimEnd(),
        exitCode: input.reports.every((report) => report.ok) ? 0 : 1,
      };
    }

    const lines = [`${input.diff.equal ? green('✓ No differences') : yellow('Differences found')}`, ''];
    for (const change of input.diff.changes) {
      lines.push(...formatChange(change));
    }

    return {
      kind: 'text',
      content: lines.join('\n').trimEnd(),
      exitCode: 0,
    };
  }
}

function formatChange(change: DiffChange): string[] {
  if (change.kind === 'added') {
    return [green(`+ ${change.path}: ${change.right ?? ''}`)];
  }

  if (change.kind === 'removed') {
    return [red(`- ${change.path}: ${change.left ?? ''}`)];
  }

  return [yellow(`~ ${change.path}`), red(`  - ${change.left ?? ''}`), green(`  + ${change.right ?? ''}`)];
}
