# @btravstack/tsconfig

## 0.4.0

### Minor Changes

- 7dc497d: `test-d.json`: the preset for a type-level test project.

  Type-level tests assert with bindings nothing reads — `type _x = Expect<Equal<A, B>>`
  — so `noUnusedLocals` and `noUnusedParameters` must be off for that project and
  on everywhere else. Every workspace with a `tsconfig.test-d.json` was writing
  those two flags out by hand, along with the reason, or more often without it.

  ```json
  {
    "extends": ["./tsconfig.json", "@btravstack/tsconfig/test-d.json"],
    "include": ["src/**/*.test-d.ts"]
  }
  ```

  The preset comes **last** in the array so its relaxations win over the strict
  config beneath.

  It carries no `include`, and cannot: TypeScript resolves a base config's
  `include` / `exclude` / `files` relative to the **base file's** own directory,
  so a shipped glob would point inside `node_modules` and match nothing. Measured
  — an `include` of `src/**/*.test-d.ts` in a base one directory up resolves to
  `../base/src/**/*.test-d.ts` and reports `TS18003`. `scripts/validate.mjs` holds the shape as an
  **allow-list** — `$schema` plus exactly those two `compilerOptions` — rather
  than forbidding the four keys a reader would reach for. The preset is layered
  last in a consumer's `extends` array, so anything it grows silently overrides
  the workspace's own config, and only naming what may appear catches a key
  nobody thought to forbid.

## 0.3.0

### Minor Changes

- d2cd3a9: `app.json`: `base.json` with `declaration` and `declarationMap` off, for a
  workspace that emits no declarations.

  Declaration emit is type-checked even under `noEmit`, so `declaration: true`
  costs an application the errors it buys a library. Measured on a DI composition
  root with one unmet dependency: two `TS4023` lines about a library's internal
  `ID` / `SERVICE` brand symbols printed **first**, and the sentence naming the
  missing port printed third. An application that ships no `.d.ts` has nothing to
  gain from that check and pays for it on every mistake, internals-first.

  A library keeps `base.json`, where the check is the guarantee that its consumers
  can build.
