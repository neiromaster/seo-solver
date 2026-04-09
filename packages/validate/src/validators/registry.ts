import type { Validator as PublicValidator, ValidationPipelineConfig } from '@seo-solver/types';
import type { RuleAwareValidator } from '../utils/rules.js';
import { CanonicalValidator } from './canonical.js';
import { HeadingsValidator } from './headings.js';
import { JsonLdValidator } from './jsonld.js';
import { MetaTagsValidator } from './meta.js';
import { OpenGraphValidator } from './opengraph.js';
import { RobotsTxtValidator } from './robots-txt.js';

export type BuiltInValidatorId = 'opengraph' | 'jsonld' | 'meta' | 'headings' | 'canonical' | 'robots-txt';

export function createBuiltInValidators(
  _config: ValidationPipelineConfig = {},
): Record<BuiltInValidatorId, RuleAwareValidator> {
  return {
    opengraph: new OpenGraphValidator(),
    jsonld: new JsonLdValidator(),
    meta: new MetaTagsValidator(),
    headings: new HeadingsValidator(),
    canonical: new CanonicalValidator(),
    'robots-txt': new RobotsTxtValidator(),
  };
}

export function resolveValidators(
  config: ValidationPipelineConfig | undefined,
  requested: Array<string | PublicValidator> | undefined,
): RuleAwareValidator[] {
  const registry = createBuiltInValidators(config);
  const selected = requested ?? Object.keys(registry);

  return selected.map((entry) => {
    if (typeof entry !== 'string') {
      return entry as RuleAwareValidator;
    }

    const validator = registry[entry as BuiltInValidatorId];
    if (!validator) {
      throw new Error(`Unknown validator: ${entry}`);
    }

    return validator;
  });
}
