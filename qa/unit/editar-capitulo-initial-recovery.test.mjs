import assert from "node:assert/strict";
import test from "node:test";
import {loadApplicationModule} from "../helpers/load-application-module.mjs";
import {tickEdicao} from "../helpers/editar-capitulo-save-harness.mjs";

for (const modo of ["sucesso", "rede", "ilegivel", "desmontado", "cache-alterado"]) {
  test(`carregamento ${modo} preserva/restaura cópia da aba sem trocar a referência remota`, async t => {
    const previous = {window: globalThis.window, sessionStorage: globalThis.sessionStorage, localStorage: globalThis.localStorage};
    let leituras = 0;
    globalThis.localStorage = {getItem: () => modo === "cache-alterado" ? String(++leituras) : null};
    const row = {id: "capitulo", obra_id: "obra", user_id: "A", titulo: "Título remoto", texto: "Texto remoto", ordem: 1,
      publicado: false, tipo_conteudo: "texto", atualizado_em: "2026-11-14T00:00:00+00:00", criado_em: ""};
    const recuperacao = {titulo: "Meu título recuperado", texto: "Meu texto preenchido e preservado", estado: "incerto", referencia: {...row, atualizado_em: "2026-11-13T00:00:00+00:00"}};
    globalThis.sessionStorage = {getItem: () => modo === "ilegivel" ? "{" : JSON.stringify(recuperacao)};
    const timers = new Map(); let timerId = 0, effect, cursor = 0;
    const states = [], campos = {}, gravacoes = [];
    globalThis.window = {location: {search: "?obraId=obra&capituloId=capitulo"},
      setTimeout: fn => {timers.set(++timerId, fn); return timerId;}, clearTimeout: id => timers.delete(id)};
    t.after(() => Object.assign(globalThis, previous));
    const {useEditarCapituloInitialLoad: executarHook} = loadApplicationModule("app/editar-capitulo/hooks/useEditarCapituloInitialLoad.ts", {
      react: {useState: value => {const i = cursor++; states[i] = value; return [value, v => {states[i] = v;}];}, useEffect: fn => {effect = fn;}},
      "../../../lib/supabase/client": {supabase: {auth: {getUser: async () => ({data: {user: {id: "A"}}, error: null})},
        from() {const q = {select: () => q, eq: () => q, limit: () => q, maybeSingle: async () => ({data: {id: "obra", user_id: "A", titulo: "Obra"}, error: null})}; return q;}}},
      "../../../lib/supabase/paginacao.mjs": {carregarTodasPaginasSupabase: async () => {if (modo === "rede") throw new Error("Rede"); return [row];}},
      "../actions/carregar-nome-profile-editar-capitulo": {carregarNomeProfileEditarCapitulo: async () => ""},
      "../lib/editar-capitulo-local-work-storage": {carregarObrasLocaisNormalizadas: () => [{id: "obra", autorId: "A", capitulos: [{id: "capitulo", titulo: "Local", texto: "Local"}]}],
        salvarObrasEditarCapituloStorage: obras => {gravacoes.push(obras); return obras;}},
    });
    t.mock.method(console, "warn", () => {});
    executarHook({router: {replace() {}}, setTitulo: v => {campos.titulo = v;}, setTexto: v => {campos.texto = v;}});
    const cleanup = effect();
    if (modo === "desmontado") cleanup();
    await tickEdicao();
    for (const fn of timers.values()) fn();
    if (modo === "desmontado") {assert.deepEqual(campos, {}); assert.equal(gravacoes.length, 0);}
    else if (modo === "ilegivel") {assert.equal(campos.titulo, "Título remoto"); assert.ok(states[2].length);}
    else {assert.equal(campos.titulo, recuperacao.titulo); assert.equal(campos.texto, recuperacao.texto);}
    if (modo === "sucesso") assert.equal(states[6].atualizado_em, row.atualizado_em);
    if (modo === "cache-alterado") assert.equal(gravacoes.length, 0);
    cleanup();
  });
}
