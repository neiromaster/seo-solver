import { bold, dim, green, red, yellow } from 'ansis';
import type { Schema, ValidationIssue } from '#types';

type ValidationSeverity = ValidationIssue['severity'];
type GroupedIssue = ValidationIssue & { schemaKey: string; contextPath: string };

export type ValidationReportSection = {
  severity: ValidationSeverity;
  label: 'ERRORS' | 'WARNINGS';
  icon: string;
  issues: ValidationIssue[];
  grouped: Map<string, GroupedIssue[]>;
};

export type ValidationReport = {
  success: boolean;
  sections: ValidationReportSection[];
};

export function groupSchemasByType(schemas: Schema[]): Record<string, Schema[]> {
  const schemasByType: Record<string, Schema[]> = {};
  for (const schema of schemas) {
    const type = String(schema['@type'] ?? 'undefined');
    if (!schemasByType[type]) {
      schemasByType[type] = [];
    }
    schemasByType[type].push(schema);
  }
  return schemasByType;
}

export function groupValidationIssues(issues: ValidationIssue[]): Map<string, GroupedIssue[]> {
  const grouped = new Map<string, GroupedIssue[]>();
  for (const issue of issues) {
    const path = issue.path;
    const root = path?.[0];
    const schemaKey = root ? `${root.type}[${root.index + 1}]` : 'unknown';

    const contextPath: string[] = [];
    if (path) {
      for (let i = 1; i < path.length; i++) {
        const p = path[i];
        if (!p) continue;
        const index = typeof p.index === 'number' ? `[${p.index + 1}]` : '';
        const part = p.type ? `${p.type}${index}` : index;
        contextPath.push(part);
      }
    }

    const groupedIssue: GroupedIssue = {
      ...issue,
      schemaKey,
      contextPath: contextPath.join(' → '),
    };

    if (!grouped.has(schemaKey)) grouped.set(schemaKey, []);
    grouped.get(schemaKey)?.push(groupedIssue);
  }
  return grouped;
}

export function buildValidationReport(results: ValidationIssue[]): ValidationReport {
  if (results.length === 0) {
    return { success: true, sections: [] };
  }

  const sections: ValidationReportSection[] = [];
  const errors = results.filter((r) => r.severity === 'ERROR');
  const warnings = results.filter((r) => r.severity === 'WARNING');

  if (errors.length > 0) {
    sections.push({
      severity: 'ERROR',
      label: 'ERRORS',
      icon: '✗',
      issues: errors,
      grouped: groupValidationIssues(errors),
    });
  }

  if (warnings.length > 0) {
    sections.push({
      severity: 'WARNING',
      label: 'WARNINGS',
      icon: '⚠',
      issues: warnings,
      grouped: groupValidationIssues(warnings),
    });
  }

  return { success: false, sections };
}

export function renderValidationReportLines(report: ValidationReport): string[] {
  if (report.success) {
    return [`${green`✓ No validation errors found`}\n`];
  }

  const lines: string[] = [];
  for (const section of report.sections) {
    const color = section.severity === 'ERROR' ? red : yellow;
    lines.push(`${color.bold`${section.label} (${section.issues.length}):`}\n`);

    for (const [schemaKey, schemaIssues] of section.grouped) {
      lines.push(`  ${dim(schemaKey)}`);
      for (const issue of schemaIssues) {
        const fieldPath = issue.fieldNames.join('.');
        lines.push(
          `    ${color(section.icon)} ${bold(fieldPath)}${issue.contextPath ? ` ${dim(`(${issue.contextPath})`)}` : ''}`,
        );
        lines.push(`      ${issue.issueMessage}`);
        lines.push('');
      }
    }
  }

  return lines;
}
