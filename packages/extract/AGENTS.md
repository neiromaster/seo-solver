# AGENTS.md

Package rules for `packages/extract`.

Read with:
- `../../AGENTS.md`
- `../../docs/architecture/monorepo-conventions.md`

If they conflict, prefer the stricter boundary-preserving rule and the more specific package-local rule.

## Scope

- This file defines package-local rules for `@seo-solver/extract`.
- Keep extractor-specific constraints under their own subsection.

## API boundaries

- Keep `@seo-solver/extract` and `@seo-solver/extract/advanced` cleanly separated.
- The root entrypoint must not import from, re-export from, or otherwise depend on advanced-only modules, even indirectly.
- Do not move low-level extractor classes onto the root export surface.
- Keep the root entrypoint tree-shakable for consumers that do not use advanced APIs.

## Extractor rules

- Keep extractor logic package-local.
- Follow the existing extractor shape: `type`, `accepts`, and `extract(input)` with a `resourceType` guard.
- HTML extractors should use shared document parsing and shared extractor helpers.
- Return `null` when there is no relevant data for a valid input.
- Do not introduce cross-extractor side effects.

## Testing

- Keep extractor tests close to the implementation they specify.
- Use shared package fixtures instead of duplicating HTML or text samples.
- Do not merge public-behavior changes without the relevant fixture coverage and expected assertions in the same PR.
- Do not rewrite unrelated fixtures to make another extractor green.

## Extractor-specific rules

### Headings

- Do not implement the HTML5 outline algorithm or sectioning-element nesting heuristics for heading levels.
- Heading level comes only from the tag itself or `aria-level`.
