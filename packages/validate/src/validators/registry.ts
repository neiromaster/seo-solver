import type { Validator as PublicValidator, ValidationPipelineConfig } from '@seo-solver/types/validate-advanced';
import type { RuleAwareValidator } from '../utils/rules';
import { AppLinksValidator } from './applinks';
import { CanonicalValidator } from './canonical';
import { CrossValidator } from './cross';
import { HeadingsValidator } from './headings';
import { JsonLdValidator } from './jsonld';
import { MetaTagsValidator } from './meta';
import { OpenGraphValidator } from './opengraph';
import { PinterestValidator } from './pinterest';
import { RobotsTxtValidator } from './robots-txt';
import { TwitterCardValidator } from './twitter';
import { VKValidator } from './vk';

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
  config: ValidationPipelineConfig = {},
): Record<BuiltInValidatorId, RuleAwareValidator> {
  return {
    applinks: new AppLinksValidator(),
    cross: new CrossValidator(),
    opengraph: new OpenGraphValidator(),
    jsonld: new JsonLdValidator(config.runtime?.jsonldAdobe),
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
