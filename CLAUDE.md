---
description: Use pnpm workspace commands for this repository.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to pnpm for package management and workspace execution.

- Use `pnpm install` instead of `bun install`, `npm install`, or `yarn install`
- Use `pnpm run <script>` for root scripts
- Use `pnpm --filter seo-solver <script>` for app-specific scripts
- Use `pnpm exec <tool>` instead of `bunx` or `npx`

## Testing

Use Vitest through pnpm.

```ts
import { expect, test } from 'vitest';

test('hello world', () => {
  expect(1).toBe(1);
});
```
