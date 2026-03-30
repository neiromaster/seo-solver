import { bold, cyan, yellow } from 'ansis';
import type { FetcherConfig } from '#core/services/fetcher-config';
import type { DiffViewer } from './services/diff-viewer';
import type { MetadataReader } from './services/metadata-reader';
import type { SchemaValidator } from './services/schema-validator';

export type ValidateOptions = {
  fetcher: FetcherConfig;
  useOg: boolean;
  editor?: string;
};

export type RunValidate = (url: string, options: ValidateOptions) => Promise<void>;

export type CreateRunValidateDeps = {
  metadataReader: MetadataReader;
  schemaValidator: SchemaValidator;
  diffViewer: DiffViewer;
  log: Pick<Console, 'log'>;
};

export function createRunValidate(deps: CreateRunValidateDeps): RunValidate {
  return async (url, options) => {
    const { fetcher, useOg, editor } = options;
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    if (editor) {
      deps.diffViewer.ensureEditorAvailable(editor);
    }

    const mode = useOg ? 'OpenGraph' : 'JSON-LD';
    deps.log.log(`\n${bold(`Validating ${mode} (${formatFetcherLabel(fetcher)})...`)}\n`);

    if (useOg) {
      const data = await deps.metadataReader.readOg(normalizedUrl, fetcher);
      if (editor) {
        deps.diffViewer.openOg(data, normalizedUrl, editor);
      }
      deps.log.log(`${cyan`URL:`} ${normalizedUrl} → ${Object.keys(data).length} tag(s)\n`);
      deps.log.log(`${yellow`OpenGraph validation not supported`}\n`);
      return;
    }

    const data = await deps.metadataReader.readSchemas(normalizedUrl, fetcher);
    if (editor) {
      deps.diffViewer.openSchemas(data, normalizedUrl, editor);
    }
    deps.log.log(`${cyan`URL:`} ${normalizedUrl} → ${data.length} schema(s)\n`);
    await deps.schemaValidator.validate(data);
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
