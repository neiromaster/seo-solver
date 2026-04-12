import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: ['src/index.ts', 'src/fetch.ts', 'src/extract.ts', 'src/compare.ts', 'src/validate.ts', 'src/report.ts'],
  format: ['esm'],
  sourcemap: true,
});
