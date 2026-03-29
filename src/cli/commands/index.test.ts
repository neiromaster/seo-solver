import { afterAll, describe, expect, mock, test } from 'bun:test';

const mockCommand = mock((config: unknown) => config);
const mockFlag = mock((config: unknown) => config);
const mockPositional = mock((config: unknown) => config);

mock.module('cmd-ts', () => ({
  command: mockCommand,
  boolean: 'boolean-type',
  string: 'string-type',
  flag: mockFlag,
  positional: mockPositional,
}));

const { createDiffCommand, createValidateCommand } = await import('./index');

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
});
