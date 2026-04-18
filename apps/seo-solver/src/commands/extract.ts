import { command } from 'cmd-ts';
import { openFileInEditor } from '../cli-support/editor.js';
import { buildExtractEditorArtifact } from '../cli-support/editor-artifacts.js';
import { CLIError, handleError } from '../cli-support/error-handler.js';
import { resolveFetcher } from '../cli-support/fetcher-registry.js';
import { writeOutput } from '../cli-support/output.js';
import { createEditorArtifactDirectory, writeEditorArtifactFile } from '../cli-support/temp-artifacts.js';
import { editorFlag } from '../flags/editor.js';
import { parseTargets, targetsFlag } from '../flags/extractor.js';
import { fetcherFlags } from '../flags/fetcher.js';
import { formatFlag } from '../flags/format.js';
import { outputFlag } from '../flags/output.js';
import { urlArg } from '../flags/url.js';
import { quietFlag, verboseFlag } from '../flags/verbosity.js';
import { resolveEditor, resolveExtractFormat } from '../types.js';
import { runExtract } from '../workflows/extract.js';

export const extractCommand = command({
  name: 'extract',
  description: 'Extract SEO data from a URL (no validation)',
  args: {
    url: urlArg,
    format: formatFlag,
    verbose: verboseFlag,
    quiet: quietFlag,
    ...fetcherFlags,
    targets: targetsFlag,
    output: outputFlag,
    editor: editorFlag,
  },
  handler: async (args) => {
    let fetcher: Awaited<ReturnType<typeof resolveFetcher>> | undefined;

    try {
      fetcher = await resolveFetcher(args);
      const { page } = await runExtract(fetcher, args.url, {
        targets: parseTargets(args.targets),
      });
      const format = resolveExtractFormat(args.format);

      if (format !== 'json') {
        throw new CLIError(`Unsupported extract format: ${format}. Expected: json`);
      }

      const editor = resolveEditor(args.editor);
      const content = buildExtractEditorArtifact(page);

      if (editor) {
        if (args.output) {
          await writeOutput(content, args.output);
          await openFileInEditor(editor, args.output);
          return;
        }

        const artifactDirectory = await createEditorArtifactDirectory();
        const artifactPath = await writeEditorArtifactFile(artifactDirectory, 'extract.json', content);
        await openFileInEditor(editor, artifactPath);
        return;
      }

      await writeOutput(content, args.output);
    } catch (error) {
      handleError(error);
    } finally {
      await fetcher?.dispose();
    }
  },
});
