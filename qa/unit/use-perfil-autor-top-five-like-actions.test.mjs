import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-top-five-like-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a curtida do TOP 5 para o hook", () => {
  assert.match(pagina, /usePerfilAutorTopFiveLikeActions/);
  assert.match(
    pagina,
    /const \{ alternarCurtidaTopFivePerfil \} =\s*usePerfilAutorTopFiveLikeActions\(\{/,
  );
  assert.doesNotMatch(
    pagina,
    /async function alternarCurtidaTopFivePerfil\(/,
  );
});

test("hook preserva identidade e estado otimista da curtida", () => {
  assert.match(source, /execucaoCarregamentoPerfilAutorEstaAtual\(/);
  assert.match(source, /usuarioIdEsperado !== usuarioId/);
  assert.match(source, /setTopFiveCurtidaSalvando\(true\)/);
  assert.match(source, /setTopFiveCurtidoPorMim\(proximaCurtida\)/);
  assert.match(
    source,
    /Math\.max\(0, totalAtual \+ \(proximaCurtida \? 1 : -1\)\)/,
  );
  assert.match(
    source,
    /Entre para curtir o TOP 5 deste perfil\./,
  );
});

test("hook preserva persistência local, remota e recarga do estado", () => {
  assert.match(source, /salvarCurtidaTopFiveLocal\(/);
  assert.match(source, /salvarCurtidaTopFiveSupabase\(/);
  assert.match(source, /carregarCurtidasTopFivePerfil\(/);
  assert.match(source, /setTopFiveCurtidasTotal\(estadoAtualizado\.total\)/);
  assert.match(source, /setTopFiveCurtidoPorMim\(estadoAtualizado\.curtiu\)/);
  assert.match(source, /setTopFiveCurtidaSalvando\(false\)/);
});
