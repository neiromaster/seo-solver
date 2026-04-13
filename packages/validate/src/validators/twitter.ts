import type { MetaTagsData, OpenGraphData } from '@seo-solver/types/extract';
import type { ExtractionEnvelope } from '@seo-solver/types/extract-advanced';
import { createRuleCatalog, type RuleDefinition, runRules } from '../utils/rules';

const VALID_CARDS = new Set(['summary', 'summary_large_image', 'app', 'player']);

export class TwitterCardValidator {
  readonly type = 'meta';

  readonly rules: readonly RuleDefinition<MetaTagsData>[] = [
    {
      id: 'twitter/card-missing',
      severity: 'warning',
      message: 'twitter:card is missing',
      check: (data, context) =>
        shouldValidateTwitter(data, context) && !getTwitterValue(data, 'twitter:card') ? {} : null,
    },
    {
      id: 'twitter/card-invalid',
      severity: 'error',
      message: 'twitter:card must be one of summary, summary_large_image, app, or player',
      check: (data, context) => {
        if (!shouldValidateTwitter(data, context)) {
          return null;
        }

        const card = getTwitterValue(data, 'twitter:card');
        return card && !VALID_CARDS.has(card) ? { path: 'name.twitter:card', actual: card } : null;
      },
    },
    {
      id: 'twitter/title-too-long',
      severity: 'warning',
      message: 'twitter:title exceeds 70 characters',
      check: (data, context) =>
        shouldValidateTwitter(data, context)
          ? lengthRule(getTwitterValue(data, 'twitter:title'), 'name.twitter:title', 70)
          : null,
    },
    {
      id: 'twitter/description-too-long',
      severity: 'warning',
      message: 'twitter:description exceeds 200 characters',
      check: (data, context) =>
        shouldValidateTwitter(data, context)
          ? lengthRule(getTwitterValue(data, 'twitter:description'), 'name.twitter:description', 200)
          : null,
    },
    {
      id: 'twitter/image-alt-too-long',
      severity: 'warning',
      message: 'twitter:image:alt exceeds 420 characters',
      check: (data, context) =>
        shouldValidateTwitter(data, context)
          ? lengthRule(getTwitterValue(data, 'twitter:image:alt'), 'name.twitter:image:alt', 420)
          : null,
    },
    {
      id: 'twitter/site-invalid-handle',
      severity: 'warning',
      message: 'twitter:site should start with @',
      check: (data, context) => {
        if (!shouldValidateTwitter(data, context)) {
          return null;
        }

        const site = getTwitterValue(data, 'twitter:site');
        return site && !site.startsWith('@') ? { path: 'name.twitter:site', actual: site } : null;
      },
    },
    {
      id: 'twitter/app-missing-id',
      severity: 'error',
      message: 'App cards must provide an iPhone or Google Play app id',
      check: (data, context) => {
        if (!shouldValidateTwitter(data, context)) {
          return null;
        }

        if (getTwitterValue(data, 'twitter:card') !== 'app') {
          return null;
        }

        return getTwitterValue(data, 'twitter:app:id:iphone') || getTwitterValue(data, 'twitter:app:id:googleplay')
          ? null
          : {};
      },
    },
    {
      id: 'twitter/app-incomplete-ios',
      severity: 'warning',
      message: 'twitter:app:name:iphone should accompany twitter:app:id:iphone',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        getTwitterValue(data, 'twitter:app:id:iphone') &&
        !getTwitterValue(data, 'twitter:app:name:iphone')
          ? {}
          : null,
    },
    {
      id: 'twitter/app-incomplete-android',
      severity: 'warning',
      message: 'twitter:app:name:googleplay should accompany twitter:app:id:googleplay',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        getTwitterValue(data, 'twitter:app:id:googleplay') &&
        !getTwitterValue(data, 'twitter:app:name:googleplay')
          ? {}
          : null,
    },
    {
      id: 'twitter/player-missing',
      severity: 'error',
      message: 'Player cards must include twitter:player',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        getTwitterValue(data, 'twitter:card') === 'player' &&
        !getTwitterValue(data, 'twitter:player')
          ? {}
          : null,
    },
    {
      id: 'twitter/player-not-https',
      severity: 'error',
      message: 'twitter:player must use HTTPS',
      check: (data, context) => {
        if (!shouldValidateTwitter(data, context)) {
          return null;
        }

        const player = getTwitterValue(data, 'twitter:player');
        return getTwitterValue(data, 'twitter:card') === 'player' && player && !player.startsWith('https://')
          ? { path: 'name.twitter:player', actual: player }
          : null;
      },
    },
    {
      id: 'twitter/player-missing-dimensions',
      severity: 'error',
      message: 'Player cards must include twitter:player:width and twitter:player:height',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        getTwitterValue(data, 'twitter:card') === 'player' &&
        (!getTwitterValue(data, 'twitter:player:width') || !getTwitterValue(data, 'twitter:player:height'))
          ? {}
          : null,
    },
    {
      id: 'twitter/title-fallback-og',
      severity: 'info',
      message: 'twitter:title is missing and will fall back to og:title',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        !getTwitterValue(data, 'twitter:title') &&
        getOpenGraphValue(context, 'og:title')
          ? {}
          : null,
    },
    {
      id: 'twitter/description-fallback-og',
      severity: 'info',
      message: 'twitter:description is missing and will fall back to og:description',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        !getTwitterValue(data, 'twitter:description') &&
        getOpenGraphValue(context, 'og:description')
          ? {}
          : null,
    },
    {
      id: 'twitter/image-fallback-og',
      severity: 'info',
      message: 'twitter:image is missing and will fall back to og:image',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        !getTwitterValue(data, 'twitter:image') &&
        getOpenGraphValue(context, 'og:image')
          ? {}
          : null,
    },
    {
      id: 'twitter/title-no-fallback',
      severity: 'error',
      message: 'Neither twitter:title nor og:title is present',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        !getTwitterValue(data, 'twitter:title') &&
        !getOpenGraphValue(context, 'og:title')
          ? {}
          : null,
    },
    {
      id: 'twitter/image-no-fallback',
      severity: 'error',
      message: 'Neither twitter:image nor og:image is present',
      check: (data, context) =>
        shouldValidateTwitter(data, context) &&
        !getTwitterValue(data, 'twitter:image') &&
        !getOpenGraphValue(context, 'og:image')
          ? {}
          : null,
    },
  ];

  async validate(
    envelope: ExtractionEnvelope<MetaTagsData>,
    context?: ExtractionEnvelope[],
    options?: { isRuleEnabled?: (ruleId: string) => boolean },
  ) {
    return runRules(envelope, context, this.rules, options);
  }
}

export const twitterCardRuleCatalog = createRuleCatalog('meta', new TwitterCardValidator().rules);

function getTwitterValue(data: MetaTagsData, key: string): string | null {
  const value = data.name[key];
  return value && value !== '' ? value : null;
}

function getOpenGraphValue(context: ExtractionEnvelope[] | undefined, key: string): string | null {
  const envelope = context?.find((entry): entry is ExtractionEnvelope<OpenGraphData> => entry.type === 'opengraph');
  if (!envelope) {
    return null;
  }

  const value = envelope.data[key];
  if (typeof value === 'string') {
    return value || null;
  }

  return Array.isArray(value) ? (value.find((entry) => entry !== '') ?? null) : null;
}

function lengthRule(value: string | null, path: string, limit: number) {
  return value && value.length > limit ? { path, expected: limit, actual: value.length } : null;
}

function shouldValidateTwitter(data: MetaTagsData, context: ExtractionEnvelope[] | undefined): boolean {
  const hasTwitterTags = Object.keys(data.name).some((key) => key.startsWith('twitter:'));
  const hasOpenGraphContext = context?.some((entry) => {
    if (entry.type !== 'opengraph') {
      return false;
    }

    return Object.keys(entry.data as OpenGraphData).length > 0;
  });

  return hasTwitterTags || Boolean(hasOpenGraphContext);
}
