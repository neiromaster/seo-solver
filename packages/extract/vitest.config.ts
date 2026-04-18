import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@seo-solver/source'],
  },
  test: {
    environment: 'node',
  },
});
