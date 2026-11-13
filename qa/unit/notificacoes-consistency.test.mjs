import assert from "node:assert/strict";
import test from "node:test";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const lib = "app/notificacoes/lib/";
const merge = loadApplicationModule(lib + "notificacoes-merge-utils.ts");
const local = loadApplicationModule(lib + "notificacoes-local-state-utils.ts");
const notification = (id, extra = {}) => ({
  id, tipo: "novo-seguidor", obraId: "", capituloId: "", link: "",
  titulo: "Aviso", mensagem: "Mensagem", lida: false,
  criadaEm: "2026-01-01T00:00:00Z", ...extra,
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
async function flush() {
  for (let i = 0; i < 40; i++) await Promise.resolve();
}
function browser(t) {
  const previousWindow = globalThis.window, previousStorage = globalThis.localStorage;
  const values = new Map(), writes = [], timers = new Map();
  let timerId = 0;
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { writes.push(key); values.set(key, value); },
  };
  globalThis.window = {
    dispatchEvent() {}, alert() { assert.fail("alerta inesperado"); },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
  };
  t.after(() => { globalThis.window = previousWindow; globalThis.localStorage = previousStorage; });
  return {
    writes,
    async tick() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); await flush(); },
  };
}
function harness(t, options = {}) {
  const env = browser(t), calls = [], listeners = new Set();
  let user = "A", effect, cleanup, ref;
  const state = { rows: [], works: [], owner: "", count: 0, loading: true, redirects: [] };
  const auth = {
    getUser: options.getUser ?? (async () => ({ data: { user: user ? { id: user } : null }, error: null })),
    onAuthStateChange: cb => {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
  };
  const loadState = options.loadState ?? (async (_loader, owner) => ({
    userId: owner ?? user, obrasSeguidasIds: [], notificacoesLidasIds: [],
    notificacoesDiretas: [notification(`remote-${owner ?? user}`)],
  }));
  const mocks = {
    react: { useEffect: fn => { effect = fn; }, useRef: value => (ref ??= { current: value }) },
    "next/navigation": { useRouter: () => ({ replace: href => state.redirects.push(href) }) },
    "../../../lib/supabase/client": { supabase: { auth } },
    "../lib/notificacoes-supabase-state-loader": { carregarEstadoSupabaseNotificacoes: (...args) => { calls.push(args[1]); return loadState(...args); } },
    "../lib/notificacoes-supabase-direct-loader": { carregarNotificacoesDiretasSupabase: async () => [] },
    "../lib/notificacoes-supabase-work-loader": {
      carregarObrasPublicadasSupabase: options.works ?? (async () => []),
      carregarObrasDasNotificacoesDiretasSupabase: options.directWorks ?? (async () => []),
    },
    "../lib/notificacoes-supabase-community-loader": { carregarNotificacoesComunidadeSupabase: options.community ?? (async () => []) },
    "../lib/notificacoes-supabase-diary-loader": { carregarNotificacoesDiarioSupabase: options.diary ?? (async () => []) },
    "../lib/notificacoes-supabase-technical-issues-loader": { carregarNotificacoesProblemasTecnicosSupabase: async () => [] },
  };
  const { useNotificacoesInitialLoad: runHook } = loadApplicationModule("app/notificacoes/hooks/use-notificacoes-initial-load.ts", mocks);
  const current = runHook({
    setNotificacoes: rows => { state.rows = rows; }, setObras: works => { state.works = works; },
    setUsuarioNotificacoesId: owner => { state.owner = owner; },
    definirNotificacoesNaoLidas: count => { state.count = count; },
    setCarregando: loading => { state.loading = loading; },
    setSolicitacaoRespondendoId: () => {},
  });
  const mount = () => { cleanup = effect(); };
  const unmount = () => cleanup();
  mount();
  t.after(unmount);
  return { state, calls, current, ...env, unmount, mount,
    async auth(id, event = "SIGNED_IN") {
      user = id;
      listeners.forEach(cb => cb(event, id ? { user: { id } } : null));
      await env.tick();
    },
  };
}
const ids = rows => rows.map(row => row.id);
const cached = owner => local.carregarNotificacoes(owner);

test("mesmo ID com metadados parciais não duplica nem perde leitura", () => {
  const rows = merge.mesclarNotificacoes(
    [notification("same", { lida: true })],
    [notification("same", { autorId: "actor" })],
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].lida, true);
  assert.equal(rows[0].autorId, "actor");
  assert.equal(merge.notificacoesRepresentamMesmoEvento(notification("same"), rows[0]), true);
});

test("nome de exibição igual não identifica pessoas nem colapsa eventos distintos", () => {
  assert.equal(merge.mesclarNotificacoes([], [notification("1", { autorNome: "Ana" }), notification("2", { autorNome: "Ana" })]).length, 2);
});

test("mescla conserva ordenação, preferência canônica e novo evento não lido", () => {
  const chapter = { tipo: "novo-capitulo", obraId: "work", capituloId: "chapter" };
  const rows = merge.mesclarNotificacoes(
    [notification("capitulo-work-chapter", { ...chapter, criadaEm: "2026-03-01" }), notification("old", { autorId: "actor", lida: true })],
    [notification("novo-capitulo:chapter", chapter), notification("new", { autorId: "actor", criadaEm: "2026-02-01" })],
  );
  assert.deepEqual(ids(rows), ["new", "novo-capitulo:chapter"]);
  assert.equal(rows[0].lida, false);
});

test("carga normal usa uma conta explícita e conta somente a lista deduplicada", async t => {
  const h = harness(t);
  local.salvarNotificacoes([notification("remote-A", { lida: true })], "A");
  await flush();
  assert.deepEqual(h.calls, ["A"]);
  assert.equal(h.state.owner, "A");
  assert.equal(h.state.rows.length, 1);
  assert.equal(h.state.count, 0);
  assert.equal(h.state.loading, false);
});

test("falha parcial mantém resultados diretos e de fontes bem-sucedidas", async t => {
  const h = harness(t, {
    community: async () => { throw new Error("fonte indisponível"); },
    diary: async () => [notification("diary")],
  });
  local.salvarNotificacoes([notification("local", { lida: true })], "A");
  await flush();
  assert.deepEqual(new Set(ids(h.state.rows)), new Set(["local", "remote-A", "diary"]));
  assert.equal(h.state.count, 2);
});

test("desmontagem invalida a carga antes de qualquer escrita tardia", async t => {
  const pending = deferred();
  const h = harness(t, { community: () => pending.promise });
  await flush();
  h.unmount();
  const writes = h.writes.length;
  pending.resolve([notification("late")]);
  await flush();
  assert.equal(h.writes.length, writes);
  assert.deepEqual(h.state.rows, []);
});

test("cargas sobrepostas do mesmo componente: só a geração vigente persiste", async t => {
  const old = deferred(); let attempt = 0;
  const h = harness(t, { community: () => ++attempt === 1 ? old.promise : Promise.resolve([notification("new-load")]) });
  await flush();
  h.unmount(); h.mount();
  await flush();
  old.resolve([notification("old-load")]);
  await flush();
  assert.deepEqual(new Set(ids(cached("A"))), new Set(["remote-A", "new-load"]));
  assert.deepEqual(new Set(ids(h.state.rows)), new Set(["remote-A", "new-load"]));
});

test("troca A→B com resposta A atrasada isola tela, contador e cache", async t => {
  const old = deferred();
  const h = harness(t, { community: owner => owner === "A" ? old.promise : Promise.resolve([]) });
  await flush();
  await h.auth("B");
  assert.equal(h.state.owner, "B");
  assert.deepEqual(ids(h.state.rows), ["remote-B"]);
  const writes = h.writes.length;
  old.resolve([notification("old-A")]); await flush();
  assert.equal(h.state.owner, "B");
  assert.equal(h.state.count, 1);
  assert.deepEqual(ids(cached("B")), ["remote-B"]);
  assert.equal(h.writes.length, writes + 1); // Apenas a normalização da leitura feita acima.
  assert.deepEqual(ids(cached("A")), []);
});

test("refresh da mesma identidade não recarrega; logout invalida resposta pendente", async t => {
  const old = deferred();
  const h = harness(t, { community: () => old.promise });
  await flush();
  await h.auth("A", "TOKEN_REFRESHED");
  assert.equal(h.calls.length, 1);
  await h.auth("");
  old.resolve([notification("old-A")]); await flush();
  assert.deepEqual(h.state.rows, []);
  assert.equal(h.state.count, 0);
  assert.equal(h.state.redirects.length, 1);
  assert.deepEqual(ids(cached("A")), []);
});

test("mudança de leitura e exclusão durante a carga prevalecem sobre o snapshot", async t => {
  const pending = deferred();
  const h = harness(t, { community: () => pending.promise });
  local.salvarNotificacoes([notification("read", { lida: true }), notification("deleted")], "A");
  await flush();
  local.salvarNotificacoes([notification("read", { lida: false }), notification("added", { lida: true })], "A");
  local.registrarNotificacoesApagadas("A", ["deleted"]);
  pending.resolve([notification("read", { lida: true }), notification("deleted")]);
  await flush();
  assert.deepEqual(new Set(ids(h.state.rows)), new Set(["read", "added", "remote-A"]));
  assert.equal(h.state.rows.find(row => row.id === "read").lida, false);
  assert.equal(h.state.count, 2);
  assert.deepEqual(cached("A"), h.state.rows);
});

test("fallback autenticado aplica exclusões lógicas e deriva a contagem da lista", async t => {
  const pending = deferred();
  const h = harness(t, { works: () => pending.promise });
  local.salvarNotificacoes([notification("deleted"), notification("read", { lida: true })], "A");
  await flush();
  local.registrarNotificacoesApagadas("A", ["deleted"]);
  pending.reject(new Error("offline")); await flush();
  assert.deepEqual(ids(h.state.rows), ["read"]);
  assert.equal(h.state.count, 0);
  assert.equal(h.state.loading, false);
});

test("tombstone sintético continua válido ao receber a cópia canônica do capítulo", t => {
  browser(t);
  const chapter = notification("novo-capitulo:chapter", { tipo: "novo-capitulo", obraId: "work", capituloId: "chapter" });
  assert.deepEqual(local.filtrarNotificacoesApagadas([chapter], new Set(["capitulo-work-chapter"])), []);
  assert.equal(local.filtrarNotificacoesApagadas([notification("unrelated")], new Set(["capitulo-work-chapter"])).length, 1);
});

test("loader remoto usa exclusivamente a conta validada pelo chamador", async () => {
  const owners = [];
  const { carregarEstadoSupabaseNotificacoes } = loadApplicationModule(lib + "notificacoes-supabase-state-loader.ts", {
    "../../../lib/supabase/client": { supabase: {
      auth: { getUser: async () => ({ data: { user: { id: "B" } } }) },
      from: () => { const chain = { select: () => chain, eq: (key, value) => { if (key === "user_id") owners.push(value); return chain; }, limit: async () => ({ data: [], error: null }) }; return chain; },
    } },
  });
  const state = await carregarEstadoSupabaseNotificacoes(async owner => { owners.push(owner); return []; }, "A");
  assert.equal(state.userId, "A");
  assert.deepEqual(owners, ["A", "A", "A"]);
  assert.equal(await carregarEstadoSupabaseNotificacoes(async () => assert.fail("consulta sem conta"), ""), null);
});

test("resposta de mutação de uma conta antiga não altera estado, alertas ou exclusões", async t => {
  browser(t);
  const pending = deferred(), updates = [], responding = [], deletes = [];
  let active = true;
  const row = notification("request", { tipo: "solicitacao-seguidor", solicitacaoId: "00000000-0000-0000-0000-000000000001" });
  const { criarAcoesMutacaoNotificacoes } = loadApplicationModule(lib + "notificacoes-mutation-actions.ts", {
    "../../../lib/supabase/client": { supabase: { rpc: () => pending.promise } },
    "./notificacoes-supabase-sync": { apagarNotificacoesSupabase: (...args) => deletes.push(args) },
  });
  const actions = criarAcoesMutacaoNotificacoes({
    notificacoes: [row], notificacoesFiltradas: [row], usuarioNotificacoesId: "A", solicitacaoRespondendoId: "",
    usuarioVigente: () => active, atualizarNotificacoes: rows => updates.push(rows),
    fecharMenuNotificacao: () => updates.push("menu"), setSolicitacaoRespondendoId: id => responding.push(id),
  });
  const result = actions.responderSolicitacaoSeguidorNotificacao(row, true);
  active = false;
  pending.resolve({ data: "aceita", error: null }); await result;
  assert.deepEqual(updates, []);
  assert.deepEqual(responding, [row.solicitacaoId]);
  assert.deepEqual(deletes, []);
  assert.equal(local.carregarIdsNotificacoesApagadas("A").size, 0);
});


test("A→B→A invalida callbacks antigos mesmo voltando à mesma conta", async t => {
  const h = harness(t);
  await flush();
  const old = h.current("A");
  assert.equal(old(), true);
  await h.auth("B");
  await h.auth("A");
  assert.equal(old(), false);
  assert.equal(h.current("A")(), true);
  const writes = h.writes.length;
  const { criarAtualizadorNotificacoes } = loadApplicationModule(lib + "notificacoes-state-update-action.ts");
  const update = criarAtualizadorNotificacoes({
    usuarioNotificacoesId: "A", usuarioVigente: old,
    setNotificacoes: () => assert.fail("estado antigo"),
    definirNotificacoesNaoLidas: () => assert.fail("contador antigo"),
  });
  update([notification("old")]);
  assert.equal(h.writes.length, writes);
  h.unmount();
  assert.equal(h.current("A")(), false);
});

test("evento de conta durante getUser invalida a identificação inicial atrasada", async t => {
  const pending = deferred(); let call = 0;
  const h = harness(t, { getUser: () => ++call === 1 ? pending.promise : Promise.resolve({ data: { user: { id: "B" } }, error: null }) });
  await h.auth("B");
  pending.resolve({ data: { user: { id: "A" } }, error: null }); await flush();
  assert.deepEqual(h.calls, ["B"]);
  assert.equal(h.state.owner, "B");
  assert.deepEqual(ids(cached("A")), []);
});

for (const stage of ["works", "loadState", "directWorks"]) {
  test(`cancelamento durante ${stage} não continua a carga nem persiste`, async t => {
    const pending = deferred();
    const h = harness(t, { [stage]: () => pending.promise });
    await flush();
    h.unmount();
    const writes = h.writes.length;
    pending.resolve(stage === "loadState" ? { userId: "A", notificacoesDiretas: [] } : []);
    await flush();
    assert.equal(h.writes.length, writes);
    assert.deepEqual(h.state.rows, []);
    assert.equal(h.state.loading, true);
  });
}

test("estado remoto de conta divergente falha fechado com fallback da conta original", async t => {
  const h = harness(t, { loadState: async () => ({ userId: "B", notificacoesDiretas: [notification("private-B")] }) });
  local.salvarNotificacoes([notification("local-A")], "A");
  await flush();
  assert.equal(h.state.owner, "A");
  assert.deepEqual(ids(h.state.rows), ["local-A"]);
  assert.equal(h.state.count, 1);
  assert.deepEqual(ids(cached("A")), ["local-A"]);
});

test("leitura local recente acompanha a representação canônica sem contaminar recorrência", () => {
  const chapter = { tipo: "novo-capitulo", obraId: "work", capituloId: "chapter" };
  const initial = [notification("capitulo-work-chapter", { ...chapter, lida: true }), notification("old-event", { autorId: "actor", lida: true })];
  const current = initial.map(row => ({ ...row, lida: false }));
  const remote = [notification("novo-capitulo:chapter", { ...chapter, lida: true }), notification("new-event", { autorId: "actor", lida: true })];
  const rows = merge.preservarLeituraAlteradaDuranteCarga(remote, initial, current);
  assert.equal(rows[0].lida, false);
  assert.equal(rows[1].lida, true);
});

test("falha da fonte direta não descarta obras seguidas e IDs lidos obtidos", async () => {
  const { carregarEstadoSupabaseNotificacoes } = loadApplicationModule(lib + "notificacoes-supabase-state-loader.ts", {
    "../../../lib/supabase/client": { supabase: { from: table => {
      const chain = { select: () => chain, eq: () => chain, limit: async () => ({ data: table === "seguindo_obras" ? [{ obra_id: "work" }] : [{ notificacao_id: "read" }], error: null }) };
      return chain;
    } } },
  });
  const state = await carregarEstadoSupabaseNotificacoes(async () => { throw new Error("offline"); }, "A");
  assert.deepEqual(state, { userId: "A", obrasSeguidasIds: ["work"], notificacoesLidasIds: ["read"], notificacoesDiretas: [] });
});

for (const read of [true, false]) {
  test(`leitura local alterada para ${read} vence resposta antiga do mesmo ID`, () => {
    const initial = [notification("same", { lida: !read })];
    const current = [notification("same", { lida: read })];
    const rows = merge.preservarLeituraAlteradaDuranteCarga(merge.mesclarNotificacoes(current, initial), initial, current);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].lida, read);
  });
}

test("ações vigentes mantêm leitura/não lida e contador calculado da mesma lista", async t => {
  browser(t);
  let rows = [notification("same")], count = 1;
  const sync = [];
  const { criarAtualizadorNotificacoes } = loadApplicationModule(lib + "notificacoes-state-update-action.ts");
  const { criarAcoesMutacaoNotificacoes } = loadApplicationModule(lib + "notificacoes-mutation-actions.ts", {
    "../../../lib/supabase/client": { supabase: {} },
    "./notificacoes-supabase-sync": { sincronizarNotificacaoLidaSupabase: (...args) => sync.push(args) },
  });
  const update = criarAtualizadorNotificacoes({
    usuarioNotificacoesId: "A", usuarioVigente: () => true,
    setNotificacoes: next => { rows = next; }, definirNotificacoesNaoLidas: next => { count = next; },
  });
  const actions = () => criarAcoesMutacaoNotificacoes({
    notificacoes: rows, notificacoesFiltradas: rows, usuarioNotificacoesId: "A", solicitacaoRespondendoId: "",
    usuarioVigente: () => true, atualizarNotificacoes: update,
    fecharMenuNotificacao() {}, setSolicitacaoRespondendoId() {},
  });
  actions().marcarComoLida("same");
  assert.equal(count, 0);
  assert.equal(cached("A")[0].lida, true);
  actions().marcarComoNaoLida("same");
  assert.equal(count, 1);
  assert.equal(cached("A")[0].lida, false);
  assert.deepEqual(sync.map(([, read, owner]) => [read, owner]), [[true, "A"], [false, "A"]]);
});

test("callbacks obsoletos não iniciam mutações nem escrevem tombstones", async t => {
  browser(t);
  const forbidden = () => assert.fail("efeito de conta obsoleta");
  const { criarAcoesMutacaoNotificacoes } = loadApplicationModule(lib + "notificacoes-mutation-actions.ts", {
    "../../../lib/supabase/client": { supabase: { rpc: forbidden } },
    "./notificacoes-supabase-sync": new Proxy({}, { get: () => forbidden }),
  });
  const row = notification("same");
  const actions = criarAcoesMutacaoNotificacoes({
    notificacoes: [row], notificacoesFiltradas: [row], usuarioNotificacoesId: "A", solicitacaoRespondendoId: "",
    usuarioVigente: () => false, atualizarNotificacoes: forbidden,
    fecharMenuNotificacao: forbidden, setSolicitacaoRespondendoId: forbidden,
  });
  actions.marcarComoLida(row.id); actions.marcarComoNaoLida(row.id); actions.abrirNotificacao(row.id);
  actions.apagarNotificacao(row.id); actions.limparTodas(); actions.limparLidas();
  actions.marcarTodasComoLidas(); actions.marcarFiltradasComoLidas();
  await actions.responderSolicitacaoSeguidorNotificacao(row, true);
  assert.equal(local.carregarIdsNotificacoesApagadas("A").size, 0);
});

test("rejeição de solicitação atrasada não mostra alerta na conta nova", async t => {
  browser(t);
  const pending = deferred(); let active = true;
  const row = notification("request", { solicitacaoId: "00000000-0000-0000-0000-000000000001" });
  const { criarAcoesMutacaoNotificacoes } = loadApplicationModule(lib + "notificacoes-mutation-actions.ts", {
    "../../../lib/supabase/client": { supabase: { rpc: () => pending.promise } },
    "./notificacoes-supabase-sync": {},
  });
  const actions = criarAcoesMutacaoNotificacoes({
    notificacoes: [row], notificacoesFiltradas: [row], usuarioNotificacoesId: "A", solicitacaoRespondendoId: "",
    usuarioVigente: () => active, atualizarNotificacoes: () => assert.fail("atualização obsoleta"),
    fecharMenuNotificacao() {}, setSolicitacaoRespondendoId() {},
  });
  const result = actions.responderSolicitacaoSeguidorNotificacao(row, true);
  active = false;
  pending.reject(new Error("falha atrasada")); await result;
  assert.equal(local.carregarIdsNotificacoesApagadas("A").size, 0);
});

test("ausência de sessão redireciona sem duplicar carga no INITIAL_SESSION anônimo", async t => {
  const h = harness(t, { getUser: async () => ({ data: { user: null }, error: null }) });
  await flush();
  await h.auth("", "INITIAL_SESSION");
  assert.equal(h.state.redirects.length, 1);
  assert.match(h.state.redirects[0], /^\/login\?/);
  assert.equal(h.state.loading, true);
  assert.equal(h.calls.length, 0);
  assert.equal(h.writes.length, 0);
});
