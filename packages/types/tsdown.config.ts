import { defineConfig } from 'tsdown';

export default defineConfig({
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
  format: 'esm',
  platform: 'node',
  target: 'node22',
  dts: false,
  clean: true,
  sourcemap: true,
  outputOptions: {
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
  },
});
