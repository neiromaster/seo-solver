import { command } from 'cmd-ts';
import { openFileInEditor } from '../cli-support/editor';
import { buildExtractEditorArtifact } from '../cli-support/editor-artifacts';
import { CLIError, handleError } from '../cli-support/error-handler';
import { resolveFetcher } from '../cli-support/fetcher-registry';
import { writeOutput } from '../cli-support/output';
import { createEditorArtifactDirectory, writeEditorArtifactFile } from '../cli-support/temp-artifacts';
import { editorFlag } from '../flags/editor';
import { parseTargets, targetsFlag } from '../flags/extractor';
import { fetcherFlags } from '../flags/fetcher';
import { formatFlag } from '../flags/format';
import { outputFlag } from '../flags/output';
import { urlArg } from '../flags/url';
import { quietFlag, verboseFlag } from '../flags/verbosity';
import { resolveEditor, resolveExtractFormat } from '../types';
import { runExtract } from '../workflows/extract';

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
