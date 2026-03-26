export { diffCommand, validateCommand } from '#cli/commands';
export * from './core/comparers';
export * from './core/formatters';
export * from './core/parsers';
export * from './lib';
export * from './types';

// Bootstrap CLI when run directly
if (import.meta.main) {
  await import('./cli');
}
