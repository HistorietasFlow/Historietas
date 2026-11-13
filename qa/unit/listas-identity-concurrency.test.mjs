import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { for (let i = 0; i < 35; i++) await Promise.resolve(); };
function load(path, deps) {
  const code = ts.transpileModule(readFileSync(new URL(path, root), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(name => {
    assert.ok(name in deps, `unexpected dependency: ${name}`);
    return deps[name];
  }, mod, mod.exports);
  return mod.exports;
}
function loaderHarness(overrides = {}) {
  let effect, cleanup;
  const calls = [];
  const state = { carregando: true, bloqueado: false, erro: "", avaliacaoDiario: {}, listasPerfil: {}, obrasPublicas: [], autores: [] };
  const setter = name => value => { calls.push([name, value]); state[name] = typeof value === "function" ? value(state[name]) : value; };
  const perfil = id => ({ userId: id, nome: id, username: "", avatar: "", bio: "" });
  const deps = {
    react: { useEffect: fn => { effect = fn; } },
    "../../../lib/supabase/client": { supabase: { auth: { getUser: async () => ({ data: { user: { id: A } } }) } } },
    "../../../lib/historietasAdultContent": { ehClassificacao18: value => value === "18" },
    "../../../lib/historietasPrivacy": {
      carregarPreferenciasPrivacidade: async () => ({}),
      carregarPermissoesAbasPerfil: async id => ({ diario: id !== A, biblioteca: id !== A }),
      carregarEstadoRelacionamentoPerfil: async () => "nenhum",
    },
    "../../../lib/utils": { normalizarTexto: value => value.toLowerCase() },
    "../lib/listas-profile-records-loader": { carregarPerfil: async id => perfil(id), carregarAvaliacaoDiarioListas: async () => ({ carregando: false }) },
    "../lib/listas-profile-loader": { carregarListasDoPerfil: async id => ({ tudo: [{ chave: id }] }) },
    "../lib/listas-published-works-loader": { carregarObrasPublicadas: async () => [{ id: "public", genero: "Fantasia", classificacaoIndicativa: "Livre" }] },
    "../lib/listas-public-catalog-loader": { carregarIdsInteracoesUsuario: async () => [], carregarAutoresPublicos: async () => [] },
    "../lib/listas-public-catalog-utils": { ordenarObrasDaSecao: obras => obras, ordenarRecomendacoes: obras => obras },
    "../lib/listas-value-utils": { idUsuarioValido: id => [A, B].includes(id), pegarTexto: (value, fallback = "") => value || fallback, obterMensagemErroListas: e => e.message },
  };
  for (const [key, values] of Object.entries(overrides)) Object.assign(deps[key], values);
  const { useListasPageDataLoader: executarLoader } = load("app/listas/hooks/use-listas-page-data-loader.ts", deps);
  function start(params = {}) {
    cleanup?.();
    executarLoader({
      modo: "perfil", origemPerfil: "diario", userIdUrl: B, secao: "catalogo", genero: "",
      listasPerfilVazias: { tudo: [] }, permissoesProprioPerfil: { diario: true, biblioteca: true },
      storageKeys: {}, avaliacaoDiarioVazia: {},
      ...Object.fromEntries(["Carregando", "Bloqueado", "Erro", "AvaliacaoDiario", "UsuarioAtualId", "UsuarioAtualPerfil", "Perfil", "ListasPerfil", "PreferenciasPerfil", "RelacionamentoPerfil", "ObrasPublicas", "Autores"].map(name => [`set${name}`, setter(name[0].toLowerCase() + name.slice(1))])),
      ...params,
    });
    cleanup = effect();
  }
  return { start, state, calls, stop: () => cleanup?.() };
}

test("avaliação antiga após navegar não bloqueia nem apaga a lista atual", async () => {
  const pending = deferred();
  const h = loaderHarness({
    "../../../lib/supabase/client": { supabase: { auth: { getUser: async () => ({ data: { user: null } }) } } },
    "../lib/listas-profile-records-loader": {
      carregarPerfil: async id => ({ userId: id, nome: id }),
      carregarAvaliacaoDiarioListas: async id => id === A ? pending.promise : {},
    },
  });
  h.start({ userIdUrl: A }); await flush();
  h.start({ userIdUrl: B }); await flush();
  assert.equal(h.state.listasPerfil.tudo[0].chave, B);
  pending.resolve({}); await flush();
  assert.equal(h.state.bloqueado, false);
  assert.equal(h.state.listasPerfil.tudo[0].chave, B);
  assert.equal(h.state.carregando, false);
});

test("recomendação antiga não substitui catálogo de outra rota", async () => {
  const pending = deferred();
  const h = loaderHarness({
    "../lib/listas-public-catalog-loader": { carregarIdsInteracoesUsuario: () => pending.promise, carregarAutoresPublicos: async () => [] },
    "../lib/listas-public-catalog-utils": { ordenarRecomendacoes: () => [{ id: "old" }], ordenarObrasDaSecao: () => [{ id: "new" }] },
  });
  h.start({ modo: "obras", secao: "recomendacoes" }); await flush();
  h.start({ modo: "obras", secao: "recentes" }); await flush();
  pending.resolve([]); await flush();
  assert.deepEqual(h.state.obrasPublicas, [{ id: "new" }]);
  assert.equal(h.state.carregando, false);
});

test("cleanup durante perfil autenticado impede novos loaders e setters", async () => {
  const pending = deferred();
  let catalogCalls = 0;
  const h = loaderHarness({
    "../lib/listas-profile-records-loader": { carregarPerfil: () => pending.promise, carregarAvaliacaoDiarioListas: async () => ({}) },
    "../lib/listas-published-works-loader": { carregarObrasPublicadas: async () => { catalogCalls++; return []; } },
  });
  h.start({ modo: "obras" }); await flush(); h.stop();
  const updates = h.calls.length;
  pending.resolve({ userId: A }); await flush();
  assert.equal(catalogCalls, 0);
  assert.equal(h.calls.length, updates);
});

function sessionHarness(lookup) {
  const slots = [], effects = [], pending = [];
  let cursor = 0, effectCursor = 0, listener, closed = false, unsubscriptions = 0;
  const calls = [], updates = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { updates.push(closed); slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect(fn, deps) {
      const index = effectCursor++, previous = effects[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) pending.push(() => {
        previous?.cleanup?.(); effects[index] = { deps, cleanup: fn() };
      });
    },
  };
  const api = { auth: {
    getUser: async () => { calls.push("getUser"); return lookup(calls.length); },
    onAuthStateChange(fn) { listener = fn; return { data: { subscription: { unsubscribe() { unsubscriptions++; } } } }; },
  } };
  const { useListasSessionScope: executarEscopo } = load("app/listas/hooks/use-listas-session-scope.ts", { react, "../../../lib/supabase/client": { supabase: api } });
  const commit = () => { while (pending.length) pending.shift()(); };
  function render(route = "A", commitEffects = true) {
    cursor = 0; effectCursor = 0;
    const result = executarEscopo(route);
    if (commitEffects) commit();
    return result;
  }
  return {
    render, commit, calls, updates,
    event: (type, id) => listener(type, id ? { user: { id } } : null),
    stop() { closed = true; effects.forEach(effect => effect.cleanup?.()); },
    get unsubscriptions() { return unsubscriptions; },
  };
}
const auth = id => ({ data: { user: id ? { id } : null }, error: null });

test("rota nova fica oculta no render antes do cleanup; respostas fora de ordem são ignoradas", async () => {
  const second = deferred();
  const h = sessionHarness(n => n === 2 ? second.promise : auth(A));
  h.render("A"); await flush();
  assert.equal(h.render("A").usuario.id, A);
  const changing = h.render("B", false);
  assert.equal(changing.carregando, true);
  assert.equal(changing.usuario, null);
  h.commit(); await flush();
  h.render("C"); await flush();
  const current = h.render("C");
  assert.equal(current.carregando, false);
  second.resolve(auth(B)); await flush();
  assert.equal(h.render("C").chave, current.chave);
  assert.equal(h.render("C").usuario.id, A);
  assert.equal(h.calls.length, 3);
  h.stop();
});

test("logout invalida getUser em voo e nunca aplica a identidade anterior", async () => {
  const first = deferred();
  const h = sessionHarness(n => n === 1 ? first.promise : auth(null));
  h.render(); await flush();
  h.event("SIGNED_OUT", null);
  assert.equal(h.render().carregando, true);
  await flush();
  assert.equal(h.render().usuario, null);
  first.resolve(auth(A)); await flush();
  assert.equal(h.render().usuario, null);
  assert.equal(h.render().carregando, false);
  h.stop();
});

test("A → B → A recebe versões diferentes; refresh e INITIAL_SESSION atrasado não recarregam", async () => {
  let current = A;
  const h = sessionHarness(() => auth(current));
  h.render(); await flush();
  const original = h.render();
  h.event("INITIAL_SESSION", A); h.event("TOKEN_REFRESHED", A); h.render(); await flush();
  assert.equal(h.calls.length, 1);
  current = B; h.event("SIGNED_IN", B);
  assert.equal(h.render().usuario, null); await flush();
  const other = h.render(); assert.equal(other.usuario.id, B);
  h.event("INITIAL_SESSION", A); h.render(); await flush();
  assert.equal(h.calls.length, 2);
  current = A; h.event("SIGNED_IN", A); h.render(); await flush();
  const returned = h.render();
  assert.equal(returned.usuario.id, A);
  assert.notEqual(returned.chave, original.chave);
  assert.notEqual(returned.chave, other.chave);
  h.stop();
});

for (const mode of ["throw", "error", "missing"]) {
  test(`validação Auth ${mode} termina loading e falha sem dados privados`, async () => {
    const h = sessionHarness(() => {
      if (mode === "throw") throw Error("network");
      return { data: { user: null }, error: { name: mode === "missing" ? "AuthSessionMissingError" : "AuthApiError" } };
    });
    h.render(); await flush();
    const value = h.render();
    assert.equal(value.carregando, false);
    assert.equal(value.usuario, null);
    assert.equal(Boolean(value.erro), mode !== "missing");
    h.stop();
  });
}

test("desmontagem cancela validação e inscrição Auth sem atualização posterior", async () => {
  const pending = deferred();
  const h = sessionHarness(() => pending.promise);
  h.render(); await flush(); h.stop();
  const before = h.updates.length;
  pending.resolve(auth(A)); h.event("SIGNED_IN", B); await flush();
  assert.equal(h.updates.length, before);
  assert.equal(h.unsubscriptions, 1);
});

test("filtros locais não mudam a chave de carga; identidade/rota de dados mudam", () => {
  const { criarChaveCarregamentoListas: key } = load("app/listas/lib/listas-page-route-state.ts", {
    "./listas-route-utils": {}, "./listas-value-utils": {},
  });
  const route = { modo: "perfil", origemPerfil: "diario", userIdUrl: A, secao: "catalogo", genero: "" };
  assert.equal(key(route), key({ ...route, categoria: "favoritas", ordenacao: "nota", obraAlvoId: "work" }));
  for (const change of [{ modo: "obras" }, { origemPerfil: "biblioteca" }, { userIdUrl: B }, { secao: "recomendacoes" }, { genero: "Fantasia" }]) {
    assert.notEqual(key(route), key({ ...route, ...change }));
  }
  const page = readFileSync(new URL("app/listas/page.tsx", root), "utf8");
  assert.match(page, /<ListasContextContent key=\{escopo.chave\} usuarioAutenticado=\{escopo.usuario\}/);
});

test("diário permitido cancelado durante avaliação não inicia listas depois do cleanup", async () => {
  const pending = deferred();
  let listCalls = 0;
  const h = loaderHarness({
    "../lib/listas-profile-records-loader": { carregarPerfil: async id => ({ userId: id, nome: id }), carregarAvaliacaoDiarioListas: () => pending.promise },
    "../lib/listas-profile-loader": { carregarListasDoPerfil: async () => { listCalls++; return { tudo: [] }; } },
  });
  h.start({ userIdUrl: A }); await flush();
  h.stop(); const before = h.calls.length;
  pending.resolve({}); await flush();
  assert.equal(listCalls, 0);
  assert.equal(h.calls.length, before);
});
