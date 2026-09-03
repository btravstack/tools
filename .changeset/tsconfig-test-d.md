---
"@btravstack/tsconfig": minor
---

`test-d.json`: the preset for a type-level test project.

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
`../base/src/**/*.test-d.ts` and reports `TS18003`. `scripts/validate.mjs` now
refuses a `test-d.json` that grows one, so the limit is held rather than
remembered.
