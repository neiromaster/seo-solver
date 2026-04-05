import { setDefaultHelpFormatter, subcommands } from 'cmd-ts';
import { createEditorLauncher } from '#adapters/editor';
import { createRuntimeApp } from '#bootstrap';
import { ensureEditorAvailable, presentResult, resolveFetcherOption, safeRun } from '#cli/command-runtime';
import { createTerminalPresenter } from '#cli/presenters';
import pkg from '../../package.json' with { type: 'json' };
import { createDiffCommand, createInspectCommand, createValidateCommand } from './commands';
import { createVercelFormatter } from './vercel-formatter';

export type AppServices = {
  runDiff: ReturnType<typeof createRuntimeApp>['runDiff'];
  runValidate: ReturnType<typeof createRuntimeApp>['runValidate'];
  runInspect: ReturnType<typeof createRuntimeApp>['runInspect'];
};

export function createApp() {
  const runtimeApp = createRuntimeApp();
  const presenter = createTerminalPresenter({
    writeStdout: (text) => process.stdout.write(text),
    editorLauncher: createEditorLauncher(),
  });

  const diffCommand = createDiffCommand({
    safeRun,
    resolveFetcher: resolveFetcherOption,
    warn: console.warn,
    runDiff: async (url1, url2, options) => {
      await ensureEditorAvailable(options.editor);
      const result = await runtimeApp.runDiff({
        leftUrl: url1,
        rightUrl: url2,
        fetcherId: options.fetcherId,
        extractorId: options.extractorId,
        rendererId: options.rendererId,
      });
      await presentResult(presenter, result, { editor: options.editor });
    },
  });

  const validateCommand = createValidateCommand({
    safeRun,
    resolveFetcher: resolveFetcherOption,
    warn: console.warn,
    runValidate: async (url, options) => {
      await ensureEditorAvailable(options.editor);

      if (options.editor) {
        const inspectResult = await runtimeApp.runInspect({
          url,
          fetcherId: options.fetcherId,
          extractorId: options.extractorId,
          rendererId: 'editor-diff',
        });
        await presentResult(presenter, inspectResult, { editor: options.editor });
      }

      const result = await runtimeApp.runValidate({
        url,
        fetcherId: options.fetcherId,
        extractorId: options.extractorId,
        rendererId: 'terminal',
      });
      await presentResult(presenter, result);
    },
  });

  const inspectCommand = createInspectCommand({
    safeRun,
    resolveFetcher: resolveFetcherOption,
    warn: console.warn,
    runInspect: async (url, options) => {
      await ensureEditorAvailable(options.editor);
      const result = await runtimeApp.runInspect({
        url,
        fetcherId: options.fetcherId,
        extractorId: options.extractorId,
        rendererId: options.rendererId,
      });
      await presentResult(presenter, result, { editor: options.editor });
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
      runDiff: runtimeApp.runDiff,
      runValidate: runtimeApp.runValidate,
      runInspect: runtimeApp.runInspect,
    },
  };
}
