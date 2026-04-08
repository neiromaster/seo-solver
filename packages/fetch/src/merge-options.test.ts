import { describe, expect, test } from 'vitest';
import { mergeOptions } from './merge-options.js';

describe('mergeOptions', () => {
  test('uses config when per-request options are missing', () => {
    const signal = new AbortController().signal;
    const result = mergeOptions(
      {
        headers: { 'x-config': '1' },
        maxRedirects: 2,
        retry: { attempts: 3, delay: 50 },
        timeout: 123,
        userAgent: 'agent',
      },
      { signal },
    );

    expect(result.timeout).toBe(123);
    expect(result.maxRedirects).toBe(2);
    expect(result.retry.attempts).toBe(3);
    expect(result.retry.delay).toBe(50);
    expect(result.headers['x-config']).toBe('1');
    expect(result.headers['user-agent']).toBe('agent');
    expect(result.signal).toBe(signal);
  });

  test('per-request timeout overrides config', () => {
    expect(mergeOptions({ timeout: 100 }, { timeout: 200 }).timeout).toBe(200);
  });

  test('merges headers and normalizes case', () => {
    const result = mergeOptions(
      { headers: { 'X-Test': 'config', 'User-Agent': 'config-agent' } },
      { headers: { 'x-test': 'request', 'user-agent': 'request-agent' } },
    );

    expect(result.headers['x-test']).toBe('request');
    expect(result.headers['user-agent']).toBe('request-agent');
  });

  test('deep merges retry options', () => {
    const result = mergeOptions(
      { retry: { attempts: 2, backoff: 'fixed', delay: 10, retryOn: [429] } },
      { retry: { attempts: 5 } },
    );

    expect(result.retry).toEqual({
      attempts: 5,
      backoff: 'fixed',
      delay: 10,
      respectRetryAfter: true,
      retryOn: [429],
    });
  });

  test('keeps config values on empty per-request options', () => {
    const result = mergeOptions({ timeout: 321, headers: { 'x-config': '1' } }, {});
    expect(result.timeout).toBe(321);
    expect(result.headers['x-config']).toBe('1');
  });

  test('falls back to defaults when both inputs are missing', () => {
    const result = mergeOptions({}, undefined);
    expect(result.timeout).toBe(30_000);
    expect(result.maxRedirects).toBe(5);
    expect(result.retry.attempts).toBe(1);
    expect(result.headers['user-agent']).toContain('seo-solver');
  });
});
