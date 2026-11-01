import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const lifecycleMetricas = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-work-metrics-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);

test("cliente delega o lifecycle de metricas ao hook", () => {
  assert.match(
    paginaObra,
    /import \{ useObraWorkMetricsLifecycle \} from "\.\/hooks\/use-obra-work-metrics-lifecycle";/,
  );
  assert.match(
    paginaObra,
    /useObraWorkMetricsLifecycle\(\{[\s\S]*?obra,[\s\S]*?obraNormalizada,[\s\S]*?usuarioIdLogado,[\s\S]*?followedWorksStorageKey: FOLLOWED_WORKS_STORAGE_KEY,[\s\S]*?likedWorksStorageKey: LIKED_WORKS_STORAGE_KEY,[\s\S]*?favoritesStorageKey: FAVORITES_STORAGE_KEY,[\s\S]*?completedStorageKey: COMPLETED_STORAGE_KEY,[\s\S]*?setObraSeguida,[\s\S]*?setObraFavoritada,[\s\S]*?setObraConcluida,[\s\S]*?setMetricasObra,[\s\S]*?setMetricasComunidadeObra,[\s\S]*?setTotalComentariosObra,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(paginaObra, /async function carregarMetricasReaisObra\(/);
  assert.doesNotMatch(paginaObra, /carregarMetricasConteudos/);
});

test("hook preserva fallback local, snapshot remoto e total de comentarios", () => {
  for (const trecho of [
    "export function useObraWorkMetricsLifecycle",
    "const metricasBase = criarMetricasBaseObra(obraAtual);",
    "const curtidasTexto = lerStorageUsuarioObraPublica(",
    "const seguidasTexto = lerStorageUsuarioObraPublica(",
    "const aplicarMetricasLocaisTimer = window.setTimeout(",
    "setTotalComentariosObra(metricasBase.comentarios);",
    "async function carregarMetricasReaisObra()",
    "await carregarMetricasConteudos({",
    "obraIds: [obraId]",
    "setTotalComentariosObra(metrica.interacoesDiretas.comentarios);",
    "setMetricasComunidadeObra({",
  ]) {
    assert.ok(lifecycleMetricas.includes(trecho), trecho);
  }
});

test("hook sincroniza as interacoes remotas somente antes de uma execucao atual", () => {
  const inicio = lifecycleMetricas.indexOf("async function carregarMetricasReaisObra()");
  const fim = lifecycleMetricas.indexOf("void carregarMetricasReaisObra();", inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  const carregamento = lifecycleMetricas.slice(inicio, fim);
  const indiceGuard = carregamento.indexOf("if (cancelado)");
  const indiceStorage = carregamento.indexOf("salvarStorageUsuarioObraPublica(");
  const indiceEstados = carregamento.indexOf("setObraSeguida(seguindoAtivo);");

  assert.ok(indiceGuard >= 0);
  assert.ok(indiceStorage > indiceGuard);
  assert.ok(indiceEstados > indiceStorage);

  for (const trecho of [
    "metrica.usuario.curtiu",
    "metrica.usuario.seguiu",
    "metrica.usuario.favoritou",
    "metrica.usuario.concluiu",
    "salvarListaLocalObraPublica(",
  ]) {
    assert.ok(carregamento.includes(trecho), trecho);
  }
});

test("hook preserva cancelamento e permanece limitado ao lifecycle de metricas", () => {
  assert.match(
    lifecycleMetricas,
    /return \(\) => \{\s*cancelado = true;\s*window\.clearTimeout\(aplicarMetricasLocaisTimer\);\s*\};/,
  );

  for (const trecho of [
    "alternarSeguirObra",
    "alternarCurtidaObra",
    "alternarFavoritoObra",
    "alternarConcluirObra",
    "avaliarObra",
    "compartilharObra",
    "<Obra",
  ]) {
    assert.doesNotMatch(lifecycleMetricas, new RegExp(trecho, "i"));
  }
});
