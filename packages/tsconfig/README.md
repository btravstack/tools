# @btravstack/tsconfig

Shared strict TypeScript configuration for btravstack packages.

```sh
pnpm add -D @btravstack/tsconfig
```

```jsonc
// tsconfig.json
{
  "extends": "@btravstack/tsconfig/base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"],
}
```

`base.json` enables `strict`, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`,
`noImplicitOverride`, `noImplicitReturns`, `verbatimModuleSyntax`,
`moduleDetection: "force"`, and friends, on `NodeNext` / `ES2022`. Override
anything in your own `compilerOptions`.

## `app.json`, for a package that emits no declarations

An application — a deployment, an example, a test workspace — extends
`app.json` instead, which is `base.json` with `declaration` and
`declarationMap` off:

```jsonc
// tsconfig.json
{
  "extends": "@btravstack/tsconfig/app.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src/**/*"],
}
```

The flag is not free when nothing consumes the declarations it type-checks:
declaration emit is checked even under `noEmit`, so an exported value whose
type reaches a library's unexported brand symbols reports `TS4023` — **before**
the error the developer actually made. Measured on a DI composition root with
one unmet dependency: two `TS4023` lines about internal `ID` / `SERVICE`
symbols came first, and the sentence naming the missing port came third. With
`app.json` the actionable diagnostic is the only one.

A library keeps `base.json`: there the declaration check is the guarantee that
its consumers can build.

## `test-d.json`, for a type-level test project

Type-level tests assert with bindings nothing reads — `type _x = Expect<Equal<A, B>>`
— so `noUnusedLocals` and `noUnusedParameters` have to be off for that project
and on everywhere else. `test-d.json` is those two flags and nothing else,
composed with the workspace's own config through an `extends` array:

```json
{
  "extends": ["./tsconfig.json", "@btravstack/tsconfig/test-d.json"],
  "include": ["src/**/*.test-d.ts"]
}
```

Order matters: the preset comes **last**, so its relaxations win over the
strict config it is layered on.

It carries no `include`, and cannot. TypeScript resolves a base config's
`include` / `exclude` / `files` relative to **the base file's own directory**
(measured: an `include` of `src/**/*.test-d.ts` in a base one directory up
resolves to `../base/src/**/*.test-d.ts` and reports `TS18003`), so a shipped
preset's globs would point inside `node_modules`. Each workspace states its
own — which is also where the answer belongs, since a workspace that keeps its
type tests somewhere else needs a different glob, not a different preset.

It does **not** set `types` — TypeScript auto-includes every reachable
`@types/*` package (Node included). This avoids forcing each consuming package to
declare a direct `@types/node` just to satisfy a `types: ["node"]` list.

MIT © Benoit Travers
