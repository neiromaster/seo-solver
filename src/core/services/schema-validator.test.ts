import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { ValidationIssue } from '#types';
import { createSchemaValidator, validateSchemasWithDeps } from './schema-validator';

const mockValidate = mock(async () => [] as ValidationIssue[]);
const mockFetchImpl = mock(async () => ({
  json: mock(async () => ({})),
}));
const mockLoadValidatorModule = mock(async () => ({
  default: class MockValidator {
    debug = false;
    validate = mockValidate;
  },
}));
const mockLog = { log: mock(() => undefined) };

describe('createSchemaValidator', () => {
  beforeEach(() => {
    mockValidate.mockReset();
    mockFetchImpl.mockReset();
    mockLoadValidatorModule.mockReset();
    mockLog.log.mockReset();

    mockValidate.mockResolvedValue([]);
    mockFetchImpl.mockResolvedValue({ json: mock(async () => ({})) });
    mockLoadValidatorModule.mockResolvedValue({
      default: class MockValidator {
        debug = false;
        validate = mockValidate;
      },
    });
  });

  test('fetches schema.org data, loads validator, and logs success', async () => {
    const validator = createSchemaValidator({
      fetchImpl: mockFetchImpl as unknown as typeof fetch,
      loadValidatorModule: mockLoadValidatorModule,
      log: mockLog,
    });

    await validator.validate([{ '@type': 'Article' }]);

    expect(mockFetchImpl).toHaveBeenCalledWith('https://schema.org/version/latest/schemaorg-all-https.jsonld');
    expect(mockLoadValidatorModule).toHaveBeenCalledTimes(1);
    expect(mockValidate).toHaveBeenCalledTimes(1);
    expect(mockLog.log).toHaveBeenCalledWith(expect.stringContaining('No validation errors found'));
  });

  test('renders grouped errors through the injected logger', async () => {
    mockValidate.mockResolvedValue([
      {
        issueMessage: 'Bad name',
        severity: 'ERROR',
        path: [{ type: 'Article', index: 0 }],
        fieldNames: ['name'],
      },
    ]);

    await validateSchemasWithDeps([{ '@type': 'Article', name: 'Broken' }], {
      fetchImpl: mockFetchImpl as unknown as typeof fetch,
      loadValidatorModule: mockLoadValidatorModule,
      log: mockLog,
    });

    const output = mockLog.log.mock.calls.map((args) => args.map((arg) => String(arg)).join(' ')).join('\n');
    expect(output).toContain('ERRORS');
    expect(output).toContain('Article[1]');
    expect(output).toContain('Bad name');
  });
});
