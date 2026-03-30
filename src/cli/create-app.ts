import { setDefaultHelpFormatter, subcommands } from 'cmd-ts';
import { compareJsonLd, compareOg } from '#core/comparers';
import { createRunDiff, type RunDiff } from '#core/diff-runner';
import { safeRun } from '#core/errors';
import { createDiffViewer, type DiffViewer } from '#core/services/diff-viewer';
import { createMetadataReader, type MetadataReader } from '#core/services/metadata-reader';
import { createSchemaValidator, type SchemaValidator } from '#core/services/schema-validator';
import { createRunValidate, type RunValidate } from '#core/validate-runner';
import pkg from '../../package.json' with { type: 'json' };
import { createDiffCommand } from './commands/diff.command';
import { createValidateCommand } from './commands/validate.command';
import { createVercelFormatter } from './vercel-formatter';

export type AppServices = {
  metadataReader: MetadataReader;
  schemaValidator: SchemaValidator;
  diffViewer: DiffViewer;
  runDiff: RunDiff;
  runValidate: RunValidate;
};

export function createApp() {
  const metadataReader = createMetadataReader();
  const schemaValidator = createSchemaValidator({
    fetchImpl: fetch,
    loadValidatorModule: () => import('@adobe/structured-data-validator'),
    log: console,
  });
  const diffViewer = createDiffViewer();

  const runDiff = createRunDiff({
    metadataReader,
    diffViewer,
    log: console,
    compareOg,
    compareJsonLd,
  });
  const runValidate = createRunValidate({
    metadataReader,
    schemaValidator,
    diffViewer,
    log: console,
  });

  const diffCommand = createDiffCommand({ runDiff, safeRun });
  const validateCommand = createValidateCommand({ runValidate, safeRun });

  setDefaultHelpFormatter(
    createVercelFormatter({
      cliName: 'SEO Solver',
      logo: '🔍',
    }),
  );

  const app = subcommands({
    name: 'seo-solver',
    version: pkg.version,
    description: 'CLI tool for comparing and validating structured data (JSON-LD, OpenGraph) for SEO',
    cmds: {
      diff: diffCommand,
      validate: validateCommand,
    },
  });

  return {
    app,
    services: {
      metadataReader,
      schemaValidator,
      diffViewer,
      runDiff,
      runValidate,
    },
  };
}
