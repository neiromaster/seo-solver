import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import ansis from 'ansis';
import type { ValidationIssue } from '#types';
import {
  validateSchemas as actualValidateSchemas,
  buildValidationReport,
  groupSchemasByType,
  groupValidationIssues,
  loadDefaultValidatorModule,
  renderValidationReportLines,
  type ValidateSchemasDeps,
} from './schema-org.validator';

const mockValidate = mock(async () => [] as ValidationIssue[]);
let validateSchemas: typeof actualValidateSchemas;
let mockFetchImpl: FetchImpl;
const mockLoadValidatorModule = mock(async () => ({
  default: class MockValidator {
    debug = false;
    validate = mockValidate;
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type LogSpy = ReturnType<typeof spyOn<typeof console, 'log'>>;
type FetchImpl = ValidateSchemasDeps['fetchImpl'];

/** Return all console.log arguments joined as a single ANSI-stripped string. */
function strippedOutput(spy: LogSpy): string {
  return spy.mock.calls.map((args) => ansis.strip(String(args[0] ?? ''))).join('\n');
}

function createMockFetch(): FetchImpl {
  return mock(async () => ({
    json: mock(async () => ({})),
  })) as unknown as FetchImpl;
}

type PathEntry = { type: string; index: number } | null;

function makeIssue(
  severity: 'ERROR' | 'WARNING',
  path: PathEntry[] | undefined,
  fieldNames = ['fieldName'],
  issueMessage = 'Something went wrong',
): ValidationIssue {
  return {
    issueMessage,
    severity,
    path: path as ValidationIssue['path'],
    fieldNames,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateSchemas', () => {
  let logSpy: LogSpy;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
    mockValidate.mockReset();
    mockLoadValidatorModule.mockReset();
    mockLoadValidatorModule.mockResolvedValue({
      default: class MockValidator {
        debug = false;
        validate = mockValidate;
      },
    });
    mockFetchImpl = createMockFetch();

    const deps: ValidateSchemasDeps = {
      fetchImpl: mockFetchImpl,
      loadValidatorModule: mockLoadValidatorModule,
    };

    validateSchemas = (schemas) => actualValidateSchemas(schemas, deps);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  // ── No issues ─────────────────────────────────────────────────────────────

  describe('when the validator finds no issues', () => {
    test('prints the success message and makes exactly one log call', async () => {
      // Arrange
      mockValidate.mockResolvedValue([]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      expect(logSpy.mock.calls).toHaveLength(1);
      expect(strippedOutput(logSpy)).toContain('No validation errors found');
    });

    test('fetches schema.org data and loads the validator module once', async () => {
      // Arrange
      mockValidate.mockResolvedValue([]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      expect(mockFetchImpl).toHaveBeenCalledTimes(1);
      expect(mockFetchImpl).toHaveBeenCalledWith('https://schema.org/version/latest/schemaorg-all-https.jsonld');
      expect(mockLoadValidatorModule).toHaveBeenCalledTimes(1);
    });
  });

  // ── Schema grouping ────────────────────────────────────────────────────────

  describe('schema grouping by @type', () => {
    test('groups schemas without @type under the "undefined" key', async () => {
      // Arrange — schema has no @type property → falls back to the ?? 'undefined' branch
      mockValidate.mockResolvedValue([]);

      // Act
      await validateSchemas([{ name: 'No type here' }]);

      // Assert — validator was invoked, meaning grouping succeeded without throwing
      expect(mockValidate).toHaveBeenCalledTimes(1);
    });

    test('appends to an existing group when two schemas share the same @type', async () => {
      // Arrange — two schemas with the same @type exercise the `else` path in grouping
      mockValidate.mockResolvedValue([]);

      // Act
      await validateSchemas([
        { '@type': 'Article', name: 'First' },
        { '@type': 'Article', name: 'Second' },
      ]);

      // Assert
      expect(mockValidate).toHaveBeenCalledTimes(1);
    });
  });

  // ── Errors only ────────────────────────────────────────────────────────────

  describe('when there are only errors', () => {
    test('prints the ERRORS section', async () => {
      // Arrange
      mockValidate.mockResolvedValue([makeIssue('ERROR', undefined)]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      expect(strippedOutput(logSpy)).toContain('ERRORS');
    });

    test('does not print a WARNINGS section', async () => {
      // Arrange
      mockValidate.mockResolvedValue([makeIssue('ERROR', [{ type: 'Article', index: 0 }])]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      expect(strippedOutput(logSpy)).not.toContain('WARNINGS');
    });
  });

  // ── Warnings only ──────────────────────────────────────────────────────────

  describe('when there are only warnings', () => {
    test('prints the WARNINGS section', async () => {
      // Arrange
      mockValidate.mockResolvedValue([makeIssue('WARNING', [{ type: 'Product', index: 0 }])]);

      // Act
      await validateSchemas([{ '@type': 'Product' }]);

      // Assert
      expect(strippedOutput(logSpy)).toContain('WARNINGS');
    });

    test('does not print an ERRORS section', async () => {
      // Arrange
      mockValidate.mockResolvedValue([makeIssue('WARNING', undefined)]);

      // Act
      await validateSchemas([{ '@type': 'Product' }]);

      // Assert
      expect(strippedOutput(logSpy)).not.toContain('ERRORS');
    });
  });

  // ── Both errors and warnings ───────────────────────────────────────────────

  describe('when there are both errors and warnings', () => {
    test('prints both ERRORS and WARNINGS sections', async () => {
      // Arrange
      mockValidate.mockResolvedValue([
        makeIssue('ERROR', [{ type: 'Article', index: 0 }]),
        makeIssue('WARNING', [{ type: 'Article', index: 0 }]),
      ]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      const output = strippedOutput(logSpy);
      expect(output).toContain('ERRORS');
      expect(output).toContain('WARNINGS');
    });
  });

  // ── schemaKey resolution ───────────────────────────────────────────────────

  describe('schemaKey resolution', () => {
    test('uses "unknown" when path is undefined', async () => {
      // Arrange — undefined path → root is undefined → schemaKey = 'unknown'
      mockValidate.mockResolvedValue([makeIssue('ERROR', undefined)]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      expect(strippedOutput(logSpy)).toContain('unknown');
    });

    test('builds a 1-based schemaKey from the root path element', async () => {
      // Arrange — root has type='Article', index=2 → schemaKey='Article[3]'
      mockValidate.mockResolvedValue([makeIssue('ERROR', [{ type: 'Article', index: 2 }])]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      expect(strippedOutput(logSpy)).toContain('Article[3]');
    });

    test('groups multiple issues under the same schemaKey', async () => {
      // Arrange — same root path → both issues land in the same schemaKey bucket
      mockValidate.mockResolvedValue([
        makeIssue('ERROR', [{ type: 'Article', index: 0 }], ['name'], 'Error A'),
        makeIssue('ERROR', [{ type: 'Article', index: 0 }], ['description'], 'Error B'),
      ]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      const output = strippedOutput(logSpy);
      expect(output).toContain('name');
      expect(output).toContain('description');
    });
  });

  // ── contextPath building ───────────────────────────────────────────────────

  describe('contextPath building', () => {
    test('produces no contextPath when path has only the root element', async () => {
      // Arrange — path length = 1 → loop body never executes → contextPath = ''
      mockValidate.mockResolvedValue([makeIssue('ERROR', [{ type: 'Article', index: 0 }])]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert — the field output line should not contain a parenthesised context
      const fieldLine = logSpy.mock.calls
        .map((args) => ansis.strip(String(args[0] ?? '')))
        .find((line) => line.includes('fieldName'));
      expect(fieldLine).toBeDefined();
      expect(fieldLine).not.toContain('(');
    });

    test('includes type and 1-based index for a normal secondary path element', async () => {
      // Arrange — path[1] has type='author', index=1 → contextPath part = 'author[2]'
      mockValidate.mockResolvedValue([
        makeIssue('ERROR', [
          { type: 'Article', index: 0 },
          { type: 'author', index: 1 },
        ]),
      ]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert
      expect(strippedOutput(logSpy)).toContain('author[2]');
    });

    test('omits the index bracket when a path element index is not a number', async () => {
      // Arrange — index is undefined (not typeof 'number') → index part = '' → part = 'name'
      mockValidate.mockResolvedValue([
        makeIssue('ERROR', [
          { type: 'Article', index: 0 },
          { type: 'name', index: undefined as unknown as number },
        ]),
      ]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert — contextPath is 'name', rendered as '(name)'
      expect(strippedOutput(logSpy)).toContain('(name)');
    });

    test('shows only the index bracket when a path element type is an empty string', async () => {
      // Arrange — type = '' (falsy) → part = index bracket only → '[5]'
      mockValidate.mockResolvedValue([
        makeIssue('ERROR', [
          { type: 'Article', index: 0 },
          { type: '', index: 4 },
        ]),
      ]);

      // Act
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert — contextPath is '[5]', rendered as '([5])'
      expect(strippedOutput(logSpy)).toContain('[5]');
    });

    test('skips null elements in the path array', async () => {
      // Arrange — null at path[1] exercises the !p continue branch; path[2] is valid
      mockValidate.mockResolvedValue([
        makeIssue('ERROR', [{ type: 'Article', index: 0 }, null, { type: 'field', index: 0 }]),
      ]);

      // Act — must not throw
      await validateSchemas([{ '@type': 'Article' }]);

      // Assert — null was skipped; 'field[1]' still appears in the contextPath
      expect(strippedOutput(logSpy)).toContain('field[1]');
    });
  });
});

describe('loadDefaultValidatorModule', () => {
  test('loads the installed structured-data-validator module', async () => {
    // Act
    const validatorModule = await loadDefaultValidatorModule();

    // Assert
    expect(validatorModule.default).toBeDefined();
  });
});

describe('groupSchemasByType', () => {
  test('groups schemas by @type and falls back to undefined', () => {
    const grouped = groupSchemasByType([{ '@type': 'Article' }, { '@type': 'Article' }, { name: 'No type' }]);

    expect(grouped.Article).toHaveLength(2);
    expect(grouped.undefined).toHaveLength(1);
  });
});

describe('groupValidationIssues', () => {
  test('builds schemaKey and contextPath without side effects', () => {
    const grouped = groupValidationIssues([
      makeIssue('ERROR', [
        { type: 'Article', index: 0 },
        { type: 'author', index: 1 },
      ]),
    ]);

    expect(grouped.get('Article[1]')?.[0]?.contextPath).toBe('author[2]');
  });
});

describe('buildValidationReport / renderValidationReportLines', () => {
  test('returns success report with one success line when there are no issues', () => {
    const report = buildValidationReport([]);

    expect(report.success).toBe(true);
    expect(renderValidationReportLines(report).map(ansis.strip)).toEqual(['✓ No validation errors found\n']);
  });

  test('returns grouped error and warning sections as pure renderable lines', () => {
    const report = buildValidationReport([
      makeIssue('ERROR', [{ type: 'Article', index: 0 }], ['name'], 'Bad name'),
      makeIssue('WARNING', [{ type: 'Article', index: 0 }], ['description'], 'Weak description'),
    ]);
    const lines = renderValidationReportLines(report).map(ansis.strip);

    expect(report.success).toBe(false);
    expect(lines).toContain('ERRORS (1):\n');
    expect(lines).toContain('WARNINGS (1):\n');
    expect(lines).toContain('  Article[1]');
    expect(lines).toContain('      Bad name');
    expect(lines).toContain('      Weak description');
  });
});
