# AGENTS.md

Repo-wide rules for coding agents in `seo-solver`.

Read with `docs/architecture/monorepo-conventions.md`. If they conflict, prefer the stricter boundary-preserving rule.

## Scope

- This file defines repo-wide rules.
- Put package- or app-specific rules in the nearest nested `AGENTS.md`.
- Follow both root and nested files; the nested file is the tighter contract for its subtree.

## Commands

- Use `pnpm` for all workspace operations.
- Root scripts: `pnpm run <script>`
- Package/app scripts: `pnpm --filter <package> <script>`
- Tool binaries: `pnpm exec <tool>`

## Boundaries

- Do not import or re-export another package’s `src/**` or `src/test-support/**`.
- Shared cross-package test helpers belong in root `test-support/`.
- Prefer package entrypoints over sibling-source reach-through.
- Do not duplicate repo-owned shared helpers inside packages.

## Types

- Prefer narrow imports such as `@seo-solver/types/fetch`.
- Root `@seo-solver/types` is reserved for `ResourceType` only.
- Do not broaden the root surface without an explicit API decision.

## Invariants

- Runtime baseline: Node 22.
- Cross-package source resolution uses `@seo-solver/source` via conditional exports. No shared `paths` or `baseUrl`.
- Root build graph uses `tsconfig.json` + package `tsconfig.build.json` only.
- Root test/editor graph uses `tsconfig.test.json` + package/app `tsconfig.test.json` nodes.
- Package/app `tsconfig.json` files are editor-focused and `noEmit`.
- `test-support/vitest.ts` is the shared Vitest helper for source conditions.
- Libraries build with `tsdown` + `tsc -b tsconfig.build.json --force`.
- CLI output must stay a single runtime file: `dist/index.js`.

## Testing and releases

- Packaging tests define the public runtime entry contract and must stay aligned with `exports`.
- CLI publish/install tests must use the staged-copy harness, not mutate the live package directory.
- Keep `build`, `test`, and `typecheck` serialized where shared build state would otherwise race.
- Treat fixtures and expected outputs as specification. Update them deliberately and explain why.
- Add edge-case coverage in the same change; do not leave deferred `TODO` coverage.
- Do not make one behavior green by rewriting unrelated fixtures.
- Create a changeset for public behavior changes. Skip it for docs-only, tests-only, tooling-only, and internal refactors with no public behavior change.

## Verification

Run the relevant subset of:
- `pnpm run consistency:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`
