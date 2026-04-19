import type { CanonicalData } from './data/canonical.js';
import type { HeadingsData } from './data/headings.js';
import type { JsonLdData } from './data/jsonld.js';
import type { MetaTagsData } from './data/meta.js';
import type { OpenGraphData } from './data/opengraph.js';
import type { RobotsTxtData } from './data/robots-txt.js';
import type { ResourceType } from './resource-type.js';
import type { TargetKey } from './target-catalog.js';

export type ExtractedPageError = {
  extractor: string;
  message: string;
  path?: string | undefined;
};

export type ExtractedDataByTarget = {
  canonical: CanonicalData;
  headings: HeadingsData;
  jsonld: JsonLdData;
  meta: MetaTagsData;
  opengraph: OpenGraphData;
  robotsTxt: RobotsTxtData;
};

export type ExtractedPageData = {
  [K in TargetKey]?: ExtractedDataByTarget[K] | null;
};

export type ExtractedPage = {
  source: {
    requestUrl: string;
    url: string;
    statusCode: number;
    resourceType: ResourceType;
    redirects: [status: number, url: string][];
    timing: number;
    attempts: number;
    fetchedAt: string;
  };
  data: ExtractedPageData;
  errors: ExtractedPageError[];
};
