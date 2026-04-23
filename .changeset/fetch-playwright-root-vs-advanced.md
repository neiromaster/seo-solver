---
"@seo-solver/fetch-playwright": minor
---

Refactor the Playwright fetch package around clearer root and internal boundaries. The package now aligns its public story around simple fetch helpers while keeping retry/runtime mechanics and structural layout easier to reason about alongside the refactored core fetch package.
