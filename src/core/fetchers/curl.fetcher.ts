import { execFileSync } from 'node:child_process';
import { CurlError } from '#core/errors';

const CURL_ARGS = [
  '-sL',
  '--max-time',
  '30',
  '-A',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  '-H',
  'Accept-Language: ru-RU,ru;q=0.9',
] as const;

function normalizeCurlError(error: unknown): unknown {
  if (error instanceof Error && error.message.includes('stdout maxBuffer length exceeded')) {
    return new Error(`curl output exceeded 10MB maxBuffer limit: ${error.message}`);
  }

  return error;
}

export function fetchHtmlCurl(url: string): string {
  try {
    return execFileSync('curl', [...CURL_ARGS, url], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    throw new CurlError(url, normalizeCurlError(error));
  }
}
