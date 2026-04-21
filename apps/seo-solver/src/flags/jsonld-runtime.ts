import { number, option, optional, string } from 'cmd-ts';

export const jsonldRuntimeFlag = option({
  long: 'jsonld-runtime',
  type: optional(string),
  description: 'JSON-LD runtime mode: adobe or off (default: off)',
});

export const jsonldCacheFileFlag = option({
  long: 'jsonld-cache-file',
  type: optional(string),
  description: 'Optional cache file for JSON-LD runtime schema data',
});

export const jsonldSchemaUrlFlag = option({
  long: 'jsonld-schema-url',
  type: optional(string),
  description: 'Override schema.org JSON-LD schema URL for runtime validation',
});

export const jsonldSchemaTtlMsFlag = option({
  long: 'jsonld-schema-ttl-ms',
  type: optional(number),
  description: 'Schema cache TTL in milliseconds for JSON-LD runtime validation',
});

export const jsonldRuntimeFlags = {
  jsonldRuntime: jsonldRuntimeFlag,
  jsonldCacheFile: jsonldCacheFileFlag,
  jsonldSchemaUrl: jsonldSchemaUrlFlag,
  jsonldSchemaTtlMs: jsonldSchemaTtlMsFlag,
};
