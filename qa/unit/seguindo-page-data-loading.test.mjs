import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-data-loading.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);

test("a fronteira de carregamento preserva a composição do loader e gatilho", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /import \{ useSeguindoDataLoader \} from "\.\/use-seguindo-data-loader";/,
  );
  assert.match(
    hook,
    /import \{ useSeguindoDataLoadTrigger \} from "\.\/use-seguindo-data-load-trigger";/,
  );
  assert.match(
    hook,
    /const carregarDadosSeguindo = useSeguindoDataLoader\(parametros\);/,
  );
  assert.match(
    hook,
    /useSeguindoDataLoadTrigger\(\{\s*usuarioLogadoId: parametros\.usuarioLogadoId,\s*carregarDadosSeguindo,\s*\}\);/,
  );
  assert.doesNotMatch(hook, /supabase|localStorage|useEffect|useState/);
});

test("a página delega a orquestração de carregamento sem alterar seus estados", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoPageDataLoading \} from "\.\/hooks\/use-seguindo-page-data-loading";/,
  );
  assert.match(
    pagina,
    /useSeguindoPageDataLoading\(\{[\s\S]*?perfilSocialId,[\s\S]*?usuarioLogadoId,[\s\S]*?setObras,[\s\S]*?setObrasConcluidas,[\s\S]*?setCarregando,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /const carregarDadosSeguindo =/);
  assert.doesNotMatch(pagina, /useSeguindoDataLoadTrigger/);
});
