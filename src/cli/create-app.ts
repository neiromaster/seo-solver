import { setDefaultHelpFormatter, subcommands } from 'cmd-ts';
import { createEditorLauncher } from '#adapters/editor';
import { createV2App } from '#bootstrap';
import { createTerminalPresenter } from '#cli/presenters';
import { ensureEditorAvailable, presentV2Result, resolveV2FetcherOption, safeRunV2 } from '#cli/v2-command-runtime';
import pkg from '../../package.json' with { type: 'json' };
import { createDiffCommand, createInspectCommand, createValidateCommand } from './commands';
import { createVercelFormatter } from './vercel-formatter';

export type AppServices = {
  runDiff: ReturnType<typeof createV2App>['runDiff'];
  runValidate: ReturnType<typeof createV2App>['runValidate'];
  runInspect: ReturnType<typeof createV2App>['runInspect'];
};

export function createApp() {
  const v2 = createV2App();
  const presenter = createTerminalPresenter({
    writeStdout: (text) => process.stdout.write(text),
    editorLauncher: createEditorLauncher(),
  });

  const diffCommand = createDiffCommand({
    safeRun: safeRunV2,
    resolveFetcher: resolveV2FetcherOption,
    warn: console.warn,
    runDiff: async (url1, url2, options) => {
      await ensureEditorAvailable(options.editor);
      const result = await v2.runDiff({
        leftUrl: url1,
        rightUrl: url2,
        fetcherId: options.fetcherId,
        extractorId: options.extractorId,
        rendererId: options.rendererId,
      });
      await presentV2Result(presenter, result, { editor: options.editor });
    },
  });

  const validateCommand = createValidateCommand({
    safeRun: safeRunV2,
    resolveFetcher: resolveV2FetcherOption,
    warn: console.warn,
    runValidate: async (url, options) => {
      await ensureEditorAvailable(options.editor);

      if (options.editor) {
        const inspectResult = await v2.runInspect({
          url,
          fetcherId: options.fetcherId,
          extractorId: options.extractorId,
          rendererId: 'editor-diff',
        });
        await presentV2Result(presenter, inspectResult, { editor: options.editor });
      }

      const result = await v2.runValidate({
        url,
        fetcherId: options.fetcherId,
        extractorId: options.extractorId,
        rendererId: 'terminal',
      });
      await presentV2Result(presenter, result);
    },
  });

  const inspectCommand = createInspectCommand({
    safeRun: safeRunV2,
    resolveFetcher: resolveV2FetcherOption,
    warn: console.warn,
    runInspect: async (url, options) => {
      await ensureEditorAvailable(options.editor);
      const result = await v2.runInspect({
        url,
        fetcherId: options.fetcherId,
        extractorId: options.extractorId,
        rendererId: options.rendererId,
      });
      await presentV2Result(presenter, result, { editor: options.editor });
    },
  });

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
      inspect: inspectCommand,
      validate: validateCommand,
    },
  });

  return {
    app,
    services: {
      runDiff: v2.runDiff,
      runValidate: v2.runValidate,
      runInspect: v2.runInspect,
    },
  };
}
