import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import ansis from 'ansis';
import { buildOgComparisonLines, compareOg } from './opengraph.comparer';

function stripAnsi(str: string): string {
  return ansis.strip(str);
}

let logs: string[];
const originalLog = console.log;

beforeEach(() => {
  logs = [];
  console.log = (...args: unknown[]) => {
    logs.push(args.map((a) => String(a)).join(' '));
  };
});

afterEach(() => {
  console.log = originalLog;
});

function output(): string {
  return logs.map(stripAnsi).join('\n');
}

describe('compareOg', () => {
  test("shows 'No OpenGraph tags found' when both empty", () => {
    compareOg({}, {});
    expect(output()).toContain('No OpenGraph tags found');
  });

  test('shows checkmark when OG data is identical', () => {
    compareOg({ 'og:title': 'Hello' }, { 'og:title': 'Hello' });
    expect(output()).toContain('identical');
  });

  test('shows diff for changed value', () => {
    compareOg({ 'og:title': 'Old' }, { 'og:title': 'New' });
    const out = output();
    expect(out).toContain('og:title');
    expect(out).toContain('Old');
    expect(out).toContain('New');
  });

  test('shows added key', () => {
    compareOg({ 'og:title': 'T' }, { 'og:title': 'T', 'og:image': 'img.jpg' });
    const out = output();
    expect(out).toContain('og:image');
    expect(out).toContain('img.jpg');
  });

  test('shows removed key', () => {
    compareOg({ 'og:title': 'T', 'og:image': 'img.jpg' }, { 'og:title': 'T' });
    const out = output();
    expect(out).toContain('og:image');
    expect(out).toContain('img.jpg');
  });

  test('handles only-added keys (left side empty)', () => {
    compareOg({}, { 'og:title': 'New', 'og:description': 'Desc' });
    const out = output();
    expect(out).toContain('og:title');
    expect(out).toContain('og:description');
  });

  test('handles only-removed keys (right side empty)', () => {
    compareOg({ 'og:title': 'Old' }, {});
    const out = output();
    expect(out).toContain('og:title');
  });

  test('handles mixed added removed and changed', () => {
    compareOg(
      { 'og:title': 'Old', 'og:description': 'Desc', 'og:old': 'x' },
      { 'og:title': 'New', 'og:description': 'Desc', 'og:new': 'y' },
    );
    const out = output();
    expect(out).toContain('og:title');
    expect(out).toContain('Old');
    expect(out).toContain('New');
    expect(out).toContain('og:old');
    expect(out).toContain('og:new');
  });

  test('does not show identical message when diffs exist', () => {
    compareOg({ 'og:title': 'A' }, { 'og:title': 'B' });
    expect(output()).not.toContain('identical');
  });

  test('does not show no-tags message when one side has data', () => {
    compareOg({}, { 'og:title': 'T' });
    expect(output()).not.toContain('No OpenGraph tags found');
  });
});

describe('buildOgComparisonLines', () => {
  test('returns the no-tags message as pure output when both sides are empty', () => {
    expect(buildOgComparisonLines({}, {}).map(stripAnsi)).toEqual(['No OpenGraph tags found\n']);
  });

  test('returns diff lines without logging', () => {
    const lines = buildOgComparisonLines({ 'og:title': 'Old' }, { 'og:title': 'New' }).map(stripAnsi);

    expect(lines).toContain('  og:title');
    expect(lines).toContain('    - Old');
    expect(lines).toContain('    + New');
    expect(lines.at(-1)).toBe('');
  });
});
