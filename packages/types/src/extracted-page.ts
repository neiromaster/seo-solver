import type { CanonicalData } from './data/canonical';
import type { HeadingsData } from './data/headings';
import type { JsonLdData } from './data/jsonld';
import type { MetaTagsData } from './data/meta';
import type { OpenGraphData } from './data/opengraph';
import type { RobotsTxtData } from './data/robots-txt';
import type { ResourceType } from './resource-type';

export type ExtractedPageError = {
  extractor: string;
  message: string;
  path?: string;
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
  data: {
    canonical: CanonicalData | null;
    headings: HeadingsData | null;
    jsonld: JsonLdData | null;
    meta: MetaTagsData | null;
    opengraph: OpenGraphData | null;
    robotsTxt: RobotsTxtData | null;
  };
  errors: ExtractedPageError[];
};
