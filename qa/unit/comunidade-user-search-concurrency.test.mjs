import assert from "node:assert/strict";
import test from "node:test";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const A = "10000000-0000-0000-0000-000000000001";
const B = "10000000-0000-0000-0000-000000000002";
const X = "20000000-0000-0000-0000-000000000001";
const Y = "20000000-0000-0000-0000-000000000002";
const user = (id, nome = "Ana") => ({ id, nome, username: "", avatar: "" });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
async function flush() { for (let i = 0; i < 25; i++) await Promise.resolve(); }
const sameDeps = (a, b) => a?.length === b?.length && a.every((value, i) => Object.is(value, b[i]));
function harness(t, options = {}) {
  const previous = globalThis.window, timers = new Map(), slots = [], effects = [];
  let index = 0, time = 0, timerId = 0, mounted = true;
  globalThis.window = {
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, due: time + delay }); return timerId; },
    clearTimeout: id => timers.delete(id),
  };
  const react = {
    useState(initial) {
      const i = index++;
      if (!slots[i]) slots[i] = { value: typeof initial === "function" ? initial() : initial };
      slots[i].set ??= update => { slots[i].value = typeof update === "function" ? update(slots[i].value) : update; };
      return [slots[i].value, slots[i].set];
    },
    useRef(initial) { const i = index++; return (slots[i] ??= { current: initial }); },
    useMemo(fn, deps) {
      const i = index++;
      if (!sameDeps(slots[i]?.deps, deps)) slots[i] = { value: fn(), deps };
      return slots[i].value;
    },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const i = index++;
      if (!sameDeps(slots[i]?.deps, deps)) {
        const old = slots[i]; slots[i] = { deps, cleanup: old?.cleanup };
        effects.push(() => { old?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  const stateModule = loadApplicationModule("app/comunidade/hooks/use-comunidade-user-search-follow-state.ts", { react });
  const calls = [], followCalls = [], feedback = [], errors = [];
  const syncModule = loadApplicationModule("app/comunidade/hooks/use-comunidade-user-search-sync.ts", {
    react,
    "../components/community-supabase-user-search": { buscarUsuariosComunidadeSupabase: term => { calls.push(term); return (options.search ?? (async () => []))(term); } },
    "../components/community-supabase-followed-users-loader": { carregarUsuariosSeguidosComunidade: owner => { followCalls.push(owner); return (options.followed ?? (async () => []))(owner); } },
  });
  const actionModule = loadApplicationModule("app/comunidade/components/community-search-follow-action.ts", {
    "./community-follow-user-saver": { salvarSeguindoUsuarioComunidade: (...args) => (options.save ?? (async () => ({ ok: true, estado: "seguindo" })))(...args) },
    "./community-action-feedback-toast": { emitirFeedbackAcao: (_set, _ref, text) => feedback.push(text) },
  });
  const auth = { current: 1 }, locks = { current: new Set() };
  let props = { usuarioId: A, termoBusca: "Ana", posts: [], ...options.props }, state;
  function render(update = {}, commit = true) {
    props = { ...props, ...update }; index = 0;
    state = stateModule.useComunidadeUserSearchFollowState({ usuarioId: props.usuarioId, termoBusca: props.termoBusca, versaoAutenticacao: auth.current, autenticacaoComunidadeVersaoRef: auth });
    syncModule.useComunidadeUserSearchSync({
      ...state, ...props, termoBuscaAdiado: props.termoBusca,
      autenticacaoComunidadeVersaoRef: auth,
    });
    if (commit) effects.splice(0).forEach(fn => fn());
    return state;
  }
  function unmount() { mounted = false; ++auth.current; slots.forEach(slot => slot?.cleanup?.()); }
  t.after(() => { if (mounted) unmount(); globalThis.window = previous; });
  render(); state.setBuscaComunidadeAberta(true); render();
  return {
    render, calls, followCalls, feedback, errors, auth, locks, unmount,
    view: () => render(),
    async tick(ms = 0) {
      time += ms;
      for (;;) {
        const next = [...timers].filter(([, timer]) => timer.due <= time).sort((a, b) => a[1].due - b[1].due)[0];
        if (!next) break;
        timers.delete(next[0]); next[1].fn(); await flush();
      }
      await flush();
    },
    switchAccount(id) { ++auth.current; locks.current.clear(); return render({ usuarioId: id }); },
    follow(id) {
      const snapshot = render();
      return actionModule.alternarSeguirUsuarioBuscaComunidade({
        ...snapshot, usuarioAlvo: user(id), usuario: props.usuarioId ? { id: props.usuarioId } : null,
        exigirLogin: () => Boolean(props.usuarioId), acoesComunidadeRef: locks,
        setErro: message => errors.push(message), setFeedbackAcao() {}, feedbackTimerRef: { current: null },
      });
    },
  };
}

test("digitação rápida mantém só a última consulta após 220ms", async t => {
  const h = harness(t);
  h.render({ termoBusca: "An" }); await h.tick(100);
  h.render({ termoBusca: "Ana" }); await h.tick(219);
  assert.deepEqual(h.calls, []);
  await h.tick(1); assert.deepEqual(h.calls, ["Ana"]);
});

test("resultados anteriores somem já no render do novo termo, antes do debounce", async t => {
  const h = harness(t, { search: async () => [user(X)] });
  await h.tick(220); assert.equal(h.view().usuariosBuscaComunidade.length, 1);
  const view = h.render({ termoBusca: "Beatriz" }, false);
  assert.deepEqual(view.usuariosBuscaComunidade, []);
  assert.equal(view.carregandoUsuariosBuscaComunidade, true);
});

test("respostas fora de ordem não substituem a busca vigente nem encerram seu loading", async t => {
  const old = deferred(), fresh = deferred();
  const h = harness(t, { search: term => term === "Ana" ? old.promise : fresh.promise });
  await h.tick(220); h.render({ termoBusca: "Bia" }); await h.tick(220);
  old.resolve([user(X)]); await flush();
  assert.equal(h.view().carregandoUsuariosBuscaComunidade, true);
  fresh.resolve([user(Y, "Bia")]); await flush();
  assert.deepEqual(h.view().usuariosBuscaComunidade.map(row => row.id), [Y]);
});

test("busca em voo é invalidada por logout e nova busca usa contexto visitante", async t => {
  const old = deferred(); let attempt = 0;
  const h = harness(t, { search: () => ++attempt === 1 ? old.promise : Promise.resolve([user(Y)]) });
  await h.tick(220); h.switchAccount(undefined);
  old.resolve([user(X)]); await flush();
  assert.deepEqual(h.view().usuariosBuscaComunidade, []);
  await h.tick(220);
  assert.deepEqual(h.view().usuariosBuscaComunidade.map(row => row.id), [Y]);
});

test("troca de conta não reutiliza resultados nem IDs seguidos anteriores", async t => {
  const pending = deferred();
  const h = harness(t, { search: async () => [user(X)], followed: owner => owner === A ? Promise.resolve([X]) : pending.promise });
  await h.tick(220);
  assert.deepEqual(h.view().usuariosSeguidosIds, [X]);
  const view = h.switchAccount(B);
  assert.deepEqual(view.usuariosSeguidosIds, []);
  assert.deepEqual(view.usuariosBuscaComunidade, []);
  pending.resolve([Y]); await flush();
  assert.deepEqual(h.view().usuariosSeguidosIds, [Y]);
});

test("fechar busca e desmontar cancelam timers e respostas", async t => {
  const pending = deferred();
  const h = harness(t, { search: () => pending.promise });
  await h.tick(220);
  h.view().setBuscaComunidadeAberta(false); h.render();
  pending.resolve([user(X)]); await h.tick();
  assert.deepEqual(h.view().usuariosBuscaComunidade, []);
  h.unmount(); const calls = h.calls.length; await h.tick(220);
  assert.equal(h.calls.length, calls);
});

test("falha de busca não conserva resultados antigos e recupera no próximo termo", async t => {
  const h = harness(t, { search: async term => { if (term === "Falha") throw new Error("rede"); return [user(X)]; } });
  await h.tick(220);
  h.render({ termoBusca: "Falha" }); await h.tick(220);
  assert.deepEqual(h.view().usuariosBuscaComunidade, []);
  assert.equal(h.view().carregandoUsuariosBuscaComunidade, false);
  h.render({ termoBusca: "Ana" }); await h.tick(220);
  assert.deepEqual(h.view().usuariosBuscaComunidade.map(row => row.id), [X]);
});

test("snapshot inicial de seguimento não desfaz ação local posterior", async t => {
  const pending = deferred(), save = deferred();
  const h = harness(t, { followed: () => pending.promise, save: () => save.promise });
  const operation = h.follow(X);
  assert.deepEqual(h.view().usuariosSeguidosIds, [X]);
  pending.resolve([Y]); await flush();
  assert.deepEqual(new Set(h.view().usuariosSeguidosIds), new Set([X, Y]));
  save.resolve({ ok: true, estado: "seguindo" }); await operation;
});

test("falha de um follow não desfaz sucesso concorrente de outro alvo", async t => {
  const first = deferred(), second = deferred();
  const h = harness(t, { save: (_owner, target) => target === X ? first.promise : second.promise });
  await flush();
  const op1 = h.follow(X), op2 = h.follow(Y);
  second.resolve({ ok: true, estado: "seguindo" }); await op2;
  first.resolve({ ok: false, erro: "falhou" }); await op1;
  assert.deepEqual(h.view().usuariosSeguidosIds, [Y]);
  assert.deepEqual(h.errors, ["", "falhou"]);
});

test("exceção no follow reverte só o alvo, libera lock e permite recuperação", async t => {
  let attempts = 0;
  const h = harness(t, { save: async () => { if (++attempts === 1) throw new Error("rede"); return { ok: true, estado: "seguindo" }; } });
  await flush();
  await h.follow(X);
  assert.deepEqual(h.view().usuariosSeguidosIds, []);
  assert.equal(h.locks.current.size, 0);
  assert.equal(h.errors.length, 1);
  await h.follow(X); assert.deepEqual(h.view().usuariosSeguidosIds, [X]);
});

test("follow atrasado de A não muda lista, feedback ou lock da conta B", async t => {
  const old = deferred(), fresh = deferred(); let attempt = 0;
  const h = harness(t, { save: () => ++attempt === 1 ? old.promise : fresh.promise });
  await flush();
  const op1 = h.follow(X); h.switchAccount(B); await flush();
  const op2 = h.follow(X);
  old.resolve({ ok: true, estado: "seguindo" }); await op1;
  assert.equal(h.feedback.length, 0);
  assert.equal(h.locks.current.has(`seguir-usuario:${X}`), true);
  assert.equal(h.view().usuarioSeguindoId, X);
  fresh.resolve({ ok: true, estado: "seguindo" }); await op2;
  assert.equal(h.feedback.length, 1);
});

test("A→B→A não aceita a primeira resposta de A e refaz apenas a busca vigente", async t => {
  const old = deferred(); let attempt = 0;
  const h = harness(t, { search: () => ++attempt === 1 ? old.promise : Promise.resolve([user(Y)]) });
  await h.tick(220);
  h.switchAccount(B); h.switchAccount(A);
  old.resolve([user(X)]); await flush();
  assert.deepEqual(h.view().usuariosBuscaComunidade, []);
  await h.tick(220);
  assert.deepEqual(h.view().usuariosBuscaComunidade.map(row => row.id), [Y]);
  assert.deepEqual(h.calls, ["Ana", "Ana"]);
});

test("voltar ao termo anterior não ressuscita a lista de uma execução antiga", async t => {
  const h = harness(t, { search: async () => [user(X)] });
  await h.tick(220);
  h.render({ termoBusca: "Bia" }); h.render({ termoBusca: "Ana" });
  assert.deepEqual(h.view().usuariosBuscaComunidade, []);
  assert.equal(h.view().carregandoUsuariosBuscaComunidade, true);
});

test("versão invalidada bloqueia respostas antes mesmo do cleanup dos efeitos", async t => {
  const pending = deferred();
  const h = harness(t, { search: () => pending.promise });
  await h.tick(220);
  ++h.auth.current;
  pending.resolve([user(X)]); await flush();
  assert.deepEqual(h.render({}, false).usuariosBuscaComunidade, []);
});

test("termo curto e busca fechada não consultam perfis", async t => {
  const h = harness(t, { props: { termoBusca: "@A" } });
  await h.tick(220); assert.deepEqual(h.calls, []);
  h.view().setBuscaComunidadeAberta(false); h.render({ termoBusca: "Ana" });
  await h.tick(220); assert.deepEqual(h.calls, []);
});

test("falha de carga de seguidos é tratada e a próxima conta recupera", async t => {
  const h = harness(t, { followed: async owner => { if (owner === A) throw new Error("rede"); return [Y]; } });
  await flush(); assert.deepEqual(h.view().usuariosSeguidosIds, []);
  h.switchAccount(B); await flush();
  assert.deepEqual(h.view().usuariosSeguidosIds, [Y]);
});

test("deixar de seguir confirmado prevalece sobre snapshot inicial atrasado", async t => {
  const pending = deferred();
  const h = harness(t, { followed: () => pending.promise, save: async () => ({ ok: true, estado: "nenhum" }) });
  h.view().setUsuariosSeguidosIds([X]); h.render();
  await h.follow(X);
  pending.resolve([X, Y]); await flush();
  assert.deepEqual(h.view().usuariosSeguidosIds, [Y]);
});

test("rollback usa confirmação inicial obtida durante a escrita sem apagar outro alvo", async t => {
  const pending = deferred(), save = deferred();
  const h = harness(t, { followed: () => pending.promise, save: () => save.promise });
  const operation = h.follow(X);
  pending.resolve([X, Y]); await flush();
  save.resolve({ ok: false, erro: "falhou" }); await operation;
  assert.deepEqual(new Set(h.view().usuariosSeguidosIds), new Set([X, Y]));
});

test("solicitação privada não aparece como seguimento aceito", async t => {
  const h = harness(t, { save: async () => ({ ok: true, estado: "solicitado" }) });
  await flush(); await h.follow(X);
  assert.deepEqual(h.view().usuariosSeguidosIds, []);
  assert.deepEqual(h.feedback, ["Solicitação para seguir Ana enviada."]);
});

test("segundo acionamento do mesmo alvo em voo não duplica escrita", async t => {
  const pending = deferred(); let writes = 0;
  const h = harness(t, { save: () => { ++writes; return pending.promise; } });
  await flush();
  const first = h.follow(X); await h.follow(X);
  assert.equal(writes, 1);
  pending.resolve({ ok: true, estado: "seguindo" }); await first;
  assert.equal(h.locks.current.size, 0);
});

test("erro de follow após logout não restaura lista nem mostra feedback antigo", async t => {
  const pending = deferred();
  const h = harness(t, { save: () => pending.promise });
  await flush(); const operation = h.follow(X);
  h.switchAccount(undefined); pending.reject(new Error("atrasado")); await operation;
  assert.deepEqual(h.view().usuariosSeguidosIds, []);
  assert.deepEqual(h.errors, []); assert.deepEqual(h.feedback, []);
});

test("falha remota usa somente autores dos posts já disponíveis, com recuperação", async t => {
  const post = { autorId: X, autorNome: "Ana local", autorAvatar: "", comentarios: [] };
  const h = harness(t, { props: { posts: [post] }, search: async term => {
    if (term === "Ana") throw new Error("rede");
    return [user(Y, "Bia")];
  } });
  await h.tick(220);
  assert.deepEqual(h.view().usuariosBuscaComunidade.map(row => row.id), [X]);
  h.render({ termoBusca: "Bia" }); await h.tick(220);
  assert.deepEqual(h.view().usuariosBuscaComunidade.map(row => row.id), [Y]);
});

test("SDK preserva consultas limitadas, falha parcial, IDs e recuperação sem consulta ampla", async () => {
  const calls = []; let failAll = true;
  const { buscarUsuariosComunidadeSupabase } = loadApplicationModule("app/comunidade/components/community-supabase-user-search.ts", {
    "../../../lib/supabase/client": { supabase: { from: table => ({ select: fields => ({ ilike: (column, pattern) => ({ limit: async limit => {
      calls.push({ table, fields, column, pattern, limit });
      return failAll || column === "nome"
        ? { data: null, error: { message: "indisponível" } }
        : { data: [{ id: X, user_id: Y, nome: "Ana remota", username: "ana", avatar_url: "" }], error: null };
    } }) }) }) } },
  });
  assert.deepEqual(await buscarUsuariosComunidadeSupabase("Ana"), []);
  failAll = false;
  assert.deepEqual((await buscarUsuariosComunidadeSupabase("Ana")).map(row => row.id), [Y]);
  assert.equal(calls.length, 4);
  assert.deepEqual(new Set(calls.map(c => c.table)), new Set(["profiles"]));
  assert.deepEqual(new Set(calls.map(c => c.fields)), new Set(["id,user_id,nome,avatar_url", "id,user_id,nome,avatar_url,username"]));
  assert.ok(calls.every(c => c.pattern === "%Ana%" && c.limit === 20));
  await buscarUsuariosComunidadeSupabase("@a"); assert.equal(calls.length, 4);
});

test("adaptador não entrega à conta B a promessa de relacionamento iniciada por A", async () => {
  const pending = deferred(), calls = []; let owner = A;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: owner } }, error: null }) },
    from: () => {
      const chain = { select: () => chain, eq: () => chain, delete: () => chain,
        maybeSingle: async () => ({ data: null, error: null }),
        then: resolve => Promise.resolve({ data: [], error: null }).then(resolve) };
      return chain;
    },
    rpc: name => { calls.push([owner, name]); return pending.promise; },
  };
  const { salvarSeguindoUsuarioComunidade } = loadApplicationModule("app/comunidade/components/community-follow-user-saver.ts", {
    "./supabase/client": { supabase: client },
  });
  const contextA = { usuarioId: A, vigente: () => true };
  const contextB = { usuarioId: B, vigente: () => true };
  const first = salvarSeguindoUsuarioComunidade(A, X, true, contextA); await flush();
  assert.deepEqual(calls, [[A, "solicitar_ou_seguir_usuario"]]);
  owner = B;
  const second = salvarSeguindoUsuarioComunidade(B, X, true, contextB);
  pending.resolve({ data: "seguindo", error: null });
  assert.equal((await first).ok, true);
  assert.equal((await second).ok, false);
  assert.equal(calls.length, 1);
  assert.equal((await salvarSeguindoUsuarioComunidade(B, X, true, contextB)).ok, true);
  assert.deepEqual(calls[1], [B, "solicitar_ou_seguir_usuario"]);
});


test("adaptador não reaproveita operação anterior de A após A→B→A", async () => {
  const pending = deferred();
  const { salvarSeguindoUsuarioComunidade } = loadApplicationModule("app/comunidade/components/community-follow-user-saver.ts", {
    "../../../lib/historietasPrivacy": {
      solicitarOuSeguirUsuario: () => pending.promise,
      deixarDeSeguirUsuario: () => pending.promise,
    },
  });
  const old = { usuarioId: A, vigente: () => true };
  const current = { usuarioId: A, vigente: () => true };
  const first = salvarSeguindoUsuarioComunidade(A, X, true, old);
  const second = salvarSeguindoUsuarioComunidade(A, X, true, current);
  pending.resolve({ ok: true, estado: "seguindo", erro: "" });
  assert.equal((await first).ok, true);
  assert.equal((await second).ok, false);
});
