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
