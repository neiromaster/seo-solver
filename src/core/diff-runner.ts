import { bold, cyan } from 'ansis';
import type { compareJsonLd, compareOg } from './comparers';
import type { DiffViewer } from './services/diff-viewer';
import type { MetadataReader, ReadMode } from './services/metadata-reader';

export type DiffOptions = {
  useCurl: boolean;
  useOg: boolean;
  vscodeDiff: boolean;
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
    const { useCurl, useOg, vscodeDiff } = options;
    const readMode: ReadMode = useCurl ? 'curl' : 'browser';
    const mode = useOg ? 'OpenGraph' : 'JSON-LD';
    deps.log.log(`\n${bold(`Fetching ${mode} metadata${useCurl ? ' (curl/SSR)' : ' (browser)'}...`)}`);

    if (useOg) {
      const [d1, d2] = await Promise.all([
        deps.metadataReader.readOg(url1, readMode),
        deps.metadataReader.readOg(url2, readMode),
      ]);
      deps.log.log(`${cyan`URL1:`} ${url1} → ${Object.keys(d1).length} tag(s)`);
      deps.log.log(`${cyan`URL2:`} ${url2} → ${Object.keys(d2).length} tag(s)\n`);
      deps.compareOg(d1, d2);
      if (vscodeDiff) {
        deps.diffViewer.openOgDiff(d1, d2, { url1, url2 });
      }
      return;
    }

    const [d1, d2] = await Promise.all([
      deps.metadataReader.readSchemas(url1, readMode),
      deps.metadataReader.readSchemas(url2, readMode),
    ]);
    deps.log.log(`${cyan`URL1:`} ${url1} → ${d1.length} schema(s)`);
    deps.log.log(`${cyan`URL2:`} ${url2} → ${d2.length} schema(s)\n`);
    deps.compareJsonLd(d1, d2);

    if (vscodeDiff) {
      deps.diffViewer.openSchemasDiff(d1, d2, { url1, url2 });
    }
  };
}
