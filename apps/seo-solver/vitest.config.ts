import { defineConfig } from 'vitest/config';
import { withSourceConditions } from '../../test-support/vitest.js';

export default defineConfig(
  withSourceConditions({
    test: {
      environment: 'node',
      fileParallelism: false,
    },
  }),
);
