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

## Changesets

Before every commit, check whether the change affects public package behaviour (new features, bug fixes, breaking changes, dependency updates). If yes, manually create a changeset file in `.changeset/<slug>.md`:

```md
---
"seo-solver": patch   # patch | minor | major
---

Short description of what changed and why.
```

Skip changesets for internal-only changes (tests, tooling, CI, docs, refactors that don't affect public API or behaviour).

## Code Style

- Omit `.js` extensions from TypeScript imports — `moduleResolution: "bundler"` resolves extensionless imports natively

## Testing

Use Vitest through pnpm.

```ts
import { expect, test } from 'vitest';

test('hello world', () => {
  expect(1).toBe(1);
});
```
