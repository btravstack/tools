// Smoke test for the published config packages: every shipped file must parse
// / load, and the `files` allow-list in each package.json must actually include
// the config it ships (a missing entry publishes an empty package). No external
// deps — this runs in CI before anything is built.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(new URL(p, `file://${root}`), "utf8");
const json = (p) => JSON.parse(read(p));

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL  ${name}: ${error.message}`);
  }
};

// Every package ships exactly the files it lists, and those files load.
const shipped = {
  tsconfig: ["app.json", "base.json", "test-d.json"],
  typedoc: ["base.json"],
  oxlint: ["base.json"],
  oxfmt: ["base.json"],
  commitlint: ["index.js"],
  lefthook: ["lefthook.yml"],
};

for (const [pkg, files] of Object.entries(shipped)) {
  const manifest = json(`packages/${pkg}/package.json`);
  check(`@btravstack/${pkg}: files allow-list covers shipped config`, () => {
    for (const f of files) {
      if (!manifest.files?.includes(f)) {
        throw new Error(`package.json "files" is missing "${f}"`);
      }
    }
  });
}

// Config-specific structural assertions.
check("tsconfig/base.json is strict", () => {
  const tsc = json("packages/tsconfig/base.json");
  if (tsc.compilerOptions?.strict !== true) throw new Error("strict must be true");
});

check("tsconfig/app.json extends base and emits no declarations", () => {
  const app = json("packages/tsconfig/app.json");
  if (app.extends !== "./base.json") throw new Error("app.json must extend ./base.json");
  // Both, because the preset promises both: `declarationMap: true` under
  // `declaration: false` emits nothing, so a regression there is silent — the
  // exact shape this file exists to catch.
  for (const flag of ["declaration", "declarationMap"]) {
    if (app.compilerOptions?.[flag] !== false) throw new Error(`${flag} must be false`);
  }
});

check("tsconfig/test-d.json relaxes the unused checks and carries no paths", () => {
  const testD = json("packages/tsconfig/test-d.json");
  // An assertion binding is never read, so both checks must be off — that is
  // the whole reason this file exists.
  for (const flag of ["noUnusedLocals", "noUnusedParameters"]) {
    if (testD.compilerOptions?.[flag] !== false) throw new Error(`${flag} must be false`);
  }
  // Measured, not assumed: TypeScript resolves a base config's `include` /
  // `exclude` / `files` relative to the BASE file's own directory, so an
  // `include` here would resolve inside node_modules and match nothing. Each
  // workspace keeps its own, and this preset must never grow one.
  for (const key of ["include", "exclude", "files", "extends"]) {
    if (key in testD) throw new Error(`test-d.json must not carry "${key}"`);
  }
});

check("typedoc/base.json loads the markdown plugin", () => {
  const td = json("packages/typedoc/base.json");
  if (!td.plugin?.includes("typedoc-plugin-markdown")) {
    throw new Error("plugin must include typedoc-plugin-markdown");
  }
});

check("oxlint/base.json defines rules", () => {
  const ox = json("packages/oxlint/base.json");
  if (!ox.rules || Object.keys(ox.rules).length === 0) throw new Error("no rules");
});

check("oxfmt/base.json parses", () => {
  json("packages/oxfmt/base.json");
});

const commitlint = await import(new URL("packages/commitlint/index.js", `file://${root}`));
check("commitlint config extends config-conventional", () => {
  if (!commitlint.default?.extends?.includes("@commitlint/config-conventional")) {
    throw new Error("must extend @commitlint/config-conventional");
  }
});

check("lefthook/lefthook.yml defines a pre-commit hook", () => {
  const yml = read("packages/lefthook/lefthook.yml");
  if (!/^pre-commit:/m.test(yml)) throw new Error("no pre-commit block");
});

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll config packages valid.");
