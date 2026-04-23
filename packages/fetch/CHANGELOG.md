# @seo-solver/fetch

## 0.1.0

### Minor Changes

- [#10](https://github.com/neiromaster/seo-solver/pull/10) [`cd70cb0`](https://github.com/neiromaster/seo-solver/commit/cd70cb0f6fdce66c6060c0c4e1760e4bd89d40db) Thanks [@neiromaster](https://github.com/neiromaster)! - Refactor the fetch package around a simpler root API and a more explicit advanced runtime surface. The root package now focuses on `fetchUrl()` and `createFetcher()`, while advanced runtime registration is explicit and the internal layout is split into `api`, `core`, and `advanced-runtime` modules.

## 0.0.1

### Patch Changes

- [#1](https://github.com/neiromaster/seo-solver/pull/1) [`b4b079d`](https://github.com/neiromaster/seo-solver/commit/b4b079d56423986fac00aae683c5be485c22751d) Thanks [@neiromaster](https://github.com/neiromaster)! - Finish the remaining remediation waves by tightening package boundaries, adding final Level 1 APIs, moving app glue into package-owned contracts, and aligning the CLI with the final target and fetch flag vocabulary.

- Updated dependencies [[`b4b079d`](https://github.com/neiromaster/seo-solver/commit/b4b079d56423986fac00aae683c5be485c22751d)]:
  - @seo-solver/types@0.1.0
