---
"@btravstack/tsconfig": minor
---

`app.json`: `base.json` with `declaration` and `declarationMap` off, for a
workspace that emits no declarations.

Declaration emit is type-checked even under `noEmit`, so `declaration: true`
costs an application the errors it buys a library. Measured on a DI composition
root with one unmet dependency: two `TS4023` lines about a library's internal
`ID` / `SERVICE` brand symbols printed **first**, and the sentence naming the
missing port printed third. An application that ships no `.d.ts` has nothing to
gain from that check and pays for it on every mistake, internals-first.

A library keeps `base.json`, where the check is the guarantee that its consumers
can build.
