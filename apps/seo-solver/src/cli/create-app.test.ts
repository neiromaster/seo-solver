import { afterAll, beforeEach, describe, expect, mock, test } from '#test-support/test-runtime';
import pkg from '../../package.json' with { type: 'json' };

const mockSetDefaultHelpFormatter = mock(() => undefined);
const mockSubcommands = mock((config: unknown) => config);
const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);
const mockRunDiff = mock(async () => ({ kind: 'text', content: 'diff', exitCode: 0 }));
const mockRunValidate = mock(async () => ({ kind: 'text', content: 'validate', exitCode: 0 }));
const mockRunInspect = mock(async () => ({ kind: 'text', content: 'inspect', exitCode: 0 }));

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
mock.module('#bootstrap', () => ({
  createRuntimeApp: () => ({
    runDiff: mockRunDiff,
    runValidate: mockRunValidate,
    runInspect: mockRunInspect,
  }),
}));
mock.module('#cli/presenters', () => ({
  createTerminalPresenter: () => ({
    present: mock(async () => 0),
  }),
}));
mock.module('#adapters/editor', () => ({
  createEditorLauncher: () => ({
    ensureAvailable: mock(async () => undefined),
    open: mock(async () => undefined),
  }),
}));

const { createApp } = await import('./create-app');

afterAll(() => {
  mock.restore();
});

describe('createApp', () => {
  beforeEach(() => {
    mockSetDefaultHelpFormatter.mockClear();
    mockSubcommands.mockClear();
    mockRunDiff.mockClear();
    mockRunValidate.mockClear();
    mockRunInspect.mockClear();
  });

  test('calls setDefaultHelpFormatter once', () => {
    createApp();

    expect(mockSetDefaultHelpFormatter).toHaveBeenCalledTimes(1);
  });

  test('configures help formatter with SEO Solver as CLI name', () => {
    createApp();

    const formatterCall = mockSetDefaultHelpFormatter.mock.calls.at(-1) as [unknown] | undefined;
    expect(formatterCall).toBeDefined();

    const formatter = formatterCall?.[0] as
      | {
          formatSubcommands: (data: {
            commands: [];
            examples: [];
            helpTopics: [];
            name: string;
            path: string[];
            version: string;
          }) => string;
        }
      | undefined;

    if (!formatter) {
      throw new Error('Expected help formatter to be configured');
    }

    const formatted = formatter.formatSubcommands({
      commands: [],
      examples: [],
      helpTopics: [],
      name: 'seo-solver',
      path: ['seo-solver'],
      version: pkg.version,
    });

    expect(formatted).toContain('SEO Solver');
  });

  test('calls subcommands with name and version from package.json', () => {
    createApp();

    const config = mockSubcommands.mock.calls.at(-1)?.[0] as {
      name: string;
      version: string;
      cmds: Record<string, unknown>;
    };
    expect(config.name).toBe('seo-solver');
    expect(config.version).toBe(pkg.version);
    expect(Object.keys(config.cmds)).toEqual(['diff', 'inspect', 'validate']);
  });

  test('returns app plus runtime services', () => {
    const result = createApp();

    expect(result.app).toBeDefined();
    expect(result.services.runDiff).toBeDefined();
    expect(result.services.runValidate).toBeDefined();
    expect(result.services.runInspect).toBeDefined();
  });
});
