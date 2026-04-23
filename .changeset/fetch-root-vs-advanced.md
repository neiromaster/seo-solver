---
"@seo-solver/fetch": minor
---

Refactor the fetch package around a simpler root API and a more explicit advanced runtime surface. The root package now focuses on `fetchUrl()` and `createFetcher()`, while advanced runtime registration is explicit and the internal layout is split into `api`, `core`, and `advanced-runtime` modules.
