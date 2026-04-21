import { positional, string } from 'cmd-ts';

export const urlArg = positional({
  type: string,
  displayName: 'url',
  description: 'URL to audit',
});

export const urlArgA = positional({
  type: string,
  displayName: 'url-a',
  description: 'First URL (before)',
});

export const urlArgB = positional({
  type: string,
  displayName: 'url-b',
  description: 'Second URL (after)',
});
