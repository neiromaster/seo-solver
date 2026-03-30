import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { FetchError } from '#core/errors';
import { fetchHtmlBasic } from './basic.fetcher';

describe('fetchHtmlBasic', () => {
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>> | undefined;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test('fetches HTML with browser-like headers', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '<html/>',
    } as Response);

    await expect(fetchHtmlBasic('https://example.com')).resolves.toBe('<html/>');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Accept-Language': 'ru-RU,ru;q=0.9',
          'User-Agent': expect.stringContaining('Mozilla/5.0'),
        }),
        redirect: 'follow',
      }),
    );
  });

  test('wraps non-ok responses in FetchError', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as Response);

    await expect(fetchHtmlBasic('https://example.com')).rejects.toBeInstanceOf(FetchError);
  });
});
