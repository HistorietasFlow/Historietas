import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-data-loader.ts",
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
test("hook preserva a orquestração local, remota e persistência", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /return useCallback\(async \(\) => \{/);
  assert.match(
    hook,
    /const dadosLocaisSeguindo = carregarDadosLocaisSeguindo\(usuarioLogadoId\);/,
  );
  assert.match(
    hook,
    /await carregarDadosRemotosSeguindo\(\{[\s\S]*?perfilSocialId,[\s\S]*?usuarioLogadoId/,
  );
  assert.match(
    hook,
    /await prepararDadosRemotosSeguindo\(\{[\s\S]*?dadosSupabase,[\s\S]*?usuariosSeguidosSupabase,[\s\S]*?usuarioLogadoId/,
  );
  assert.match(
    hook,
    /salvarDadosLocaisSeguindo\(\{[\s\S]*?userId: usuarioLogadoId/,
  );
  assert.match(hook, /setUsuariosSeguidos\(usuariosSeguidosSupabase\);/);
  assert.match(hook, /setUsuariosSeguidores\(usuariosSeguidoresSupabase\);/);
  assert.match(hook, /setAtividadesSeguindo\(atividadesSeguindoSupabase\);/);
  assert.match(hook, /setCarregando\(false\);/);
});

test("a página delega o carregamento principal à fronteira de dados", () => {
  assert.match(
    carregamentoPagina,
    /^"use client";/,
  );
  assert.match(
    carregamentoPagina,
    /import \{ useSeguindoDataLoader \} from "\.\/use-seguindo-data-loader";/,
  );
  assert.match(
    carregamentoPagina,
    /const carregarDadosSeguindo = useSeguindoDataLoader\(parametros\);/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageDataLoading \} from "\.\/hooks\/use-seguindo-page-data-loading";/,
  );
  assert.match(
    pagina,
    /useSeguindoPageDataLoading\(\{[\s\S]*?perfilSocialId,[\s\S]*?usuarioLogadoId,[\s\S]*?setObras,[\s\S]*?setCarregando,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /carregarDadosLocaisSeguindo/);
  assert.doesNotMatch(pagina, /carregarDadosRemotosSeguindo/);
  assert.doesNotMatch(pagina, /prepararDadosRemotosSeguindo/);
  assert.doesNotMatch(pagina, /salvarDadosLocaisSeguindo/);
  assert.match(
    pagina,
    /import \{ useSeguindoWorkFollowState \} from "\.\/hooks\/use-seguindo-work-follow-state";/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageLoadState \} from "\.\/hooks\/use-seguindo-page-load-state";/,
  );
});

