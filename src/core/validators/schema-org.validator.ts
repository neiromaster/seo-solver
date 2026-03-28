import type { Ansis } from 'ansis';
import { bold, dim, green, red, yellow } from 'ansis';
import type { Schema, ValidationIssue } from '#types';

export async function validateSchemas(schemas: Schema[]): Promise<void> {
  const schemaOrgJson = await (await fetch('https://schema.org/version/latest/schemaorg-all-https.jsonld')).json();

  const schemasByType: Record<string, Schema[]> = {};
  for (const schema of schemas) {
    const type = String(schema['@type'] ?? 'undefined');
    if (!schemasByType[type]) {
      schemasByType[type] = [];
    }
    schemasByType[type].push(schema);
  }

  const extractedData = {
    jsonld: schemasByType,
    microdata: {},
    rdfa: {},
  };

  const validatorModule = await import('@adobe/structured-data-validator');
  const Validator = validatorModule.default;
  const validator = new Validator(schemaOrgJson);
  validator.debug = false;

  const results = await validator.validate(extractedData);

  if (results.length === 0) {
    console.log(`${green`✓ No validation errors found`}\n`);
    return;
  }

  const errors = results.filter((r: { severity: string }) => r.severity === 'ERROR');
  const warnings = results.filter((r: { severity: string }) => r.severity === 'WARNING');

  type GroupedIssue = ValidationIssue & { schemaKey: string; contextPath: string };

  const groupIssues = (issues: typeof results): Map<string, GroupedIssue[]> => {
    const grouped = new Map<string, GroupedIssue[]>();
    for (const issue of issues) {
      const path = (issue as { path?: Array<{ type: string; index: number }> }).path;
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
  };

  const printIssues = (issues: typeof results, color: Ansis, icon: string, label: string) => {
    const grouped = groupIssues(issues);
    console.log(`${color.bold`${label} (${issues.length}):`}\n`);

    for (const [schemaKey, schemaIssues] of grouped) {
      console.log(`  ${dim(schemaKey)}`);
      for (const issue of schemaIssues) {
        const fieldPath = issue.fieldNames.join('.');
        console.log(
          `    ${color(icon)} ${bold(fieldPath)}${issue.contextPath ? ` ${dim(`(${issue.contextPath})`)}` : ''}`,
        );
        console.log(`      ${issue.issueMessage}`);
        console.log();
      }
    }
  };

  if (errors.length > 0) {
    printIssues(errors, red, '✗', 'ERRORS');
  }

  if (warnings.length > 0) {
    printIssues(warnings, yellow, '⚠', 'WARNINGS');
  }
}
