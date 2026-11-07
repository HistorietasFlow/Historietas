import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function carregar(arquivo, deps = {}) {
  const source = readFileSync(new URL(arquivo, import.meta.url), "utf8");
  const codigo = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const modulo = { exports: {} };
  new Function("module", "exports", "require", codigo)(modulo, modulo.exports, (nome) => {
    assert.ok(nome in deps, `Import inesperado: ${nome}`);
    return deps[nome];
  });
  return modulo.exports;
}
const genero = carregar("../../lib/catalogo-genero.ts");
const tag = carregar("../../lib/catalogo-tag.ts");
const notaMinima = carregar("../../lib/catalogo-nota-minima.ts");

test("normalização literal preserva pontuação e não aplica stemming", () => {
  assert.equal(tag.normalizarTagCatalogo(" \tAÇÃO   Épica\n"), "acao epica");
  for (const texto of ["%", "_", "\\", ",.()", "'); DROP TABLE obras; --", "romances"]) {
    assert.equal(tag.normalizarTagCatalogo(texto), texto.toLowerCase());
  }
  assert.equal(tag.normalizarTagCatalogo(null), "");
  assert.equal(tag.normalizarTagCatalogo("a".repeat(200)).length, 90);
  assert.equal(tag.normalizarTagCatalogo("a".repeat(200), false).length, 200);
});

test("sem tag preserva chamada legada; com tag envia contrato completo e cursores nulos", async () => {
  const chamadas = [];
  const { listarPaginaCatalogo } = carregar("../../lib/catalogo.ts", {
    "./catalogo-genero": genero,
    "./catalogo-tag": tag,
    "./catalogo-nota-minima": notaMinima,
    "./supabase/client": { supabase: { rpc: async (...args) => {
      chamadas.push(args); return { data: [], error: null };
    } } },
  });
  await listarPaginaCatalogo();
  assert.equal(Object.hasOwn(chamadas[0][1], "p_tag"), false);
  await listarPaginaCatalogo({ tag: " AÇÃO ", busca: "dragao", genero: "Fantasia", formato: "HQ", ordenacao: "mais-capitulos" });
  assert.deepEqual(chamadas[1], ["listar_obras_catalogo", {
    p_tag: "acao", p_busca: "dragao", p_genero: "Fantasia", p_formato: "HQ",
    p_classificacao: "", p_filtro_capitulos: "todos", p_ordenacao: "mais-capitulos",
    p_limite: 24, p_cursor_valor: null, p_cursor_data: null, p_cursor_id: null,
  }]);
  const cursor = { valor: 2, data: "2026-01-01", id: "obra" };
  await listarPaginaCatalogo({ tag: "acao", cursor });
  assert.equal(chamadas[2][1].p_cursor_id, "obra");
  assert.equal(chamadas[2][1].p_tag, "acao");
});

test("falha da variante com tag é propagada, sem repetir consulta ampla", async () => {
  let chamadas = 0;
  const { listarPaginaCatalogo } = carregar("../../lib/catalogo.ts", {
    "./catalogo-genero": genero,
    "./catalogo-tag": tag,
    "./catalogo-nota-minima": notaMinima,
    "./supabase/client": { supabase: { rpc: async () => {
      chamadas++; return { data: null, error: { message: "indisponível" } };
    } } },
  });
  await assert.rejects(listarPaginaCatalogo({ tag: "acao" }), /indisponível/);
  assert.equal(chamadas, 1);
});

test("nota mínima valida limites, escala e parâmetros inválidos", () => {
  for (const valor of [0.5, 1, 4, 4.5, 5, "4.5", "5.0"]) {
    assert.equal(notaMinima.normalizarNotaMinimaCatalogo(valor), Number(valor));
  }
  for (const valor of [null, undefined, "", " ", 0, 5.5, -1, 4.1, NaN, Infinity, "NaN", "0x4", "4e0", "4,5", "4 OR 1=1", {}, true]) {
    assert.equal(notaMinima.normalizarNotaMinimaCatalogo(valor), null);
  }
});

test("nota mínima usa variante completa com tag opcional, mantendo cursor e legados", async () => {
  const chamadas = [];
  const { listarPaginaCatalogo } = carregar("../../lib/catalogo.ts", {
    "./catalogo-genero": genero,
    "./catalogo-tag": tag,
    "./catalogo-nota-minima": notaMinima,
    "./supabase/client": { supabase: { rpc: async (...args) => {
      chamadas.push(args); return { data: [], error: null };
    } } },
  });
  await listarPaginaCatalogo({ notaMinima: 4 });
  assert.equal(chamadas[0][1].p_nota_minima, 4);
  assert.equal(chamadas[0][1].p_tag, "");
  assert.equal(chamadas[0][1].p_cursor_id, null);
  assert.equal(Object.keys(chamadas[0][1]).length, 12);
  await listarPaginaCatalogo({ tag: "AÇÃO", notaMinima: 4.5,
    formato: "HQ", ordenacao: "mais-capitulos", cursor: { id: "proxima", data: "2026-01-01", valor: 2 } });
  assert.equal(chamadas[1][1].p_tag, "acao");
  assert.equal(chamadas[1][1].p_cursor_id, "proxima");
  assert.equal(chamadas[1][1].p_formato, "HQ");
  assert.equal(chamadas[1][1].p_ordenacao, "mais-capitulos");
  await listarPaginaCatalogo({ notaMinima: null });
  assert.equal(Object.hasOwn(chamadas[2][1], "p_nota_minima"), false);
});

test("exclusão usa 13 argumentos, combina filtros e não substitui a consulta em falha", async () => {
  const chamadas = [];
  let falhar = false;
  const { listarPaginaCatalogo } = carregar("../../lib/catalogo.ts", {
    "./catalogo-genero": genero,
    "./catalogo-tag": tag, "./catalogo-nota-minima": notaMinima,
    "./supabase/client": { supabase: { rpc: async (...args) => {
      chamadas.push(args); return { data: [], error: falhar ? { message: "rede" } : null };
    } } },
  });
  await listarPaginaCatalogo({ tagExcluida: "  AÇÃO   Épica " });
  assert.equal(Object.keys(chamadas[0][1]).length, 13);
  assert.equal(chamadas[0][1].p_tag_excluida, "acao epica");
  assert.equal(chamadas[0][1].p_tag, "");
  assert.equal(chamadas[0][1].p_nota_minima, null);
  assert.equal(chamadas[0][1].p_cursor_id, null);
  await listarPaginaCatalogo({ tagExcluida: "%_\\,.()", tag: "base", notaMinima: 4.5,
    formato: "HQ", genero: "Fantasia", busca: "dragão", ordenacao: "mais-capitulos",
    cursor: { valor: 1, data: "2026-01-01", id: "proxima" } });
  assert.equal(chamadas[1][1].p_tag_excluida, "%_\\,.()");
  assert.equal(chamadas[1][1].p_tag, "base");
  assert.equal(chamadas[1][1].p_nota_minima, 4.5);
  assert.equal(chamadas[1][1].p_formato, "HQ");
  assert.equal(chamadas[1][1].p_cursor_id, "proxima");
  await listarPaginaCatalogo({ tagExcluida: " " });
  assert.equal(Object.hasOwn(chamadas[2][1], "p_tag_excluida"), false);
  falhar = true;
  await assert.rejects(listarPaginaCatalogo({ tagExcluida: "base" }), /rede/);
  assert.equal(chamadas.length, 4);
});

test("gênero excluído normaliza aliases e compara termos completos sem confundir tags", () => {
  const { categorias } = carregar("../../app/explorar/lib/explorar-categories.ts");
  for (const categoria of categorias) assert.ok(genero.normalizarGeneroExcluido(categoria), categoria);
  for (const valor of [" FICÇÃO ", "sci-fi", "SCI  FI"]) {
    assert.equal(genero.normalizarGeneroExcluido(valor), "ficcao");
  }
  for (const valor of ["", null, "%", "_", "\\", "drama|.*", "desconhecido", "a".repeat(1000)]) {
    assert.equal(genero.normalizarGeneroExcluido(valor), "");
  }
  for (const [texto, filtro, esperado] of [
    ["Melodrama", "Drama", false], ["Dramaturgia", "Drama", false], ["Investigação", "Ação", false],
    ["Fantasia, Romance", "Romance", true], ["Ação e aventura", "Aventura", true],
    ["  AÇÃO\t Épica ", "Ação", true], ["Romance histórico", "Histórico", true],
    ["Ficção científica", "Ficção", true], ["SCI-FI espacial", "Ficção", true],
    ["sci\t fi", "Ficção", true], ["Fantasia sombria", "Fantasia", true],
    ["Cyberpunk", "Ficção", false], ["Romances", "Romance", false],
    ["anti_romance", "Romance", false], ["pré-Romance", "Romance", true],
    ["éromance", "Romance", false], ["Romance2", "Romance", false],
    ["", "Drama", false],
  ]) assert.equal(genero.generoCorrespondeExclusao(texto, filtro), esperado, texto);
});

test("gênero usa os 14 argumentos, combina filtros e preserva retry sem consulta ampla", async () => {
  const chamadas = [];
  let erro = true;
  const { listarPaginaCatalogo } = carregar("../../lib/catalogo.ts", {
    "./catalogo-genero": genero, "./catalogo-tag": tag, "./catalogo-nota-minima": notaMinima,
    "./supabase/client": { supabase: { rpc: async (...args) => {
      chamadas.push(args); return { data: [], error: erro ? { message: "rede" } : null };
    } } },
  });
  const consulta = { generoExcluido: "SCI-FI", genero: "Fantasia", tag: "base",
    tagExcluida: "bloqueada", notaMinima: 4.5, formato: "HQ", ordenacao: "mais-capitulos" };
  await assert.rejects(listarPaginaCatalogo(consulta), /rede/);
  assert.equal(chamadas.length, 1);
  erro = false;
  await listarPaginaCatalogo(consulta);
  assert.equal(chamadas.length, 2);
  assert.deepEqual(chamadas[1], chamadas[0]);
  const p = chamadas[0][1];
  assert.equal(Object.keys(p).length, 14);
  assert.equal(p.p_genero_excluido, "ficcao");
  assert.equal(p.p_tag, "base");
  assert.equal(p.p_tag_excluida, "bloqueada");
  assert.equal(p.p_nota_minima, 4.5);
  assert.equal(p.p_formato, "HQ");
  assert.equal(p.p_ordenacao, "mais-capitulos");
  assert.equal(p.p_cursor_id, null);
  await listarPaginaCatalogo({ generoExcluido: "drama", cursor: { id: "seguinte", valor: 2, data: "2026-01-01" } });
  assert.equal(chamadas[2][1].p_cursor_id, "seguinte");
  await listarPaginaCatalogo({ generoExcluido: "desconhecido" });
  assert.equal(Object.keys(chamadas[3][1]).length, 10);
});
