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

It does **not** set `types` — TypeScript auto-includes every reachable
`@types/*` package (Node included). This avoids forcing each consuming package to
declare a direct `@types/node` just to satisfy a `types: ["node"]` list.

MIT © Benoit Travers
