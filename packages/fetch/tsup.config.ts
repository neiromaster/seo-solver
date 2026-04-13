import { defineConfig } from 'tsup';

export default defineConfig({
  clean: false,
  entry: ['src/index.ts', 'src/advanced.ts'],
  format: ['esm'],
  sourcemap: true,
});
