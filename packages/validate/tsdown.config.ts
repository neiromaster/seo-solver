import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/advanced.ts'],
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
