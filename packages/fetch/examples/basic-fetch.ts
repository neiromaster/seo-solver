import { fetchUrl } from '@seo-solver/fetch';

const result = await fetchUrl('https://example.com');
console.log(result.statusCode, result.url);
