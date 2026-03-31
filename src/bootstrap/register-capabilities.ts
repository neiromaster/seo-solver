import {
  createBrowserHtmlClient,
  createPlaywrightBrowserClient,
  createPlaywrightPageReader,
  launchDefaultBrowserWithRuntimePrompt,
} from '#adapters/browser';
import { createTempFileStore } from '#adapters/filesystem';
import { createFetchHttpClient } from '#adapters/http';
import { createSchemaOrgValidationRuntime } from '#adapters/validation';
import type { CapabilityRegistry } from '#kernel';
import { JsonLdComparator, JsonLdExtractor, SchemaOrgValidator } from '#plugins/extractors/jsonld';
import { OpenGraphComparator, OpenGraphExtractor } from '#plugins/extractors/opengraph';
import { BasicFetcher } from '#plugins/fetchers/basic-fetcher';
import { BrowserFetcher } from '#plugins/fetchers/browser-fetcher';
import { EditorDiffRenderer } from '#plugins/renderers/editor-diff';
import { JsonRenderer } from '#plugins/renderers/json';
import { TerminalRenderer } from '#plugins/renderers/terminal';

export function registerCapabilities(registry: CapabilityRegistry): void {
  registry.fetchers.set('basic', new BasicFetcher(createFetchHttpClient()));
  registry.fetchers.set(
    'browser',
    new BrowserFetcher({
      browserHtmlClient: createBrowserHtmlClient({
        browserClient: createPlaywrightBrowserClient(),
        pageReader: createPlaywrightPageReader(),
        launchBrowser: launchDefaultBrowserWithRuntimePrompt,
      }),
    }),
  );
  registry.extractors.set('jsonld', {
    id: 'jsonld',
    extractor: new JsonLdExtractor(),
    comparator: new JsonLdComparator(),
    validators: [new SchemaOrgValidator(createSchemaOrgValidationRuntime())],
  });
  registry.extractors.set('opengraph', {
    id: 'opengraph',
    extractor: new OpenGraphExtractor(),
    comparator: new OpenGraphComparator(),
    validators: [],
  });
  registry.renderers.set('editor-diff', new EditorDiffRenderer(createTempFileStore()));
  registry.renderers.set('json', new JsonRenderer());
  registry.renderers.set('terminal', new TerminalRenderer());
}
