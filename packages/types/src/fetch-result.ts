import type { ResourceType } from './resource-type';

export type FetchResult = {
  requestUrl: string;
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  resourceType: ResourceType;
  redirects: [status: number, url: string][];
  timing: number;
  attempts: number;
};
