import type { Validator as PublicValidator, ValidationPipelineConfig } from '@seo-solver/types/validate';
import type { RuleAwareValidator } from '../utils/rules.js';
import { AppLinksValidator } from './applinks.js';
import { CanonicalValidator } from './canonical.js';
import { CrossValidator } from './cross.js';
import { HeadingsValidator } from './headings.js';
import { JsonLdValidator } from './jsonld.js';
import { MetaTagsValidator } from './meta.js';
import { OpenGraphValidator } from './opengraph.js';
import { PinterestValidator } from './pinterest.js';
import { RobotsTxtValidator } from './robots-txt.js';
import { TwitterCardValidator } from './twitter.js';
import { VKValidator } from './vk.js';

export type BuiltInValidatorId =
  | 'opengraph'
  | 'jsonld'
  | 'meta'
  | 'headings'
  | 'canonical'
  | 'robots-txt'
  | 'twitter'
  | 'vk'
  | 'pinterest'
  | 'applinks'
  | 'cross';

export function createBuiltInValidators(
  _config: ValidationPipelineConfig = {},
): Record<BuiltInValidatorId, RuleAwareValidator> {
  return {
    applinks: new AppLinksValidator(),
    cross: new CrossValidator(),
    opengraph: new OpenGraphValidator(),
    jsonld: new JsonLdValidator(),
    meta: new MetaTagsValidator(),
    headings: new HeadingsValidator(),
    canonical: new CanonicalValidator(),
    pinterest: new PinterestValidator(),
    'robots-txt': new RobotsTxtValidator(),
    twitter: new TwitterCardValidator(),
    vk: new VKValidator(),
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
