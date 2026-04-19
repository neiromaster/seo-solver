# Monorepo conventions

Date: 2026-04-18
Status: active

## Purpose

These conventions describe the post-cutover monorepo architecture for `seo-solver`: solution-style TypeScript build graph, source-level workspace resolution through conditional exports, `tsdown` runtime bundling, and Vitest root projects.

## Workspace roles

### CLI app

- `apps/seo-solver`
- published CLI package with `bin`
- bundled into a self-contained artifact
- not part of the declaration graph
- may depend only on package entrypoints, never sibling `src/**`

### Publishable runtime libraries

- `packages/types`
- `packages/fetch`
- `packages/fetch-playwright`
- `packages/extract`
- `packages/compare`
- `packages/report`
- `packages/validate`

Required traits:

- `type: module`
- `exports` map with `@seo-solver/source` as the first condition key
- JS output in `dist/*.js` from `tsdown`
- declarations in `dist/*.d.ts` from `tsc -b tsconfig.build.json`
- package-local `tsconfig.json` for editor/test and `tsconfig.build.json` for declaration emit

### Private config package

- `packages/typescript-config`

Required traits:

- `private: true`
- config-only exports
- no runtime build surface

## Boundary rules

These are hard rules.

- No app or package code may import another package’s `src/**` or `src/test-support/**` internals.
- Cross-package imports must go through package entrypoints such as `@seo-solver/fetch` or `@seo-solver/types/fetch`.
- Shared test infrastructure belongs in root `test-support/`.
- Publishable packages must not recreate repo-owned shared helpers locally.

## TypeScript graph rules

### Resolution layer

Cross-package source resolution uses conditional exports only.

- Workspace condition name: `@seo-solver/source`
- `packages/typescript-config/base.json` sets `customConditions: ["@seo-solver/source"]`
- package `exports` map `@seo-solver/source` to `src/**`
- published consumers fall through to `dist/**`

No shared `paths`. No `baseUrl`. No per-package alias layer.

### Build graph

- Root `tsconfig.json` is a solution shell with `files: []`
- Root references point only at package `tsconfig.build.json` files
- Package `tsconfig.build.json` files are `composite`, `emitDeclarationOnly`, `src/**`-only
- Apps are excluded from the declaration graph

### Editor/test graph

- Each package `tsconfig.json` extends `packages/typescript-config/composite.json`
- Package editor configs remain no-emit and may reference upstream build configs where that keeps local package scripts simple
- Root `tsconfig.test.json` is a solution-style shell that references dedicated test graph nodes (`packages/*/tsconfig.test.json`, `apps/seo-solver/tsconfig.test.json`, `test-support/`, and `scripts/`)
- Package/app `tsconfig.test.json` files own the reference-based test/editor graph and emit only into ignored `.typecheck/` directories
- Root and project-local typecheck commands both run through `tsc -b ...` over those dedicated test graph nodes

## Vitest rules

- Root `vitest.config.ts` owns `test.projects`
- Root `resolve.conditions` includes `@seo-solver/source`
- Package/app `vitest.config.ts` files stay minimal and layer local concerns on top of the shared `test-support/vitest.ts` helper
- Tests must pass without a prior build

## Bundling rules

### Packages

- `tsdown` emits runtime JS to `dist/`
- `tsc -b tsconfig.build.json --force` emits declarations
- package `build` script: `tsdown && pnpm exec tsc -b tsconfig.build.json --force`
- Packaging policy distinguishes **public runtime entry files** from private helper chunks:
  - single-entry libraries must expose exactly `dist/index.js` as their public runtime entry
  - dual-entry libraries must expose exactly `dist/index.js` and `dist/advanced.js` as public runtime entries
  - `@seo-solver/types` must expose the exact public entry set implied by its `exports` surface
  - hashed helper chunks are allowed for libraries when `tsdown` needs them internally, but packaging tests enforce the exact public entry set

### CLI

- `apps/seo-solver/tsdown.config.ts` uses top-level `banner: { js: '#!/usr/bin/env node' }`
- `deps.alwaysBundle` and `deps.onlyBundle` define the allowed bundled dependency closure
- `deps.neverBundle` keeps `@seo-solver/fetch-playwright` external
- CLI build remains single-entry bundled ESM output at `dist/index.js`
- The CLI artifact policy is stricter than libraries: the packed tarball must contain exactly one runtime JS artifact, `dist/index.js`

## CLI publish contract

The CLI is published as a self-contained artifact.

Development shape:

- runtime workspace packages live in `dependencies` with `workspace:^`
- `@seo-solver/fetch-playwright` lives in `peerDependencies` and is optional
- `@seo-solver/fetch-playwright` is mirrored in `devDependencies` with `workspace:*` for local install

Publish shape:

- `prepublishOnly` builds then strips `dependencies` from `package.json`
- `postpublish` restores the working copy
- packed CLI tarball must not pull transitive `@seo-solver/*` runtime packages
- the publish/install test harness stages the CLI package into an isolated temp copy before strip/pack/restore so tests do not mutate the live package directory

## Runtime baseline

- The workspace targets Node 22.
- CLI and package build configs use `target: 'node22'`.
- The shared TypeScript base config keeps `target: "ES2023"` intentionally, because it is sufficient for the current runtime surface while the runtime baseline itself is Node 22.

## `@seo-solver/types` import rules

- Prefer narrow subpaths like `@seo-solver/types/fetch`
- Root `@seo-solver/types` is reserved for intentionally shared cross-domain primitives
- `ResourceType` remains the canonical root-level shared type

## Verification rules

Meaningful monorepo changes should pass:

- `pnpm run consistency:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`

For CLI changes, also smoke-test the built artifact directly.
