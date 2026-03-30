import { bold, cyan } from 'ansis';
import type { FetcherConfig } from '#core/services/fetcher-config';
import type { compareJsonLd, compareOg } from './comparers';
import type { DiffViewer } from './services/diff-viewer';
import type { MetadataReader } from './services/metadata-reader';

export type DiffOptions = {
  fetcher: FetcherConfig;
  useOg: boolean;
  editor?: string;
};

export type RunDiff = (url1: string, url2: string, options: DiffOptions) => Promise<void>;

export type CreateRunDiffDeps = {
  metadataReader: MetadataReader;
  diffViewer: DiffViewer;
  log: Pick<Console, 'log'>;
  compareOg: typeof compareOg;
  compareJsonLd: typeof compareJsonLd;
};

export function createRunDiff(deps: CreateRunDiffDeps): RunDiff {
  return async (url1, url2, options) => {
    const { fetcher, useOg, editor } = options;
    const mode = useOg ? 'OpenGraph' : 'JSON-LD';

    if (editor) {
      deps.diffViewer.ensureEditorAvailable(editor);
    }

    deps.log.log(`\n${bold(`Fetching ${mode} metadata (${formatFetcherLabel(fetcher)})...`)}`);

    if (useOg) {
      const [d1, d2] = await Promise.all([
        deps.metadataReader.readOg(url1, fetcher),
        deps.metadataReader.readOg(url2, fetcher),
      ]);
      deps.log.log(`${cyan`URL1:`} ${url1} → ${Object.keys(d1).length} tag(s)`);
      deps.log.log(`${cyan`URL2:`} ${url2} → ${Object.keys(d2).length} tag(s)\n`);
      deps.compareOg(d1, d2);
      if (editor) {
        deps.diffViewer.openOgDiff(d1, d2, { url1, url2 }, editor);
      }
      return;
    }

    const [d1, d2] = await Promise.all([
      deps.metadataReader.readSchemas(url1, fetcher),
      deps.metadataReader.readSchemas(url2, fetcher),
    ]);
    deps.log.log(`${cyan`URL1:`} ${url1} → ${d1.length} schema(s)`);
    deps.log.log(`${cyan`URL2:`} ${url2} → ${d2.length} schema(s)\n`);
    deps.compareJsonLd(d1, d2);

    if (editor) {
      deps.diffViewer.openSchemasDiff(d1, d2, { url1, url2 }, editor);
    }
  };
}

function formatFetcherLabel(fetcher: FetcherConfig): string {
  if (fetcher.type === 'basic') {
    return 'basic';
  }

  if (fetcher.type === 'curl') {
    return 'curl/SSR';
  }

  if (fetcher.mode === 'launch') {
    return 'browser';
  }

  return `browser connect: ${fetcher.target}`;
}
