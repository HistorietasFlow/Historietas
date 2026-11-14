import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const runner = readFileSync(
  new URL("../scripts/run-node-test-script.mjs", import.meta.url),
  "utf8",
);
const playwrightLocalRunner = readFileSync(
  new URL("../scripts/run-playwright-local.mjs", import.meta.url),
  "utf8",
);
const playwrightConfig = readFileSync(
  new URL("../playwright.config.mjs", import.meta.url),
  "utf8",
);
const prepareE2eLocal = readFileSync(
  new URL("../scripts/prepare-e2e-local.mjs", import.meta.url),
  "utf8",
);
const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);

test("runner preserva a lista da sessão sem delegar ao shell do Windows", () => {
  const arquivos = packageJson.scripts["test:session:files"]
    .split(/\s+/)
    .filter(Boolean);

  assert.ok(arquivos.length > 200);
  assert.equal(new Set(arquivos).size, arquivos.length);
  arquivos.forEach((arquivo) => {
    assert.match(arquivo, /^qa\/unit\/[a-z0-9-]+\.test\.mjs$/);
  });
  assert.match(runner, /spawnSync\(/);
  assert.match(runner, /shell: false/);
  assert.match(runner, /stdio: "inherit"/);
  assert.doesNotMatch(packageJson.scripts["test:session"], /qa\/unit\//);
});

test("Supabase CLI usa cmd.exe no Windows e execução direta no Linux", () => {
  assert.deepEqual(
    criarInvocacaoStatusSupabase({
      plataforma: "win32",
      comSpec: "C:\\Windows\\System32\\cmd.exe",
    }),
    {
      comando: "C:\\Windows\\System32\\cmd.exe",
      argumentos: ["/d", "/s", "/c", "supabase status -o env"],
    },
  );
  assert.deepEqual(criarInvocacaoStatusSupabase({ plataforma: "linux" }), {
    comando: "supabase",
    argumentos: ["status", "-o", "env"],
  });
});

test("runner local do Playwright gerencia o Next sem shell ou retries implícitos", () => {
  assert.match(playwrightLocalRunner, /shell: false/);
  assert.match(playwrightLocalRunner, /E2E_SERVER_EXTERNALLY_MANAGED: "true"/);
  assert.match(playwrightLocalRunner, /await encerrar\(servidor\)/);
  assert.match(playwrightLocalRunner, /taskkill\.exe/);
  assert.match(playwrightLocalRunner, /\["\/pid", String\(processo\.pid\), "\/t", "\/f"\]/);
  assert.match(playwrightLocalRunner, /await aguardarSaida\(processo\)/);
  assert.match(playwrightLocalRunner, /process\.argv\.slice\(2\)/);
  assert.match(playwrightConfig, /path\.join\(ROOT_DIR, "node_modules", "next", "dist", "bin", "next"\)/);
  assert.doesNotMatch(playwrightConfig, /npm --prefix \.\. run dev/);
  assert.match(playwrightConfig, /process\.platform === "win32"/);
  assert.match(playwrightConfig, /run-playwright-local\.mjs/);
  assert.doesNotMatch(prepareE2eLocal, /E2E_WEB_SERVER_COMMAND/);
});
