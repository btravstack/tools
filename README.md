# @btravstack/tools

Shared configuration packages for [btravstack](https://github.com/btravstack)
repositories. Each repo used to hand-copy a near-identical `tools/tsconfig`,
`tools/typedoc`, oxlint, oxfmt, commitlint, and lefthook setup; this monorepo
publishes them once, under the same `@btravstack` npm scope as
[`@btravstack/theme`](https://www.npmjs.com/package/@btravstack/theme).

Every package is consumed via **native config inheritance** (`extends`), not a
build step — they ship static config files, so there is nothing to compile.

## Packages

| Package                                         | What it shares                                                                                                                                   | Inheritance                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| [`@btravstack/tsconfig`](packages/tsconfig)     | Strict TS base (`strict` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` + `noPropertyAccessFromIndexSignature` …, NodeNext, ES2022) | `tsconfig.json` `extends`                  |
| [`@btravstack/typedoc`](packages/typedoc)       | TypeDoc markdown base (markdown plugin, table formats)                                                                                           | `typedoc.json` `extends`                   |
| [`@btravstack/oxlint`](packages/oxlint)         | oxlint rules (`no-explicit-any`, type-only definitions)                                                                                          | `.oxlintrc.json` `extends`                 |
| [`@btravstack/oxfmt`](packages/oxfmt)           | oxfmt settings                                                                                                                                   | **copy-template** — oxfmt has no `extends` |
| [`@btravstack/commitlint`](packages/commitlint) | Conventional-commits preset                                                                                                                      | `commitlint.config.js` `extends`           |
| [`@btravstack/lefthook`](packages/lefthook)     | pre-commit / commit-msg hooks                                                                                                                    | `lefthook.yml` `extends`                   |

## Consuming from a btravstack repo

Install the packages you need (they belong in `devDependencies`), then wire each
one up:

**tsconfig** — in a package's `tsconfig.json`:

```jsonc
{ "extends": "@btravstack/tsconfig/base.json" }
```

**typedoc** — in `typedoc.json` (bring your own `typedoc-plugin-markdown`):

```jsonc
{ "extends": "@btravstack/typedoc/base.json", "entryPoints": ["src/index.ts"] }
```

**oxlint** — oxlint resolves `extends` by **file path**, so point at the file in
`node_modules` (the same style already used for `$schema`):

```jsonc
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/@btravstack/oxlint/base.json"],
}
```

**oxfmt** — oxfmt has **no `extends`**; copy `@btravstack/oxfmt/base.json` into
your `.oxfmtrc.json` and add repo-specific `ignorePatterns`.

**commitlint** — in `commitlint.config.js`:

```js
export default { extends: ["@btravstack/commitlint"] };
```

**lefthook** — in `lefthook.yml`:

```yaml
extends:
  - node_modules/@btravstack/lefthook/lefthook.yml
```

> First-party packages skip the supply-chain maturity delay: add
> `@btravstack/*` to `minimumReleaseAgeExclude` in the consumer's
> `pnpm-workspace.yaml`, next to `@btravstack/theme`.

## Development

```sh
pnpm install
pnpm test    # validate every shipped config parses/loads
pnpm lint
pnpm format
```

Releases flow through [changesets](https://github.com/changesets/changesets) and
npm **Trusted Publishing** (OIDC — no `NPM_TOKEN`). Add a changeset with
`pnpm changeset`; merging the generated "release packages" PR publishes.

## Reusable GitHub workflows

Two reusable workflows live under [`.github/workflows`](.github/workflows) so
consumer repos stop hand-copying CI/release YAML:

- **`ci-reusable.yml`** — one job that runs the whole gate after a single install
  (format → lint → typecheck → knip → test → build → audit → optional changeset
  check). Inputs: `knip`, `changeset`, `security-audit`, `test-command`,
  `node-version-file`.
- **`release-reusable.yml`** — changesets + npm Trusted Publishing. Takes a
  `RELEASE_PAT` secret.

Consume them from thin caller workflows:

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  ci:
    uses: btravstack/tools/.github/workflows/ci-reusable.yml@main
    with:
      changeset: true # contract repos that enforce changesets
```

```yaml
# .github/workflows/release.yml
name: Release
on:
  workflow_run: { workflows: ["CI"], types: [completed], branches: [main] }
jobs:
  release:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    uses: btravstack/tools/.github/workflows/release-reusable.yml@main
    secrets:
      RELEASE_PAT: ${{ secrets.RELEASE_PAT }}
```

Repo-specific jobs (bundle-size, integration tests, docs deploy) stay in the
caller's own workflow file alongside the `uses:` call.

## License

MIT © Benoit Travers
