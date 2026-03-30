import { run } from 'cmd-ts';

export { createDiffCommand, createValidateCommand } from '#cli/commands';
export { createApp } from '#cli/create-app';
export { createRunDiff } from '#core/diff-runner';
export { createDiffViewer } from '#core/services/diff-viewer';
export { createMetadataReader } from '#core/services/metadata-reader';
export { createSchemaValidator } from '#core/services/schema-validator';
export { createRunValidate } from '#core/validate-runner';
export * from './core/comparers';
export * from './core/formatters';
export * from './core/parsers';
export * from './lib';
export * from './types';

if (import.meta.main) {
  const { createApp } = await import('./cli/create-app');
  const { app } = createApp();
  run(app, process.argv.slice(2));
}
