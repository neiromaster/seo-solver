# npm Trusted Publishing release setup

`seo-solver` publishes packages through a single GitHub Actions workflow, `.github/workflows/release.yml`, using Changesets and npm Trusted Publishing. The workflow intentionally does not use `NPM_TOKEN`; npm authentication comes from GitHub Actions OIDC with `id-token: write` and provenance enabled.

## Release flow

1. A feature PR includes a Changeset when it changes public package behavior.
2. CI runs `pnpm run consistency:check`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`.
3. After merge to `main`, `.github/workflows/release.yml` opens or updates the Changesets version PR.
4. After the version PR is merged, the same workflow publishes changed packages with `pnpm run release`.
5. npm records provenance attestations for the published packages.

## Publishable packages

Configure npm Trusted Publishing for each package below after its first manual publication exists on npm:

| Package | Workspace path |
| --- | --- |
| `seo-solver` | `apps/seo-solver` |
| `@seo-solver/fetch` | `packages/fetch` |
| `@seo-solver/fetch-playwright` | `packages/fetch-playwright` |
| `@seo-solver/extract` | `packages/extract` |
| `@seo-solver/compare` | `packages/compare` |
| `@seo-solver/validate` | `packages/validate` |
| `@seo-solver/report` | `packages/report` |
| `@seo-solver/types` | `packages/types` |

`@seo-solver/typescript-config` is private and is not published.

## One-time npm setup

Trusted Publishing requires the npm package to already exist. The first publication for each package is done manually; after that, configure each package in npm:

- Provider: GitHub Actions
- Organization: `neiromaster`
- Repository: `seo-solver`
- Workflow filename: `.github/workflows/release.yml`
- Environment: leave empty

Each package can have only one Trusted Publisher, so all packages point to the same workflow file.

## Package metadata requirements

Every public package must keep:

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/neiromaster/seo-solver.git"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

The repository URL must match GitHub exactly for npm provenance validation. Keep the `git+https://` prefix, the `.git` suffix, and no trailing slash.

## Verification commands

Before merging release workflow changes:

```bash
pnpm install --frozen-lockfile
pnpm run consistency:check
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

After the first OIDC-backed publish, verify provenance for each published package:

```bash
npm view <package>@<version> --json | jq '.attestations'
```

The expected attestation predicate type is `https://slsa.dev/provenance/v1`.

## Token policy

Do not add `NPM_TOKEN` to the workflow. After all packages publish successfully through OIDC, revoke old npm automation tokens and enable npm's token-disallowing package setting where available.
