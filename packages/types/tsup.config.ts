import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: [
    'src/index.ts',
    'src/fetch.ts',
    'src/extract.ts',
    'src/extract-advanced.ts',
    'src/compare.ts',
    'src/compare-advanced.ts',
    'src/validate.ts',
    'src/validate-advanced.ts',
    'src/report.ts',
  ],
  format: ['esm'],
  sourcemap: true,
});
