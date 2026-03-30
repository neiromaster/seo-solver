import { bold, cyan, yellow } from 'ansis';
import type { DiffViewer } from './services/diff-viewer';
import type { MetadataReader, ReadMode } from './services/metadata-reader';
import type { SchemaValidator } from './services/schema-validator';

export type ValidateOptions = {
  useCurl: boolean;
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
    const { useCurl, useOg, editor } = options;
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const readMode: ReadMode = useCurl ? 'curl' : 'browser';

    if (editor) {
      deps.diffViewer.ensureEditorAvailable(editor);
    }

    const mode = useOg ? 'OpenGraph' : 'JSON-LD';
    deps.log.log(`\n${bold(`Validating ${mode}${useCurl ? ' (curl/SSR)' : ' (browser)'}...`)}\n`);

    if (useOg) {
      const data = await deps.metadataReader.readOg(normalizedUrl, readMode);
      if (editor) {
        deps.diffViewer.openOg(data, normalizedUrl, editor);
      }
      deps.log.log(`${cyan`URL:`} ${normalizedUrl} → ${Object.keys(data).length} tag(s)\n`);
      deps.log.log(`${yellow`OpenGraph validation not supported`}\n`);
      return;
    }

    const data = await deps.metadataReader.readSchemas(normalizedUrl, readMode);
    if (editor) {
      deps.diffViewer.openSchemas(data, normalizedUrl, editor);
    }
    deps.log.log(`${cyan`URL:`} ${normalizedUrl} → ${data.length} schema(s)\n`);
    await deps.schemaValidator.validate(data);
  };
}
