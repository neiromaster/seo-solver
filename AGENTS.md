# AGENTS.md

Repository rules for coding agents working in `seo-solver`.

Read with:
- `docs/architecture/monorepo-conventions.md`

If they conflict, prefer the stricter boundary-preserving rule.

## Commands

- Use `pnpm` for all package and workspace operations.
- Root scripts: `pnpm run <script>`
- Package/app scripts: `pnpm --filter <package> <script>`
- Tool binaries: `pnpm exec <tool>`

## Hard boundaries

- Do not import or re-export another package’s `src/**` or `src/test-support/**`.
- Shared cross-package test helpers belong in root `test-support/`.
- Prefer package entrypoints and exported contracts over sibling-source reach-through.
- Do not duplicate repo-owned shared helpers inside packages.

## Types package

- Prefer narrow imports such as `@seo-solver/types/fetch`.
- Root `@seo-solver/types` is reserved for `ResourceType` only.
- Do not broaden the root surface without an explicit API decision.

## Current architecture invariants

- Runtime baseline is **Node 22**.
- Cross-package source resolution uses `@seo-solver/source` via conditional exports; no shared `paths` or `baseUrl`.
- Root build graph uses `tsconfig.json` + package `tsconfig.build.json` only.
- Root test/editor graph uses `tsconfig.test.json` + package/app `tsconfig.test.json` nodes.
- Package/app `tsconfig.json` files are editor-focused and `noEmit`.
- `test-support/vitest.ts` is the canonical shared Vitest helper for source conditions.
- Libraries build with `tsdown` + `tsc -b tsconfig.build.json --force`.
- CLI output must stay a single runtime file: `dist/index.js`.

## Package roles

- `apps/seo-solver`: publishable CLI app
- `packages/typescript-config`: private config-only package
- other `packages/*`: publishable runtime libraries
- `packages/fetch-playwright`: optional integration package with peer dependency metadata

## Testing and packaging

- Tested publishable packages should have a local `vitest.config.ts`.
- Packaging tests define the public runtime entry contract; keep them aligned with `exports`.
- CLI publish/install tests must use the staged-copy harness, not mutate the live package directory.
- Keep `build`, `test`, and `typecheck` serialized where shared build state would otherwise race.

## Metadata

Public packages should define:
- `description`
- `license`
- `repository`
- `bugs`
- `homepage`

## Changesets

Create a changeset for:
- features
- bug fixes
- breaking changes
- dependency changes that affect public behavior

Skip changesets for:
- docs-only changes
- tests-only changes
- tooling-only changes
- internal refactors with no public behavior change

## Verification

Run the relevant subset of:
- `pnpm run consistency:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`

If touching one package, still prefer that package’s real workspace script path over ad hoc commands.
