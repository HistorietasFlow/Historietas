import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-data-load-trigger.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const carregamentoPagina = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-data-loading.ts",
    import.meta.url,
  ),
  "utf8",
);

test("hook preserva guarda, timer e cleanup do carregamento", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /if \(!usuarioLogadoId\) \{\s*return;\s*\}/,
  );
  assert.match(
    hook,
    /const carregarDadosTimer = window\.setTimeout\(\(\) => \{\s*void carregarDadosSeguindo\(\);\s*\}, 0\);/,
  );
  assert.match(
    hook,
    /return \(\) => \{\s*window\.clearTimeout\(carregarDadosTimer\);\s*\};/,
  );
  assert.match(
    hook,
    /\}, \[carregarDadosSeguindo, usuarioLogadoId\]\);/,
  );
});

test("a fronteira de dados delega o gatilho de carregamento ao hook", () => {
  assert.match(
    carregamentoPagina,
    /import \{ useSeguindoDataLoadTrigger \} from "\.\/use-seguindo-data-load-trigger";/,
  );
  assert.match(
    carregamentoPagina,
    /useSeguindoDataLoadTrigger\(\{\s*usuarioLogadoId: parametros\.usuarioLogadoId,\s*carregarDadosSeguindo,\s*\}\);/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageDataLoading \} from "\.\/hooks\/use-seguindo-page-data-loading";/,
  );
  assert.doesNotMatch(
    pagina,
    /useSeguindoDataLoadTrigger/,
  );
  assert.doesNotMatch(
    pagina,
    /const carregarDadosTimer = window\.setTimeout/,
  );
});
