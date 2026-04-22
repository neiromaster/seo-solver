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
- Workflow filename: `release.yml`
- Environment: leave empty

Each package can have only one Trusted Publisher, so all packages point to the same workflow file.

Use the workflow filename only. npm expects `release.yml`, not the repository path `.github/workflows/release.yml`.

If a release run fails with `E404 Not Found - PUT https://registry.npmjs.org/<package>`, first check whether the package exists on npm and whether that exact package has the Trusted Publisher settings above. npm can report missing publish permission as a misleading 404. If the package already exists, fix the Trusted Publisher configuration and rerun the release workflow.

If the package itself does not exist yet, bootstrap it once with an npm account or temporary token that has publish rights, for example:

```bash
pnpm --filter <package> build
pnpm --filter <package> publish --access public --no-git-checks
```

Then add the Trusted Publisher settings above for that package and rerun the release workflow. Do not add `NPM_TOKEN` to `.github/workflows/release.yml` for normal releases.

The release workflow upgrades npm in two steps before publishing: first to `npm@10.9.8`, then to `npm@^11.5.1`. The intermediate npm 10 release avoids a known Node 22 toolcache self-upgrade failure, while npm 11.5.1 or newer provides the Trusted Publishing OIDC support required by npm. If the intermediate step is removed, GitHub Actions may fail during `npm install -g npm@^11.5.1` with `MODULE_NOT_FOUND: promise-retry`.

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
