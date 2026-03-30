import { FetchError } from '#core/errors';

export async function fetchHtmlBasic(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
    }

    return await response.text();
  } catch (error) {
    throw new FetchError('basic fetch failed', url, 'basic', error);
  }
}
