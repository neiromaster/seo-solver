import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: ['src/index.ts', 'src/advanced.ts'],
  format: ['esm'],
  sourcemap: true,
});
