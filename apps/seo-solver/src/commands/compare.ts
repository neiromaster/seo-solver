import { hasDiffs } from '@seo-solver/report';
import { command } from 'cmd-ts';
import { openDiffInEditor } from '../cli-support/editor';
import { writeCompareEditorArtifacts } from '../cli-support/editor-artifacts';
import { handleError } from '../cli-support/error-handler';
import { resolveFetcher } from '../cli-support/fetcher-registry';
import { writeOutput } from '../cli-support/output';
import { buildReporter } from '../cli-support/reporter-config';
import { editorFlag } from '../flags/editor';
import { parseTargets, targetsFlag } from '../flags/extractor';
import { fetcherFlags } from '../flags/fetcher';
import { formatFlag } from '../flags/format';
import { outputFlag } from '../flags/output';
import { urlArgA, urlArgB } from '../flags/url';
import { quietFlag, verboseFlag } from '../flags/verbosity';
import { resolveEditor } from '../types';
import { runCompare } from '../workflows/compare';

export const compareCommand = command({
  name: 'compare',
  description: 'Compare SEO markup between two URLs',
  args: {
    urlA: urlArgA,
    urlB: urlArgB,
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
      const editor = resolveEditor(args.editor);
      const { report, leftPage, rightPage } = await runCompare(fetcher, args.urlA, args.urlB, {
        targets: parseTargets(args.targets),
      });

      const reporter = buildReporter(args);
      const output = reporter.formatComparisonReport(report);
      await writeOutput(output, args.output);

      if (editor) {
        const { leftPath, rightPath } = await writeCompareEditorArtifacts(leftPage, rightPage);
        await openDiffInEditor(editor, leftPath, rightPath);
      }

      process.exitCode = hasDiffs(report) ? 1 : 0;
    } catch (error) {
      handleError(error);
    } finally {
      await fetcher?.dispose();
    }
  },
});
