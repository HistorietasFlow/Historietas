import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const interacoesObra = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-work-interactions.ts",
    import.meta.url,
  ),
  "utf8",
);

function obterBloco(inicioTexto, fimTexto) {
  const inicio = interacoesObra.indexOf(inicioTexto);
  const fim = interacoesObra.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0, inicioTexto);
  assert.ok(fim > inicio, fimTexto);

  return interacoesObra.slice(inicio, fim);
}

test("pagina delega as interacoes da obra ao hook dedicado", () => {
  assert.match(
    paginaObra,
    /import \{ useObraWorkInteractions \} from "\.\/hooks\/use-obra-work-interactions"/,
  );
  assert.match(paginaObra, /\} = useObraWorkInteractions\(\{/);
  assert.match(paginaObra, /followedWorksStorageKey: FOLLOWED_WORKS_STORAGE_KEY/);
  assert.match(paginaObra, /likedWorksStorageKey: LIKED_WORKS_STORAGE_KEY/);
  assert.match(paginaObra, /favoritesStorageKey: FAVORITES_STORAGE_KEY/);
  assert.match(paginaObra, /completedStorageKey: COMPLETED_STORAGE_KEY/);

  for (const handler of [
    "alternarSeguirObra",
    "alternarCurtidaObra",
    "alternarFavoritoObra",
    "alternarConcluirObra",
  ]) {
    assert.doesNotMatch(
      paginaObra,
      new RegExp(`async function ${handler}\\(`),
    );
  }
});

test("hook preserva persistencia, Diario, atualizacao otimista e rollback", () => {
  for (const trecho of [
    "lerStorageUsuarioObraPublica",
    "salvarStorageUsuarioObraPublica",
    "salvarListaLocalObraPublica",
    "inserirSeguimentoObraPublicaSupabase",
    "removerSeguimentoObraPublicaSupabase",
    "salvarCurtidaObraPublicaSupabase",
    "salvarRegistroObraPublicaSupabase",
    "registrarAtividadeDiarioObra",
    "removerAtividadeDiarioObra",
    "setObraSeguida(seguindo)",
    "setObraFavoritada(proximoFavorito)",
    "setObraConcluida(proximaConcluida)",
    "setObraFavoritada(favoritoAnterior)",
    "setObraConcluida(concluidaAnterior)",
  ]) {
    assert.ok(interacoesObra.includes(trecho), trecho);
  }
});

test("todas as interacoes preservam guard de identidade nos limites assincronos", () => {
  const handlers = [
    obterBloco("async function alternarSeguirObra()", "async function alternarCurtidaObra()"),
    obterBloco("async function alternarCurtidaObra()", "async function alternarFavoritoObra()"),
    obterBloco("async function alternarFavoritoObra()", "async function alternarConcluirObra()"),
    obterBloco("async function alternarConcluirObra()", "return {"),
  ];

  for (const handler of handlers) {
    assert.match(handler, /await obterIdentidadeLogadaParaAcao/);
    assert.match(handler, /criarGuardIdentidadeAcao\(identidadeAcao\)/);
    assert.match(handler, /execucaoAcaoEstaAtual/);
  }

  const seguir = handlers[0];
  const indiceSupabase = seguir.indexOf("await inserirSeguimentoObraPublicaSupabase");
  const indiceGuardDepois = seguir.indexOf(
    "if (!execucaoAcaoEstaAtual())",
    indiceSupabase,
  );
  const indiceDiario = seguir.indexOf("await registrarAtividadeDiarioObra");

  assert.ok(indiceSupabase >= 0);
  assert.ok(indiceGuardDepois > indiceSupabase);
  assert.ok(indiceDiario > indiceGuardDepois);
});

test("hook nao absorve comentarios, avaliacao, carregamento, compartilhamento ou UI", () => {
  for (const trecho of [
    "enviarComentarioObra",
    "removerComentarioObra",
    "alternarCurtidaComentarioObra",
    "avaliarObra",
    "carregarMetricas",
    "compartilharObra",
  ]) {
    assert.ok(!interacoesObra.includes(trecho), trecho);
  }
});
