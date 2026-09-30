import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaServidor = readFileSync(
  new URL("../../app/obra/[slug]/page.tsx", import.meta.url),
  "utf8",
);
const paginaCliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

function obterBloco(texto, inicioTexto, fimTexto) {
  const inicio = texto.indexOf(inicioTexto);
  const fim = texto.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return texto.slice(inicio, fim);
}

test("rota da obra usa 404 real apenas para slug invalido ou obra ausente", () => {
  const bloco = paginaServidor.slice(
    paginaServidor.indexOf("export default async function ObraPage"),
  );

  assert.match(
    paginaServidor,
    /import \{ notFound \} from "next\/navigation";/,
  );
  assert.match(bloco, /const slug = await obterSlug\(params\);/);
  assert.match(bloco, /if \(!slug\) \{\s*notFound\(\);\s*\}/);
  assert.match(
    bloco,
    /const obra = await obterObraMetadataPublica\(slug\);/,
  );
  assert.match(bloco, /if \(!obra\) \{\s*notFound\(\);\s*\}/);
  assert.doesNotMatch(bloco, /\.catch\(/);
  assert.doesNotMatch(bloco, /catch\s*\(/);
});

test("ausencia confirmada no Supabase descarta somente cache da obra atual", () => {
  const bloco = obterBloco(
    paginaCliente,
    "if (!obraBanco) {",
    "let capitulosBanco",
  );

  assert.match(bloco, /const obrasSemCacheObsoleto = obrasLocais\.filter/);
  assert.match(bloco, /obraLocalAtual\.slug\?\.trim\(\)/);
  assert.match(bloco, /criarSlugBase\(obraLocalAtual\.titulo\)/);
  assert.match(bloco, /return !slugsLocais\.has\(slugLimpo\);/);
  assert.match(bloco, /status: "nao_encontrada"/);
  assert.doesNotMatch(bloco, /aplicarMetricasSeAtual/);
});

test("erro do Supabase preserva fallback local e e tratado como erro", () => {
  const blocoCarregador = obterBloco(
    paginaCliente,
    "async function carregarObraSupabasePorSlug(",
    "function totalCurtidasObraPublica(",
  );

  assert.match(
    blocoCarregador,
    /if \(erroObra\)[\s\S]*?obras: await aplicarMetricasSeAtual\(obrasLocais\),[\s\S]*?status: "erro"/,
  );
  assert.match(
    blocoCarregador,
    /catch \(error\)[\s\S]*?obras: await aplicarMetricasSeAtual\(obrasLocais\),[\s\S]*?status: "erro"/,
  );

  const blocoEfeito = obterBloco(
    paginaCliente,
    "async function carregarObraPublica()",
    "void carregarObraPublica();",
  );

  assert.match(
    blocoEfeito,
    /setErroCarregamentoObra\(resultadoSupabase\.status === "erro"\)/,
  );
  assert.doesNotMatch(
    blocoEfeito,
    /catch \{[\s\S]*?setObrasLocais\(\[\]\)/,
  );
});

test("cliente diferencia indisponibilidade de obra nao encontrada", () => {
  assert.match(
    paginaCliente,
    /erroCarregamentoObra[\s\S]*?"Não foi possível carregar a obra agora\."[\s\S]*?"Obra não encontrada"/,
  );
});
