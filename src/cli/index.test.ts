import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import pkg from '../../package.json' with { type: 'json' };

// ── mocks (must be declared before the module under test is imported) ──────────

const mockRun = mock(async (_app: unknown, _args: string[]) => undefined);
const mockSetDefaultHelpFormatter = mock(() => undefined);
const mockSubcommands = mock((config: unknown) => config);
const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockPositional = mock((config: unknown) => config);

const mockCreateVercelFormatter = mock(() => ({}));

beforeAll(async () => {
  mock.module('cmd-ts', () => ({
    run: mockRun,
    setDefaultHelpFormatter: mockSetDefaultHelpFormatter,
    subcommands: mockSubcommands,
    command: mockCommand,
    boolean: 'boolean-type',
    string: 'string-type',
    flag: mockFlag,
    positional: mockPositional,
  }));
  mock.module('cmd-ts/batteries/vercel-formatter', () => ({
    createVercelFormatter: mockCreateVercelFormatter,
  }));
  await import('./index');
});

afterAll(() => {
  mock.restore();
});

// ── suite ──────────────────────────────────────────────────────────────────────

describe('CLI entry point', () => {
  test('calls setDefaultHelpFormatter once', () => {
    // Arrange — module executed at import above

    // Act — (none)

    // Assert
    expect(mockSetDefaultHelpFormatter).toHaveBeenCalledTimes(1);
  });

  test('configures vercel formatter with SEO Solver as CLI name', () => {
    // Arrange — module executed at import above

    // Act — (none)

    // Assert
    expect(mockCreateVercelFormatter).toHaveBeenCalledWith(expect.objectContaining({ cliName: 'SEO Solver' }));
  });

  test('calls subcommands with name "seo-solver"', () => {
    // Arrange — module executed at import above

    // Act — (none)

    // Assert
    const config = mockSubcommands.mock.calls[0]?.[0] as { name: string };
    expect(config.name).toBe('seo-solver');
  });

  test('calls subcommands with version from package.json', () => {
    // Arrange — module executed at import above

    // Act — (none)

    // Assert
    const config = mockSubcommands.mock.calls[0]?.[0] as { version: string };
    expect(config.version).toBe(pkg.version);
  });

  test('calls subcommands with diff and validate commands', () => {
    // Arrange — module executed at import above

    // Act — (none)

    // Assert
    const config = mockSubcommands.mock.calls[0]?.[0] as { cmds: Record<string, unknown> };
    expect(config.cmds).toHaveProperty('diff');
    expect(config.cmds).toHaveProperty('validate');
  });

  test('calls run with process.argv.slice(2)', () => {
    // Arrange — module executed at import above

    // Act — (none)

    // Assert
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun.mock.calls[0]?.[1]).toEqual(process.argv.slice(2));
  });
});
