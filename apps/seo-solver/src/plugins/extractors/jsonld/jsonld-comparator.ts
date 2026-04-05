import type { Comparator, DiffChange, DiffResult, ExtractedDocument } from '#kernel';
import { flattenSchema } from './flatten-schema';
import type { JsonLdSchema } from './jsonld-extractor';

export class JsonLdComparator implements Comparator {
  readonly id = 'jsonld-comparator';

  async compare(left: ExtractedDocument, right: ExtractedDocument): Promise<DiffResult> {
    const leftGroups = groupByType(asSchemas(left));
    const rightGroups = groupByType(asSchemas(right));
    const allTypes = [...new Set([...leftGroups.keys(), ...rightGroups.keys()])];
    const changes: DiffChange[] = [];

    for (const type of allTypes) {
      const leftSchemas = leftGroups.get(type) ?? [];
      const rightSchemas = rightGroups.get(type) ?? [];
      const maxCount = Math.max(leftSchemas.length, rightSchemas.length);

      for (let index = 0; index < maxCount; index += 1) {
        const leftSchema = leftSchemas[index];
        const rightSchema = rightSchemas[index];
        const scope = `${type}[${index}]`;

        if (!rightSchema) {
          changes.push(...toRemovedChanges(scope, leftSchema));
          continue;
        }

        if (!leftSchema) {
          changes.push(...toAddedChanges(scope, rightSchema));
          continue;
        }

        changes.push(...toChangedChanges(scope, leftSchema, rightSchema));
      }
    }

    return {
      comparatorId: this.id,
      documentKind: left.kind,
      equal: changes.length === 0,
      changes,
    };
  }
}

function asSchemas(document: ExtractedDocument): JsonLdSchema[] {
  return document.data as JsonLdSchema[];
}

function groupByType(schemas: JsonLdSchema[]): Map<string, JsonLdSchema[]> {
  const groups = new Map<string, JsonLdSchema[]>();

  for (const schema of schemas) {
    const rawType = schema['@type'];
    const type = rawType == null ? '__NO_TYPE__' : Array.isArray(rawType) ? String(rawType[0]) : String(rawType);
    const existing = groups.get(type);

    if (existing) {
      existing.push(schema);
    } else {
      groups.set(type, [schema]);
    }
  }

  return groups;
}

function toRemovedChanges(scope: string, schema: JsonLdSchema | undefined): DiffChange[] {
  if (!schema) {
    return [];
  }

  return Object.entries(flattenSchema(schema)).map(([path, value]) => ({
    kind: 'removed' as const,
    path: `${scope}.${path}`,
    left: String(value),
  }));
}

function toAddedChanges(scope: string, schema: JsonLdSchema | undefined): DiffChange[] {
  if (!schema) {
    return [];
  }

  return Object.entries(flattenSchema(schema)).map(([path, value]) => ({
    kind: 'added' as const,
    path: `${scope}.${path}`,
    right: String(value),
  }));
}

function toChangedChanges(scope: string, left: JsonLdSchema, right: JsonLdSchema): DiffChange[] {
  const leftFlat = flattenSchema(left);
  const rightFlat = flattenSchema(right);
  const keys = new Set([...Object.keys(leftFlat), ...Object.keys(rightFlat)]);
  const changes: DiffChange[] = [];

  for (const key of keys) {
    const leftValue = leftFlat[key];
    const rightValue = rightFlat[key];

    if (leftValue === undefined && rightValue !== undefined) {
      changes.push({
        kind: 'added',
        path: `${scope}.${key}`,
        right: String(rightValue),
      });
      continue;
    }

    if (leftValue !== undefined && rightValue === undefined) {
      changes.push({
        kind: 'removed',
        path: `${scope}.${key}`,
        left: String(leftValue),
      });
      continue;
    }

    if (leftValue !== rightValue) {
      changes.push({
        kind: 'changed',
        path: `${scope}.${key}`,
        left: String(leftValue ?? ''),
        right: String(rightValue ?? ''),
      });
    }
  }

  return changes;
}
