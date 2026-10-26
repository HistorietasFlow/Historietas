import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-supabase-normalization.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(utilsSource, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { normalizarCategoriaSupabase, normalizarCapituloSupabase } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("normalizadores Supabase de Adicionar Capítulo preservam categorias explícitas", () => {
  for (const categoria of ["texto", "documento", "imagem", "outro"]) assert.equal(normalizarCategoriaSupabase(categoria), categoria);
  assert.equal(normalizarCategoriaSupabase(" texto "), "outro");
  assert.equal(normalizarCategoriaSupabase("desconhecida"), "outro");
  assert.equal(normalizarCategoriaSupabase(null), "outro");
});

test("normalizador de capítulo Supabase preserva remoto e complementos locais", () => {
  const remoto = { id: " id ", titulo: " Título ", texto: " texto ", ordem: 2, publicado: true, criado_em: "data" };
  assert.deepEqual(normalizarCapituloSupabase(remoto, 5, { curtiu: 1, salvo: "x", comentario: "comentário", lido: true, lidoEm: "leitura" }), {
    id: " id ", titulo: "Título", texto: " texto ", curtiu: true, salvo: true, comentario: "comentário", criadoEm: "data", lido: true, lidoEm: "leitura", publicado: true, ordem: 2,
  });
  assert.equal(normalizarCapituloSupabase({ ...remoto, titulo: " ", texto: null, criado_em: null, publicado: null, ordem: 0 }, 3).titulo, "Capítulo 4");
  const fallback = normalizarCapituloSupabase({ ...remoto, titulo: null, texto: null, criado_em: null, publicado: false, ordem: -1 }, 3);
  assert.deepEqual({ texto: fallback.texto, comentario: fallback.comentario, criadoEm: fallback.criadoEm, lido: fallback.lido, lidoEm: fallback.lidoEm, publicado: fallback.publicado, ordem: fallback.ordem }, { texto: "", comentario: "", criadoEm: "", lido: false, lidoEm: "", publicado: false, ordem: 4 });
  assert.equal(normalizarCapituloSupabase({ ...remoto, ordem: 1.5 }, 3).ordem, 4);
});

test("Adicionar Capítulo delega normalizadores Supabase menores", () => {
  assert.match(pageSource, /from "\.\/lib\/adicionar-capitulo-supabase-normalization"/);
  assert.doesNotMatch(pageSource, /function normalizarCategoriaSupabase\(/);
  assert.doesNotMatch(pageSource, /function normalizarCapituloSupabase\(/);
  assert.match(pageSource, /function normalizarObraSupabase\(/);
  assert.match(pageSource, /normalizarCapituloSupabase\([\s\S]*?capitulosLocaisPorId\.get\(capitulo\.id\)/);
  assert.match(pageSource, /categoria: normalizarCategoriaSupabase\(obra\.arquivo_categoria\)/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect|router|<[A-Z]/);
});
