# AGENTS.md

## Purpose

This file defines repository-level instructions for coding agents working in `seo-solver`.

Read this together with:

- `CLAUDE.md`
- `docs/architecture/monorepo-conventions.md`

If these documents appear to conflict, prefer the stricter boundary-preserving interpretation.

## Package manager and command conventions

- Use `pnpm` for all package management and workspace execution.
- Use `pnpm run <script>` for root scripts.
- Use `pnpm --filter <package> <script>` for package/app-specific scripts.
- Use `pnpm exec <tool>` instead of `npx` or `bunx`.

## Monorepo boundary rules

These are hard rules:

- Do not import or re-export another package’s `src/**` or `src/test-support/**` internals.
- Do not recreate package-local copies of repo-owned shared helpers.
- Shared cross-package test infrastructure belongs in root `test-support/`.
- Prefer package entrypoints and exported contracts over sibling-source reach-through.

## `@seo-solver/types` rules

- Prefer narrow subpath imports such as `@seo-solver/types/fetch` or `@seo-solver/types/validate`.
- Root `@seo-solver/types` usage is reserved for `ResourceType` only.
- Do not broaden the root surface again unless the public API decision is explicitly revisited.

## Package role expectations

- `apps/seo-solver` is the publishable CLI app.
- `packages/typescript-config` is a private config-only package.
- Other packages under `packages/` are publishable runtime libraries.
- `packages/fetch-playwright` is an optional integration package and may keep peer dependency metadata.

## Config and testing standards

- Tested publishable packages should have a local `vitest.config.ts`.
- Default `tsup.clean` policy is `clean: true`.
- Any `clean: false` exception must be justified inline.
- Keep workspace `build`, `test`, and `typecheck` scripts serialized where shared build state would otherwise race.

## Metadata standards

Publishable packages should define:

- `description`
- `license`
- `repository`
- `bugs`
- `homepage`

Do not remove these fields from public packages without a deliberate release-surface decision.

## Changesets

Before commit, check whether the change affects public package behavior.

Create a changeset for:

- new features
- bug fixes
- breaking changes
- dependency changes that affect public package behavior

Skip changesets for:

- docs-only changes
- tests-only changes
- tooling-only changes
- internal refactors with no public behavior change

## Implementation guidance for agents

- Keep changes minimal and boundary-preserving.
- Prefer tightening existing conventions over introducing new abstractions.
- DRY applies to config and shared infrastructure, not forced domain abstractions.
- KISS applies everywhere: one clear role per package, one canonical location per shared helper, one obvious path through the code.

## Verification expectations

For meaningful changes, run the relevant subset of:

- `pnpm run consistency:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

If a change touches only one package, still prefer verifying through that package’s real workspace script path, not just ad hoc commands.
