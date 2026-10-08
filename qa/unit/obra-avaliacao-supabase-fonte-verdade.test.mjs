import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const loaderAvaliacao = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-supabase-rating-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

function obterBlocoCarregamentoAvaliacao() {
  const inicio = paginaObra.indexOf(
    "async function carregarAvaliacaoRealObra()",
  );
  const fim = paginaObra.indexOf(
    "void carregarAvaliacaoRealObra();",
    inicio,
  );

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return paginaObra.slice(inicio, fim);
}

test("Supabase prevalece sobre cache local quando a avaliacao remota carrega", () => {
  const bloco = obterBlocoCarregamentoAvaliacao();

  assert.doesNotMatch(bloco, /avaliacaoLocal\.encontrada/);
  assert.doesNotMatch(bloco, /salvarAvaliacaoRemotaObra\(/);
  assert.match(
    loaderAvaliacao,
    /const minhaNota = usuarioEhAutorDaObraAtual \? 0 : minhaNotaRemota;/,
  );
  assert.match(loaderAvaliacao, /total: metrica\.avaliacao\.total,/);
  assert.match(loaderAvaliacao, /media: metrica\.avaliacao\.media,/);
  assert.match(
    bloco,
    /const snapshotRemoto = await carregarSnapshotRemotoAvaliacaoObra\(/,
  );
});

test("cache de avaliacao so e sincronizado depois do guard da execucao atual", () => {
  const bloco = obterBlocoCarregamentoAvaliacao();
  const indiceGuard = bloco.indexOf(
    "avaliacaoVersaoRef.current !== versaoAoIniciar",
  );
  const indiceCache = bloco.indexOf(
    "salvarAvaliacaoLocal(\n            obraAtual,\n            snapshotRemoto.minhaNotaRemota,",
  );
  const indiceEstado = bloco.indexOf("setAvaliacaoObra({");

  assert.ok(indiceGuard >= 0);
  assert.ok(indiceCache > indiceGuard);
  assert.ok(indiceEstado > indiceCache);
});

test("localStorage continua disponivel apenas como fallback inicial", () => {
  assert.match(
    paginaObra,
    /const avaliacaoLocalInicial = obterAvaliacaoLocalInicialObra\(\s*obraAtual,\s*usuarioIdLogado,\s*\);/,
  );
  assert.match(
    paginaObra,
    /const aplicarAvaliacaoLocalTimer = window\.setTimeout\([\s\S]*?minhaNota: avaliacaoLocalInicial\.nota,/,
  );
});
