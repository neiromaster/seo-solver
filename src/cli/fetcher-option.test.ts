import { describe, expect, test } from 'bun:test';
import { CURL_DEPRECATION_WARNING, resolveFetcherOption } from './fetcher-option';

describe('resolveFetcherOption', () => {
  test('defaults to basic when no fetcher flags are provided', () => {
    expect(resolveFetcherOption({ curl: false })).toEqual({
      fetcher: { type: 'basic' },
      warning: undefined,
    });
  });

  test('uses curl and warns when only -c is present', () => {
    expect(resolveFetcherOption({ curl: true })).toEqual({
      fetcher: { type: 'curl' },
      warning: CURL_DEPRECATION_WARNING,
    });
  });

  test('lets --fetcher override -c while still warning', () => {
    expect(resolveFetcherOption({ curl: true, fetcher: 'basic' })).toEqual({
      fetcher: { type: 'basic' },
      warning: CURL_DEPRECATION_WARNING,
    });
  });

  test('parses explicit curl fetcher', () => {
    expect(resolveFetcherOption({ curl: false, fetcher: 'curl' })).toEqual({
      fetcher: { type: 'curl' },
      warning: undefined,
    });
  });

  test('parses chrome launch fetcher', () => {
    expect(resolveFetcherOption({ curl: false, fetcher: 'chrome' })).toEqual({
      fetcher: { type: 'chrome', mode: 'launch' },
      warning: undefined,
    });
  });

  test('normalizes chrome port shorthand to localhost target', () => {
    expect(resolveFetcherOption({ curl: false, fetcher: 'chrome:9222' })).toEqual({
      fetcher: { type: 'chrome', mode: 'connect', target: 'localhost:9222' },
      warning: undefined,
    });
  });

  test('keeps chrome host:port targets as-is', () => {
    expect(resolveFetcherOption({ curl: false, fetcher: 'chrome:192.168.1.50:9222' })).toEqual({
      fetcher: { type: 'chrome', mode: 'connect', target: '192.168.1.50:9222' },
      warning: undefined,
    });
  });

  test('keeps chrome URL targets as-is', () => {
    expect(resolveFetcherOption({ curl: false, fetcher: 'chrome:https://browser.example.com' })).toEqual({
      fetcher: { type: 'chrome', mode: 'connect', target: 'https://browser.example.com' },
      warning: undefined,
    });
  });

  test('throws for invalid fetcher values', () => {
    expect(() => resolveFetcherOption({ curl: false, fetcher: 'native' })).toThrow(
      'Invalid value for --fetcher: native.\nAllowed values: basic, curl, chrome, chrome:<port|host:port|url>',
    );
  });

  test('throws for invalid empty chrome targets', () => {
    expect(() => resolveFetcherOption({ curl: false, fetcher: 'chrome:' })).toThrow(
      'Invalid chrome fetcher target: chrome:.\nExpected one of: chrome, chrome:<port>, chrome:<host:port>, chrome:<url>',
    );
  });

  test('throws for malformed chrome targets', () => {
    expect(() => resolveFetcherOption({ curl: false, fetcher: 'chrome:abc:def:ghi' })).toThrow(
      'Invalid chrome fetcher target: chrome:abc:def:ghi.\nExpected one of: chrome, chrome:<port>, chrome:<host:port>, chrome:<url>',
    );
  });
});
