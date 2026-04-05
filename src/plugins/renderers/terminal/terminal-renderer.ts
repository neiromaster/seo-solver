import { dim, green, red, yellow } from 'ansis';
import type { DiffChange, Renderer, RenderPayload, RenderResult, ValidationIssue, ValidationReport } from '#kernel';

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
        lines.push(...formatValidationReport(report));
        lines.push('');
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

function formatValidationReport(report: ValidationReport): string[] {
  if (report.issues.length === 0) {
    return [green(`✓ ${report.validatorId} — no issues`)];
  }

  const summary = summarizeIssues(report.issues);
  const lines = [
    report.ok ? green(`✓ ${report.validatorId} — ${summary}`) : red(`✗ ${report.validatorId} — ${summary}`),
  ];

  for (const group of groupIssuesByPath(report.issues)) {
    lines.push(yellow(`  ${group.path}`));

    for (const issue of group.issues) {
      lines.push(formatValidationIssue(issue));
    }
  }

  return lines;
}

function formatValidationIssue(issue: ValidationIssue): string {
  const colorize = getSeverityColor(issue.severity);
  return `    ${colorize(issue.severity)} • ${colorize(issue.code)}: ${dim(issue.message)}`;
}

function getSeverityColor(severity: ValidationIssue['severity']): (text: string) => string {
  if (severity === 'error') {
    return red;
  }

  if (severity === 'warning') {
    return yellow;
  }

  return green;
}

function summarizeIssues(issues: ValidationIssue[]): string {
  const counts = {
    error: 0,
    warning: 0,
    info: 0,
  } satisfies Record<ValidationIssue['severity'], number>;

  for (const issue of issues) {
    counts[issue.severity] += 1;
  }

  const parts: string[] = [];

  if (counts.error > 0) {
    parts.push(`${counts.error} error${counts.error === 1 ? '' : 's'}`);
  }

  if (counts.warning > 0) {
    parts.push(`${counts.warning} warning${counts.warning === 1 ? '' : 's'}`);
  }

  if (counts.info > 0) {
    parts.push(`${counts.info} info`);
  }

  return parts.join(', ');
}

function groupIssuesByPath(issues: ValidationIssue[]): Array<{ path: string; issues: ValidationIssue[] }> {
  const groups = new Map<string, ValidationIssue[]>();

  for (const issue of issues) {
    const path = issue.path ?? 'General';
    const existing = groups.get(path);

    if (existing) {
      existing.push(issue);
      continue;
    }

    groups.set(path, [issue]);
  }

  return [...groups.entries()].map(([path, groupedIssues]) => ({
    path,
    issues: groupedIssues,
  }));
}
