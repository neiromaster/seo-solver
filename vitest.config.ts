import { defineConfig } from 'vitest/config';
import { sourceConditions, withSourceConditions } from './test-support/vitest.js';

export default defineConfig(
  withSourceConditions({
    test: {
      projects: ['packages/*/vitest.config.ts', 'apps/*/vitest.config.ts'],
      coverage: {
        provider: 'v8',
      },
    },
    resolve: {
      conditions: [...sourceConditions],
    },
  }),
);
