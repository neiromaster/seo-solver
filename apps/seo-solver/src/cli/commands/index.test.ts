import { afterAll, describe, expect, mock, test } from '#test-support/test-runtime';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockOption = mock((config: unknown) => config);
const mockOptional = mock((type: unknown) => ({ optional: type }));
const mockPositional = mock((config: unknown) => config);

mock.module('cmd-ts', () => ({
  command: mockCommand,
  boolean: 'boolean-type',
  string: 'string-type',
  flag: mockFlag,
  option: mockOption,
  optional: mockOptional,
  positional: mockPositional,
}));

const { createDiffCommand, createInspectCommand, createValidateCommand } = await import('./index');

afterAll(() => {
  mock.restore();
});

describe('commands barrel', () => {
  test('exports createValidateCommand', () => {
    expect(createValidateCommand).toBeDefined();
  });

  test('exports createDiffCommand', () => {
    expect(createDiffCommand).toBeDefined();
  });

  test('exports createInspectCommand', () => {
    expect(createInspectCommand).toBeDefined();
  });
});
