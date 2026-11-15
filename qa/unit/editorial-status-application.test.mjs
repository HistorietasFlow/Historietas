import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const status = load("lib/statusEditorial.ts");
const route = load("app/explorar/lib/explorar-page-route-utils.ts");
const { StoryStatusField } = load("components/StoryStatusField.tsx");
const token = "00000000-0000-4000-8000-000000000001";
const row = (value = null, version = token) => ({id: "obra", user_id: "A", status_editorial: value, status_editorial_versao: version});

test("status e token são uma unidade remota, distinguindo legado NULL de ausência/invalidez", () => {
  for (const value of [null, ...status.STATUS_EDITORIAIS]) {
    assert.equal(status.confirmarEditorialRemoto(row(value), "obra", "A").status, value);
  }
  assert.equal(status.confirmarEditorialRemoto(row(null, null), "obra", "A").versao, null);
  for (const value of [undefined, "", "Ongoing", "CONCLUIDA", false]) assert.equal(status.confirmarEditorialRemoto({...row(), status_editorial: value}, "obra", "A"), null);
  for (const value of [undefined, "", "invalido"]) assert.equal(status.confirmarEditorialRemoto({...row(), status_editorial_versao: value}, "obra", "A"), null);
  assert.equal(status.confirmarEditorialRemoto({id: "obra", user_id: "A"}, "obra", "A"), null);
  assert.equal(status.confirmarEditorialRemoto(row(), "obra", "B"), null);
  assert.equal(status.confirmarEditorialRemoto(row(), "outra", "A"), null);
});

test("controle opcional neutro, labels PT/EN/ES, sem filtro para NULL", () => {
  for (const [idioma, label, unknown] of [["pt-BR", "Estado da história", "Não informado"], ["en", "Story status", "Not specified"], ["es", "Estado de la historia", "No informado"]]) {
    const html = renderToStaticMarkup(React.createElement(StoryStatusField, {id: "editorial", idioma, value: "", onChange() {}}));
    assert.ok(html.includes(`<label for="editorial">${label}</label>`));
    assert.ok(html.includes(`<option value="" selected="">${unknown}</option>`));
    const filter = renderToStaticMarkup(React.createElement(StoryStatusField, {id: "filtro", idioma, value: "", filtro: true, onChange() {}}));
    assert.ok(!filter.includes(unknown));
    for (const value of status.STATUS_EDITORIAIS) assert.ok(filter.includes(`value="${value}"`));
  }
});

test("URL preserva combinações; valores desconhecidos e Autores neutralizam o status", () => {
  const url = "/explorar?categoria=Fantasia&busca=Teste&formato=HQ&tag=magia&tagExcluida=terror&notaMinima=3&statusEditorial=concluida";
  const filtros = route.lerFiltrosCompartilhaveisExplorar(new URL(url, "http://localhost").search);
  assert.equal(filtros.statusEditorial, "concluida");
  assert.deepEqual(route.lerFiltrosCompartilhaveisExplorar(new URL(route.criarUrlExplorar(filtros), "http://localhost").search), filtros);
  const removido = new URL(route.criarUrlExplorar({...filtros, statusEditorial: ""}), "http://localhost");
  assert.equal(removido.searchParams.has("statusEditorial"), false);
  assert.equal(removido.searchParams.get("tag"), "magia");
  assert.equal(route.lerFiltrosCompartilhaveisExplorar("?statusEditorial=invalido").statusEditorial, undefined);
  assert.equal(route.lerFiltrosCompartilhaveisExplorar("?tipo=autores&statusEditorial=concluida").statusEditorial, undefined);
  assert.equal(new URL(route.criarUrlExplorar({...filtros, modoConteudo: "autores"}), "http://localhost").searchParams.has("statusEditorial"), false);
});

test("RPC ativa usa exatamente 15 argumentos; neutro preserva variantes e não repete consulta", async () => {
  const calls = [];
  const {listarPaginaCatalogo} = load("lib/catalogo.ts", {"./supabase/client": {supabase: {rpc: async (name, args) => { calls.push({name, args}); return {data: [], error: null}; }}}});
  await listarPaginaCatalogo({statusEditorial: "concluida", tag: "magia", notaMinima: 3, tagExcluida: "terror", generoExcluido: "Drama"});
  assert.equal(calls.length, 1);
  assert.equal(Object.keys(calls[0].args).length, 15);
  assert.equal(calls[0].args.p_status_editorial, "concluida");
  for (const key of ["p_cursor_valor", "p_cursor_data", "p_cursor_id"]) assert.equal(calls[0].args[key], null);
  for (const consulta of [{}, {tag: "magia"}, {notaMinima: 3}, {tagExcluida: "terror"}, {generoExcluido: "Drama"}]) {
    await listarPaginaCatalogo({...consulta, statusEditorial: ""});
    assert.equal(Object.hasOwn(calls.at(-1).args, "p_status_editorial"), false);
  }
  assert.deepEqual(calls.slice(1).map(c => Object.keys(c.args).length), [10,11,12,13,14]);
  assert.equal(calls.length, 6);
});

test("a criação encaminha apenas o status no INSERT existente, nunca a versão", () => {
  const source = readFileSync(new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url), "utf8");
  assert.match(source, /\.insert\(\{[\s\S]*status_editorial: filtroStatusEditorial\(statusEditorial\) \|\| null/);
  assert.doesNotMatch(source, /status_editorial_versao|\.update\(\{\s*status_editorial/);
});

test("pós-filtro exige IDs confirmados; cache sozinho nunca certifica o status", () => {
  const {filtrarObrasExplorar} = load("app/explorar/lib/explorar-derived-utils.ts");
  const obra = {id: "obra", titulo: "Teste", autor: "Autor", genero: "Fantasia", formato: "HQ", sinopse: "Sinopse", tags: [], capitulos: []};
  const params = {obrasBaseFiltradas: [obra], categoriaSelecionada: "", termoBusca: "", statusEditorial: "concluida"};
  assert.deepEqual(filtrarObrasExplorar(params), []);
  assert.deepEqual(filtrarObrasExplorar({...params, obraIdsBuscaRemota: []}), []);
  assert.deepEqual(filtrarObrasExplorar({...params, obraIdsBuscaRemota: ["obra"]}), [obra]);
});
