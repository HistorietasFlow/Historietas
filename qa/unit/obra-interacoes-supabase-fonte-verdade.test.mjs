import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

function obterBlocoMetricasReais() {
  const inicio = paginaObra.indexOf(
    "async function carregarMetricasReaisObra()",
  );
  const fim = paginaObra.indexOf(
    "void carregarMetricasReaisObra();",
    inicio,
  );

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return paginaObra.slice(inicio, fim);
}

test("Supabase prevalece sobre cache local nas interacoes da obra", () => {
  const bloco = obterBlocoMetricasReais();

  assert.match(bloco, /const curtidaAtiva = metrica\.usuario\.curtiu;/);
  assert.match(bloco, /const seguindoAtivo = metrica\.usuario\.seguiu;/);
  assert.match(
    bloco,
    /const favoritadaAtiva = metrica\.usuario\.favoritou;/,
  );
  assert.match(
    bloco,
    /const concluidaAtiva = metrica\.usuario\.concluiu;/,
  );

  assert.doesNotMatch(bloco, /metrica\.usuario\.curtiu \|\| curtidaLocalAtiva/);
  assert.doesNotMatch(bloco, /metrica\.usuario\.seguiu \|\| seguindoLocalAtivo/);
  assert.doesNotMatch(
    bloco,
    /metrica\.usuario\.favoritou \|\| favoritadaLocalAtiva/,
  );
  assert.doesNotMatch(
    bloco,
    /metrica\.usuario\.concluiu \|\| concluidaLocalAtiva/,
  );
});

test("cache local e sincronizado somente depois do guard da execucao atual", () => {
  const bloco = obterBlocoMetricasReais();
  const indiceGuard = bloco.indexOf("if (cancelado)");
  const indiceCacheCurtidas = bloco.indexOf(
    "salvarStorageUsuarioObraPublica(\n            LIKED_WORKS_STORAGE_KEY",
  );
  const indiceCacheSeguidas = bloco.indexOf(
    "salvarStorageUsuarioObraPublica(\n            FOLLOWED_WORKS_STORAGE_KEY",
  );
  const indiceCacheFavoritos = bloco.indexOf(
    "salvarListaLocalObraPublica(\n            obraAtual,\n            FAVORITES_STORAGE_KEY",
  );
  const indiceCacheConcluidas = bloco.indexOf(
    "salvarListaLocalObraPublica(\n            obraAtual,\n            COMPLETED_STORAGE_KEY",
  );
  const indiceEstado = bloco.indexOf("setObraSeguida(seguindoAtivo);");

  assert.ok(indiceGuard >= 0);
  assert.ok(indiceCacheCurtidas > indiceGuard);
  assert.ok(indiceCacheSeguidas > indiceGuard);
  assert.ok(indiceCacheFavoritos > indiceGuard);
  assert.ok(indiceCacheConcluidas > indiceGuard);
  assert.ok(indiceEstado > indiceCacheConcluidas);
});

test("fallback local continua aplicado antes da leitura remota", () => {
  const inicioEfeito = paginaObra.indexOf("const metricasBase = criarMetricasBaseObra");
  const inicioRemoto = paginaObra.indexOf(
    "async function carregarMetricasReaisObra()",
    inicioEfeito,
  );
  const blocoFallback = paginaObra.slice(inicioEfeito, inicioRemoto);

  assert.match(blocoFallback, /curtidaAtiva: curtidaLocalAtiva/);
  assert.match(blocoFallback, /setObraSeguida\(seguindoLocalAtivo\)/);
});
