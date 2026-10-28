import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const loader = await readFile(
  "app/em-breve/loaders/carregar-obras-reais-em-breve.ts",
  "utf8",
);

test("loader de obras reais preserva consultas, filtros e normalizacao", () => {
  [
    "carregarTodasPaginasSupabase",
    '"obras publicadas do Em breve"',
    '.from("obras")',
    '"id,user_id,titulo,autor,genero,formato,classificacao_indicativa,capa_url,arquivo_url,publicado,slug,link,criada_em"',
    '.eq("publicado", true)',
    '.order("criada_em", { ascending: false })',
    '.order("id", { ascending: false })',
    ".range(inicio, fim)",
    "ehClassificacao18",
    "const obraIds = obrasPublicadas",
    "return [] as ObraEmBreveCard[]",
    "carregarTodasPaginasPorLotesSupabase",
    '"capítulos publicados das obras do Em breve"',
    '.from("capitulos")',
    '.select("id,obra_id")',
    '.in("obra_id", obraIdsLote)',
    '.order("obra_id", { ascending: true })',
    "new Set",
    "obrasComCapituloPublicado.has(obraId)",
    "obraSupabaseTemArquivoEmBreve",
    "normalizarObraSupabaseEmBreve",
    '"Não consegui acessar obras reais do Em breve:"',
  ].forEach((contrato) => assert.ok(loader.includes(contrato), contrato));

  assert.doesNotMatch(
    loader,
    /\.insert\(|\.update\(|\.delete\(|\.upsert\(|auth|useEffect|useState|router|localStorage/,
  );
});

test("pagina delega o loader e preserva os demais fluxos", () => {
  assert.match(pagina, /from "\.\/loaders\/carregar-obras-reais-em-breve"/);
  assert.doesNotMatch(pagina, /async function carregarObrasReaisEmBreve/);
  assert.doesNotMatch(pagina, /carregarTodasPaginasSupabase/);
  assert.doesNotMatch(pagina, /carregarTodasPaginasPorLotesSupabase/);
  assert.doesNotMatch(pagina, /normalizarObraSupabaseEmBreve/);
  assert.match(pagina, /async function encontrarLinkObraComConteudoEmBreve/);
  assert.match(pagina, /supabase/);
  assert.match(pagina, /ehClassificacao18/);
  assert.match(pagina, /obraSupabaseTemArquivoEmBreve/);
});
