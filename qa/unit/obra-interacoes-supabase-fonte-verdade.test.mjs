import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import "./use-obra-work-metrics-lifecycle-behavior.test.mjs";

const lifecycleMetricas = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-work-metrics-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);

function obterBlocoMetricasReais() {
  const inicio = lifecycleMetricas.indexOf(
    "async function carregarMetricasReaisObra()",
  );
  const fim = lifecycleMetricas.indexOf(
    "void carregarMetricasReaisObra();",
    inicio,
  );

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return lifecycleMetricas.slice(inicio, fim);
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
  const indiceGuardCurtidas = bloco.indexOf("if (!curtidaAlterada)");
  const indiceCacheCurtidas = bloco.indexOf(
    "salvarStorageUsuarioObraPublica(",
    indiceGuardCurtidas,
  );
  const indiceGuardSeguidas = bloco.indexOf("if (!seguimentoAlterado)");
  const indiceCacheSeguidas = bloco.indexOf(
    "salvarStorageUsuarioObraPublica(",
    indiceGuardSeguidas,
  );
  const indiceGuardFavoritos = bloco.indexOf("if (!favoritoAlterado)");
  const indiceCacheFavoritos = bloco.indexOf(
    "salvarListaLocalObraPublica(",
    indiceGuardFavoritos,
  );
  const indiceGuardConcluidas = bloco.indexOf("if (!conclusaoAlterada)");
  const indiceCacheConcluidas = bloco.indexOf(
    "salvarListaLocalObraPublica(",
    indiceGuardConcluidas,
  );
  const indiceEstado = bloco.indexOf("setObraSeguida(seguindoAtivo);");

  assert.ok(indiceGuard >= 0);
  assert.ok(indiceGuardCurtidas > indiceGuard);
  assert.ok(indiceCacheCurtidas > indiceGuardCurtidas);
  assert.ok(indiceGuardSeguidas > indiceCacheCurtidas);
  assert.ok(indiceCacheSeguidas > indiceGuardSeguidas);
  assert.ok(indiceGuardFavoritos > indiceCacheSeguidas);
  assert.ok(indiceCacheFavoritos > indiceGuardFavoritos);
  assert.ok(indiceGuardConcluidas > indiceCacheFavoritos);
  assert.ok(indiceCacheConcluidas > indiceGuardConcluidas);
  assert.ok(indiceEstado > indiceCacheConcluidas);
});

test("fallback local continua aplicado antes da leitura remota", () => {
  const inicioEfeito = lifecycleMetricas.indexOf("const metricasBase = criarMetricasBaseObra");
  const inicioRemoto = lifecycleMetricas.indexOf(
    "async function carregarMetricasReaisObra()",
    inicioEfeito,
  );
  const blocoFallback = lifecycleMetricas.slice(inicioEfeito, inicioRemoto);

  assert.match(blocoFallback, /curtidaAtiva: curtidaLocalAtiva/);
  assert.match(blocoFallback, /setObraSeguida\(seguindoLocalAtivo\)/);
});
