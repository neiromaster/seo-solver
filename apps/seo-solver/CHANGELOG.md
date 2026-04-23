# seo-solver

## 1.0.0

### Patch Changes

- Updated dependencies [[`a493a35`](https://github.com/neiromaster/seo-solver/commit/a493a35f52e64dbeb49f761d1c714abd34154b02)]:
  - @seo-solver/fetch-playwright@0.1.0

## 0.1.4

### Patch Changes

- Updated dependencies [[`cd70cb0`](https://github.com/neiromaster/seo-solver/commit/cd70cb0f6fdce66c6060c0c4e1760e4bd89d40db)]:
  - @seo-solver/fetch@0.1.0
  - @seo-solver/fetch-playwright@0.0.2

## 0.1.3

### Patch Changes

- Updated dependencies [[`88e76c2`](https://github.com/neiromaster/seo-solver/commit/88e76c29bc0721a4fda60e1a7a68649948a7d501)]:
  - @seo-solver/extract@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`1bb5141`](https://github.com/neiromaster/seo-solver/commit/1bb5141c0f58723201afcde7270f61d6ad3dfee9)]:
  - @seo-solver/compare@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`dbf1451`](https://github.com/neiromaster/seo-solver/commit/dbf145116745b8e2c711098ad6ab3ff741862830)]:
  - @seo-solver/extract@0.2.0

## 0.1.0

### Minor Changes

- [#1](https://github.com/neiromaster/seo-solver/pull/1) [`7cae514`](https://github.com/neiromaster/seo-solver/commit/7cae5149cb766bb561cd927674cf4fb802f0b3af) Thanks [@neiromaster](https://github.com/neiromaster)! - Add the new `@seo-solver/validate` package and shared validation contracts in `@seo-solver/types` for SEO extraction validation pipelines.

- [#1](https://github.com/neiromaster/seo-solver/pull/1) [`75e2fac`](https://github.com/neiromaster/seo-solver/commit/75e2fac846425c59b4a1ff3a28bea6a35155b8a2) Thanks [@neiromaster](https://github.com/neiromaster)! - Add editor mode for `extract` and `compare`. `extract --editor` can open the generated JSON in supported editors, while `compare --editor` opens two normalized JSON artifacts in diff mode without changing normal `--format` and `--output` behavior.

- [#1](https://github.com/neiromaster/seo-solver/pull/1) [`b4b079d`](https://github.com/neiromaster/seo-solver/commit/b4b079d56423986fac00aae683c5be485c22751d) Thanks [@neiromaster](https://github.com/neiromaster)! - Finish the remaining remediation waves by tightening package boundaries, adding final Level 1 APIs, moving app glue into package-owned contracts, and aligning the CLI with the final target and fetch flag vocabulary.

- [#1](https://github.com/neiromaster/seo-solver/pull/1) [`cba2f01`](https://github.com/neiromaster/seo-solver/commit/cba2f0186dd680897e6c98967673ddc78258c9ef) Thanks [@neiromaster](https://github.com/neiromaster)! - Extend social markup validation for OpenGraph, Twitter Cards, VK, Pinterest, and App Links, including cross-checks between OG, meta tags, canonical URLs, JSON-LD, and robots directives.

### Patch Changes

- Updated dependencies [[`b4b079d`](https://github.com/neiromaster/seo-solver/commit/b4b079d56423986fac00aae683c5be485c22751d)]:
  - @seo-solver/extract@0.1.0
  - @seo-solver/compare@0.1.0
  - @seo-solver/validate@0.1.0
  - @seo-solver/report@0.1.0
  - @seo-solver/fetch@0.0.1
  - @seo-solver/fetch-playwright@0.0.1
  - @seo-solver/types@0.1.0
