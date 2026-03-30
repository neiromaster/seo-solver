import { afterAll, afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import pkg from '../../package.json' with { type: 'json' };

const mockSetDefaultHelpFormatter = mock(() => undefined);
const mockSubcommands = mock((config: unknown) => config);
const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);
const mockCreateVercelFormatter = mock(() => ({}));
const mockValidate = mock(async () => []);

mock.module('cmd-ts', () => ({
  run: mock(async () => undefined),
  setDefaultHelpFormatter: mockSetDefaultHelpFormatter,
  subcommands: mockSubcommands,
  command: mockCommand,
  boolean: 'boolean-type',
  string: 'string-type',
  flag: mockFlag,
  option: mockOption,
  optional: mockOptional,
  positional: mockPositional,
}));
mock.module('cmd-ts/batteries/vercel-formatter', () => ({
  createVercelFormatter: mockCreateVercelFormatter,
}));
mock.module('@adobe/structured-data-validator', () => ({
  default: class MockValidator {
    debug = false;
    validate = mockValidate;
  },
}));

const { createApp } = await import('./create-app');

afterAll(() => {
  mock.restore();
});

describe('createApp', () => {
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>> | undefined;
  let logSpy: ReturnType<typeof spyOn<typeof console, 'log'>> | undefined;

  beforeEach(() => {
    mockSetDefaultHelpFormatter.mockClear();
    mockSubcommands.mockClear();
    mockCreateVercelFormatter.mockClear();
    mockValidate.mockReset();
    mockValidate.mockResolvedValue([]);
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    logSpy?.mockRestore();
  });

  test('calls setDefaultHelpFormatter once', () => {
    createApp();

    expect(mockSetDefaultHelpFormatter).toHaveBeenCalledTimes(1);
  });

  test('configures vercel formatter with SEO Solver as CLI name', () => {
    createApp();

    expect(mockCreateVercelFormatter).toHaveBeenCalledWith(expect.objectContaining({ cliName: 'SEO Solver' }));
  });

  test('calls subcommands with name and version from package.json', () => {
    createApp();

    const config = mockSubcommands.mock.calls.at(-1)?.[0] as { name: string; version: string };
    expect(config.name).toBe('seo-solver');
    expect(config.version).toBe(pkg.version);
  });

  test('returns app plus coarse services', () => {
    const result = createApp();

    expect(result.app).toBeDefined();
    expect(result.services.metadataReader).toBeDefined();
    expect(result.services.schemaValidator).toBeDefined();
    expect(result.services.diffViewer).toBeDefined();
    expect(result.services.runDiff).toBeDefined();
    expect(result.services.runValidate).toBeDefined();
  });

  test('wires schemaValidator with fetch through the returned services', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ '@graph': [] }),
    } as Response);
    logSpy = spyOn(console, 'log').mockImplementation(() => {});

    const result = createApp();
    await result.services.schemaValidator.validate([{ '@type': 'Article', name: 'Test' }]);

    expect(fetchSpy).toHaveBeenCalledWith('https://schema.org/version/latest/schemaorg-all-https.jsonld');
  });
});
