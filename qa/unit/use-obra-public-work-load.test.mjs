import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const lifecycleCarregamentoObra = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-public-work-load.ts",
    import.meta.url,
  ),
  "utf8",
);

function indice(texto) {
  const resultado = lifecycleCarregamentoObra.indexOf(texto);

  assert.ok(resultado >= 0, `Não encontrei: ${texto}`);
  return resultado;
}

test("pagina delega somente o lifecycle de carregamento principal ao hook", () => {
  assert.match(
    paginaObra,
    /import \{ useObraPublicWorkLoad \} from "\.\/hooks\/use-obra-public-work-load";/,
  );
  assert.match(
    paginaObra,
    /useObraPublicWorkLoad\(\{[\s\S]*?autenticacaoCarregada,[\s\S]*?slug,[\s\S]*?usuarioIdLogado,[\s\S]*?identidadeAutenticadaObraRef,[\s\S]*?setObrasLocais,[\s\S]*?setCarregandoObras,[\s\S]*?setErroCarregamentoObra,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(paginaObra, /async function carregarObraPublica\(\)/);
  assert.doesNotMatch(paginaObra, /carregarObrasLocaisComBackup/);
  assert.doesNotMatch(paginaObra, /carregarObraSupabasePorSlug/);
});

test("carregamento aguarda autenticacao e rejeita identidade divergente", () => {
  const inicioEfeito = indice("useEffect(() => {");
  const esperaAutenticacao = indice("if (!autenticacaoCarregada) {");
  const identidadeEsperada = indice(
    "const identidadeEsperada = identidadeAutenticadaObraRef.current;",
  );
  const identidadeDivergente = indice(
    "if (identidadeEsperada.usuarioId !== usuarioIdLogado.trim()) {",
  );

  assert.ok(inicioEfeito < esperaAutenticacao);
  assert.ok(esperaAutenticacao < identidadeEsperada);
  assert.ok(identidadeEsperada < identidadeDivergente);
  assert.match(lifecycleCarregamentoObra, /return;[\s\S]*?let cancelado = false;/);
});

test("fallback local e consulta Supabase mantem ordem e guards da identidade", () => {
  const identidadeAtual = indice("function execucaoCarregamentoEstaAtual() {");
  const carregarLocal = indice("const obrasNormalizadas = carregarObrasLocaisComBackup(");
  const aplicarLocal = indice("setObrasLocais(obrasNormalizadas);");
  const carregarRemoto = indice("const resultadoSupabase = await carregarObraSupabasePorSlug(");
  const aplicarRemoto = indice("setObrasLocais(resultadoSupabase.obras);");

  assert.ok(identidadeAtual < carregarLocal);
  assert.ok(carregarLocal < aplicarLocal);
  assert.ok(aplicarLocal < carregarRemoto);
  assert.ok(carregarRemoto < aplicarRemoto);
  assert.match(
    lifecycleCarregamentoObra,
    /execucaoIdentidadeObraEstaAtual\(\{[\s\S]*?identidadeEsperada,[\s\S]*?identidadeAtual: identidadeAutenticadaObraRef\.current,[\s\S]*?\}\)/,
  );
  assert.ok(
    (lifecycleCarregamentoObra.match(/if \(!execucaoCarregamentoEstaAtual\(\)\)/g) || [])
      .length >= 4,
  );
});

test("estados, erro e cleanup preservam aplicacao protegida", () => {
  assert.match(
    lifecycleCarregamentoObra,
    /setCarregandoObras\(true\);[\s\S]*?setErroCarregamentoObra\(false\);/,
  );
  assert.match(
    lifecycleCarregamentoObra,
    /setErroCarregamentoObra\(resultadoSupabase\.status === "erro"\);/,
  );
  assert.match(
    lifecycleCarregamentoObra,
    /catch \{[\s\S]*?setErroCarregamentoObra\(true\);/,
  );
  assert.match(
    lifecycleCarregamentoObra,
    /finally \{[\s\S]*?setCarregandoObras\(false\);/,
  );
  assert.match(
    lifecycleCarregamentoObra,
    /return \(\) => \{\s*cancelado = true;\s*\};/,
  );
});
