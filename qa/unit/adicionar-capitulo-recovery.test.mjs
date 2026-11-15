import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const A = "10000000-0000-0000-0000-000000000001", B = "10000000-0000-0000-0000-000000000002";
const W = "20000000-0000-0000-0000-000000000001";
const TEXT = "Este é um texto completo com conteúdo suficiente para o capítulo.";
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
async function flush() { for (let i = 0; i < 30; i++) await Promise.resolve(); }
const same = (a, b) => a?.length === b?.length && a.every((value, i) => Object.is(value, b[i]));
function browser(t) {
  const old = { window: globalThis.window, localStorage: globalThis.localStorage };
  const store = new Map();
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value),
    get length() { return store.size; }, key: index => [...store.keys()][index] ?? null };
  globalThis.window = { scrollTo() {}, dispatchEvent() {} };
  t.after(() => Object.assign(globalThis, old));
  return store;
}
function harness(t, options = {}) {
  const storage = options.storage ?? browser(t), rows = options.rows ?? new Map();
  const calls = { inserts: [], reads: [], diary: [], notifications: [], cache: [], redirects: [], author: [] };
  const refs = [], effects = [], listeners = new Set(); let index = 0, owner = A, output, mounted = true;
  const state = { titulo: "Primeiro capítulo", texto: TEXT, erro: "", criado: null, notificacao: null, processando: false };
  const lock = { current: false }, revision = { current: 0 };
  let props = { obraAtual: { id: W, autorId: A, autor: "Autora", titulo: "Obra", slug: "obra", publicado: true, capitulos: [] }, obraId: W, usuarioIdLogado: A, ...options.props };
  const react = {
    useRef(value) { return (refs[index++] ??= { current: value }); },
    useState(value) {
      const i = index++; refs[i] ??= { value: typeof value === "function" ? value() : value };
      refs[i].set ??= next => { refs[i].value = typeof next === "function" ? next(refs[i].value) : next; };
      return [refs[i].value, refs[i].set];
    },
    useEffect(fn, deps) {
      const i = index++, old = refs[i];
      if (!same(old?.deps, deps)) { refs[i] = { deps, cleanup: old?.cleanup }; effects.push(() => { old?.cleanup?.(); refs[i].cleanup = fn(); }); }
    },
  };
  function query(table) {
    const filters = {}, q = { action: "read", payload: null };
    const result = async () => {
      if (q.action === "insert") {
        calls.inserts.push(q.payload);
        if (options.insert) return options.insert(q.payload, rows);
        if ([...rows.values()].some(row => row.obra_id === q.payload.obra_id && row.ordem === q.payload.ordem)) return { data: null, error: { code: "23505", message: "capitulos_obra_id_ordem_key" } };
        const row = { ...q.payload, id: q.payload.id || `30000000-0000-0000-0000-${String(rows.size + 1).padStart(12, "0")}`, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" };
        rows.set(row.id, row); return { data: row, error: null };
      }
      calls.reads.push([table, { ...filters }]);
      if (table === "obras") return { data: { id: W }, error: null };
      if (filters.id) return options.read ? options.read(filters.id, rows) : { data: rows.get(filters.id) ?? null, error: null };
      return { data: { ordem: Math.max(0, ...[...rows.values()].map(row => row.ordem)) }, error: null };
    };
    const chain = { select: () => chain, eq: (key, value) => { filters[key] = value; return chain; }, order: () => chain, limit: () => chain,
      insert: payload => { q.action = "insert"; q.payload = payload; return chain; },
      single: () => chain, maybeSingle: () => chain, retry: enabled => { assert.equal(enabled, false); return chain; },
      then: (yes, no) => result().then(yes, no) };
    return chain;
  }
  const { useAdicionarCapituloCreateAction: runHook } = loadApplicationModule("app/adicionar-capitulo/hooks/useAdicionarCapituloCreateAction.ts", {
    react,
    "../../../lib/supabase/client": { supabase: { from: options.queryClient ? options.queryClient.from.bind(options.queryClient) : query, auth: {
      getUser: options.auth ?? (async () => ({ data: { user: { id: owner } }, error: null })),
      onAuthStateChange: cb => { listeners.add(cb); return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } }; },
    } } },
    "../actions/carregar-nome-profile-adicionar-capitulo": { carregarNomeProfileAdicionarCapitulo: async () => "Autora" },
    "../actions/sincronizar-autor-obra-profile-adicionar-capitulo": { sincronizarAutorObraProfileAdicionarCapitulo: (...args) => calls.author.push(args) },
    "../actions/registrar-diario-novo-capitulo": { registrarDiarioNovoCapitulo: async params => calls.diary.push(params) },
    "../actions/registrar-notificacoes-novo-capitulo-supabase": { registrarNotificacoesNovoCapituloSupabase: async params => calls.notifications.push(params) },
    "../lib/adicionar-capitulo-local-work-storage": { carregarObrasLocais: () => calls.cache.at(-1) ?? [props.obraAtual] },
  });
  const setters = Object.fromEntries([["setTitulo", "titulo"], ["setTexto", "texto"], ["setErro", "erro"], ["setProcessando", "processando"], ["setCapituloCriado", "criado"], ["setNotificacaoCriada", "notificacao"]].map(([key, field]) => [key, value => { state[field] = typeof value === "function" ? value(state[field]) : value; }]));
  function render(update = {}) {
    props = { ...props, ...update }; index = 0;
    output = runHook({ ...props, titulo: state.titulo, texto: state.texto, obras: [props.obraAtual], numeroNovoCapitulo: 1,
      processando: state.processando, criandoCapituloRef: lock, edicaoRascunhoRef: revision,
      router: { replace: href => calls.redirects.push(href) }, ...setters,
      salvarObras: works => { if (options.cacheFailure?.()) throw new Error("quota local"); calls.cache.push(works); },
      setArquivoImportadoNome() {}, setArquivoImportadoErro() {},
    });
    effects.splice(0).forEach(fn => fn());
    return output;
  }
  function unmount() { mounted = false; refs.forEach(ref => ref?.cleanup?.()); }
  t.after(() => { if (mounted) unmount(); });
  render();
  return { state, calls, rows, storage, render, unmount,
    submit: () => render().criarCapitulo({ preventDefault() {} }),
    get action() { return output; },
    edit(titulo, texto) { ++revision.current; Object.assign(state, { titulo, texto }); render(); },
    account(id) { owner = id; listeners.forEach(cb => cb(id ? "SIGNED_IN" : "SIGNED_OUT", id ? { user: { id } } : null)); },
  };
}

test("clique duplo em voo faz um único INSERT e efeitos uma vez", async t => {
  const pending = deferred();
  const h = harness(t, { auth: () => pending.promise });
  const first = h.submit(); await h.submit();
  pending.resolve({ data: { user: { id: A } }, error: null }); await first;
  assert.equal(h.calls.inserts.length, 1); assert.equal(h.calls.diary.length, 1); assert.equal(h.calls.notifications.length, 1);
  assert.equal(h.state.texto, ""); assert.equal(h.state.titulo, "");
});

test("callback antigo depois de sucesso não cria outro capítulo", async t => {
  const h = harness(t), action = h.action;
  await action.criarCapitulo({ preventDefault() {} });
  await action.criarCapitulo({ preventDefault() {} });
  assert.equal(h.calls.inserts.length, 1);
});

test("resposta perdida após commit bloqueia INSERT posterior e recupera pelo ID", async t => {
  const h = harness(t, { insert: (payload, rows) => {
    const row = { ...payload, id: payload.id || "30000000-0000-0000-0000-000000000001", tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" };
    rows.set(row.id, row); return { data: null, error: { code: "", message: "Failed to fetch" } };
  } });
  await h.submit(); await h.submit();
  assert.equal(h.calls.inserts.length, 1);
  assert.equal(h.state.texto, TEXT);
  await h.action.verificarCriacao();
  assert.equal(h.state.criado.id, h.calls.inserts[0].id);
  assert.equal(h.calls.diary.length, 0); assert.equal(h.calls.notifications.length, 0);
});

test("retorno vazio sem erro não confirma criação nem limpa o texto", async t => {
  const h = harness(t, { insert: async () => ({ data: null, error: null }) });
  await h.submit();
  assert.equal(h.state.criado, null); assert.equal(h.state.texto, TEXT);
  assert.equal(h.calls.diary.length, 0); assert.equal(h.calls.notifications.length, 0);
  await h.submit(); assert.equal(h.calls.inserts.length, 1);
});

test("representação de outro autor falha fechada e mantém rascunho", async t => {
  const h = harness(t, { insert: async payload => ({ data: { ...payload, user_id: B, id: payload.id || B, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" }, error: null }) });
  await h.submit(); assert.equal(h.state.criado, null); assert.equal(h.state.texto, TEXT);
  assert.equal(h.calls.diary.length, 0);
});

test("falha de cache depois do commit não libera outro INSERT nem repete efeitos", async t => {
  let fail = true;
  const h = harness(t, { cacheFailure: () => fail });
  await h.submit(); await h.submit();
  assert.equal(h.calls.inserts.length, 1); assert.equal(h.state.texto, TEXT);
  fail = false; await h.action.verificarCriacao();
  assert.equal(h.state.criado.id, h.calls.inserts[0].id);
  assert.ok(h.calls.diary.length <= 1); assert.ok(h.calls.notifications.length <= 1);
});

test("edição posterior à submissão não é apagada pela resposta anterior", async t => {
  const pending = deferred();
  const h = harness(t, { insert: async payload => { await pending.promise; return { data: { ...payload, id: payload.id || A, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" }, error: null }; } });
  const operation = h.submit(); await flush();
  h.edit("Novo rascunho", "Um segundo texto que deve ser preservado integralmente.");
  pending.resolve(); await operation;
  assert.equal(h.state.titulo, "Novo rascunho"); assert.match(h.state.texto, /segundo texto/);
});

test("troca de conta durante identificação impede continuar a escrita", async t => {
  const pending = deferred();
  const h = harness(t, { auth: () => pending.promise });
  const operation = h.submit(); h.account(B);
  pending.resolve({ data: { user: { id: A } }, error: null }); await operation;
  assert.equal(h.calls.inserts.length, 0); assert.equal(h.calls.cache.length, 0); assert.equal(h.state.texto, TEXT);
});

test("usuário autenticado diferente da página não recebe o texto da conta anterior", async t => {
  const h = harness(t, { props: { obraAtual: { id: W, autor: "A", capitulos: [] } } });
  h.account(B); await h.submit();
  assert.equal(h.calls.inserts.length, 0); assert.equal(h.calls.author.length, 0);
});

test("conflito de ordem é rejeição definitiva; somente nova ação recalcula a posição", async t => {
  let attempt = 0;
  const h = harness(t, { insert: (payload, rows) => {
    if (++attempt === 1) { rows.set(B, { ordem: 1, obra_id: W }); return { data: null, error: { code: "23505", message: "capitulos_obra_id_ordem_key" } }; }
    return { data: { ...payload, id: payload.id || A, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" }, error: null };
  } });
  await h.submit(); assert.equal(h.calls.inserts.length, 1); assert.equal(h.state.texto, TEXT);
  await h.submit(); assert.equal(h.calls.inserts.length, 2); assert.equal(h.calls.inserts[1].ordem, 2);
  assert.equal(h.calls.diary.length, 1); assert.equal(h.calls.notifications.length, 1);
});

test("Diário não repete INSERT quando o erro pode ser uma resposta perdida", async () => {
  const calls = [];
  const { registrarDiarioNovoCapitulo } = loadApplicationModule("app/adicionar-capitulo/actions/registrar-diario-novo-capitulo.ts", {
    "../../../lib/supabase/client": { supabase: { from: () => ({ insert: async payload => { calls.push(payload); return { error: { message: "Failed to fetch", code: "" } }; } }) } },
  });
  await registrarDiarioNovoCapitulo({ userId: A, obra: { id: W, titulo: "Obra", slug: "obra", publicado: true }, capitulo: { id: A, titulo: "Capítulo" }, numeroCapitulo: 1, criadoEm: "2026-11-13T12:00:00Z" });
  assert.equal(calls.length, 1);
});

test("reload conserva a tentativa incerta e o UUID: somente GET pode recuperá-la", async t => {
  const rows = new Map();
  const h1 = harness(t, { rows, insert: (payload, saved) => {
    saved.set(payload.id, { ...payload, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" });
    return { data: null, error: { message: "resposta perdida" } };
  } });
  await h1.submit(); h1.unmount();
  const h2 = harness(t, { rows, storage: h1.storage }); await flush();
  await h2.submit(); assert.equal(h2.calls.inserts.length, 0);
  await h2.action.verificarCriacao();
  assert.equal(h2.state.criado.id, h1.calls.inserts[0].id);
  assert.equal(h2.state.texto, TEXT);
  assert.equal(h2.calls.diary.length, 0); assert.equal(h2.calls.notifications.length, 0);
});

test("consulta negativa não libera envio: o INSERT original ainda pode concluir", async t => {
  const h = harness(t, { insert: async () => ({ data: null, error: { message: "timeout" } }) });
  await h.submit(); await h.action.verificarCriacao(); await h.submit();
  assert.equal(h.calls.inserts.length, 1); assert.equal(h.state.criado, null);
  assert.equal(h.render().recuperacaoPendente, true);
  assert.equal(h.state.texto, TEXT);
});

test("falha da leitura de recuperação não limpa o rascunho nem autoriza POST", async t => {
  const h = harness(t, { insert: async () => ({ data: null, error: { message: "timeout" } }), read: async () => ({ data: null, error: { code: "42501", message: "negado" } }) });
  await h.submit(); await h.action.verificarCriacao(); await h.submit();
  assert.equal(h.calls.inserts.length, 1); assert.equal(h.state.texto, TEXT);
});

test("falha no registro local antes do envio impede INSERT", async t => {
  const h = harness(t);
  globalThis.localStorage.setItem = () => { throw new Error("quota"); };
  await h.submit();
  assert.equal(h.calls.inserts.length, 0); assert.equal(h.state.texto, TEXT);
});

test("journal malformado falha fechado sem sobrescrever o registro original", async t => {
  const h = harness(t); h.unmount();
  const key = `historietas-adicionar-capitulo-tentativa:v1:${A}:${W}:${B}`;
  h.storage.set(key, "{incompleto");
  const next = harness(t, { storage: h.storage }); await flush(); await next.submit();
  assert.equal(next.calls.inserts.length, 0); assert.equal(h.storage.get(key), "{incompleto");
});

test("duas telas concorrentes preservam tentativas separadas e a ordem única", async t => {
  const rows = new Map();
  const first = harness(t, { rows });
  const second = harness(t, { rows, storage: first.storage });
  await Promise.all([first.submit(), second.submit()]);
  assert.equal(rows.size, 1);
  const ids = [...first.calls.inserts, ...second.calls.inserts].map(payload => payload.id);
  assert.equal(new Set(ids).size, ids.length);
  const { listarTentativasCriacao } = loadApplicationModule("app/adicionar-capitulo/lib/adicionar-capitulo-create-recovery.ts");
  assert.ok(listarTentativasCriacao(A, W).some(item => item.fase === "concluida"));
});

test("outra tela não apaga o recibo incerto de um INSERT já enviado", async t => {
  const rows = new Map(), pending = deferred();
  const first = harness(t, { rows, insert: async payload => {
    rows.set(payload.id, { ...payload, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" });
    await pending.promise; return { data: null, error: { message: "perdida" } };
  } });
  const second = harness(t, { rows, storage: first.storage });
  const operation = first.submit(); await flush();
  await second.submit(); assert.equal(second.calls.inserts.length, 0);
  pending.resolve(); await operation;
  second.unmount();
  const next = harness(t, { rows, storage: first.storage }); await flush();
  await next.action.verificarCriacao();
  assert.equal(next.state.criado.id, first.calls.inserts[0].id);
  assert.equal(next.calls.inserts.length, 0);
});

test("estado de leitura e cache não duplicam o capítulo ao verificar duas vezes", async t => {
  const h = harness(t); await h.submit();
  await h.action.verificarCriacao(); await h.action.verificarCriacao();
  const chapters = h.calls.cache.at(-1)[0].capitulos;
  assert.equal(chapters.filter(chapter => chapter.id === h.calls.inserts[0].id).length, 1);
  assert.equal(h.calls.diary.length, 1); assert.equal(h.calls.notifications.length, 1);
});

test("nova criação exige intenção explícita e mantém o próximo rascunho", async t => {
  const h = harness(t); await h.submit();
  h.edit("Próximo capítulo", "Este é o texto completo de um próximo capítulo diferente.");
  await h.submit(); assert.equal(h.calls.inserts.length, 1);
  h.action.iniciarNovoCapitulo(); await h.submit();
  assert.equal(h.calls.inserts.length, 2); assert.equal(h.calls.inserts[1].ordem, 2);
  assert.match(h.calls.inserts[1].texto, /próximo capítulo diferente/);
});

test("logout após INSERT impede cache, limpeza e efeitos da conta anterior", async t => {
  const pending = deferred();
  const h = harness(t, { insert: async payload => { await pending.promise; return { data: { ...payload, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" }, error: null }; } });
  const operation = h.submit(); await flush(); h.account(""); pending.resolve(); await operation;
  assert.equal(h.calls.cache.length, 0); assert.equal(h.calls.diary.length, 0); assert.equal(h.state.texto, TEXT);
  assert.equal(h.render().contaAlterada, true);
});

test("desmontagem invalida a continuação de uma criação enviada", async t => {
  const pending = deferred();
  const h = harness(t, { insert: async payload => { await pending.promise; return { data: { ...payload, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" }, error: null }; } });
  const operation = h.submit(); await flush(); h.unmount(); pending.resolve(); await operation;
  assert.equal(h.calls.cache.length, 0); assert.equal(h.calls.diary.length, 0); assert.equal(h.state.texto, TEXT);
});

test("rejeição SQL tardia fica registrada somente para a tentativa original", async t => {
  const pending = deferred();
  const h = harness(t, { insert: () => pending.promise });
  const operation = h.submit(); await flush(); h.account(B);
  pending.resolve({ data: null, error: { code: "23514", message: "restrição" } }); await operation;
  const { lerTentativaCriacao } = loadApplicationModule("app/adicionar-capitulo/lib/adicionar-capitulo-create-recovery.ts");
  assert.equal(lerTentativaCriacao(A, W).fase, "rejeitada");
  assert.equal(lerTentativaCriacao(B, W), null);
});

test("rascunho editado durante a tentativa sobrevive a reload, sem mudar o payload enviado", async t => {
  const pending = deferred();
  const h = harness(t, { insert: () => pending.promise });
  const operation = h.submit(); await flush();
  h.edit("Revisão posterior", "O texto revisado mais recente precisa ficar guardado no navegador.");
  pending.resolve({ data: null, error: { message: "timeout" } }); await operation; h.unmount();
  const next = harness(t, { storage: h.storage }); await flush();
  assert.equal(next.state.titulo, "Revisão posterior"); assert.match(next.state.texto, /revisado mais recente/);
  assert.equal(h.calls.inserts[0].texto, TEXT);
});

test("feedback de edição não desfaz a confirmação protegida", () => {
  const calls = [];
  const { useAdicionarCapituloImportAction } = loadApplicationModule("app/adicionar-capitulo/hooks/useAdicionarCapituloImportAction.ts");
  const action = useAdicionarCapituloImportAction({ titulo: "", numeroNovoCapitulo: 1, erro: "", capituloCriado: { id: A }, notificacaoCriada: {}, preservarCriacao: true,
    setTitulo() {}, setTexto() {}, setErro() {}, setCapituloCriado: value => calls.push(value), setNotificacaoCriada: value => calls.push(value),
    setArquivoImportadoNome() {}, setArquivoImportadoErro() {} });
  action.limparFeedback(); assert.deepEqual(calls, []);
});

for (const lost of [false, true]) {
  test(`SDK real: ${lost ? "resposta perdida e GET de recuperação" : "sucesso"}, sem retry de INSERT`, async t => {
    const rows = new Map(), http = [];
    const client = createClient("http://127.0.0.1:55459", "chave-publica-local-inerte", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async (input, init) => {
        const url = new URL(input), method = init?.method || "GET";
        http.push({ url, method, headers: new Headers(init?.headers), body: init?.body });
        const json = value => new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
        if (url.pathname.endsWith("/obras")) return json([{ id: W }]);
        if (method === "POST") {
          const payload = JSON.parse(init.body);
          const record = { ...payload, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" };
          rows.set(payload.id, record);
          if (lost) throw new TypeError("resposta perdida depois do commit");
          return json(record);
        }
        const id = url.searchParams.get("id")?.replace(/^eq\./, "");
        return json(id ? [rows.get(id)].filter(Boolean) : []);
      } },
    });
    const h = harness(t, { queryClient: client }); await h.submit();
    if (lost) { await h.submit(); await h.action.verificarCriacao(); }
    const posts = http.filter(call => call.method === "POST");
    assert.equal(posts.length, 1);
    const payload = JSON.parse(posts[0].body);
    assert.match(payload.id, /^[0-9a-f-]{36}$/);
    assert.equal(payload.user_id, A); assert.equal(payload.obra_id, W); assert.equal(payload.publicado, true);
    assert.match(posts[0].headers.get("prefer"), /return=representation/);
    assert.equal(h.state.criado.id, payload.id);
    assert.equal(h.calls.diary.length, lost ? 0 : 1);
    if (lost) assert.ok(http.some(call => call.url.searchParams.get("id") === `eq.${payload.id}` && call.url.searchParams.get("user_id") === `eq.${A}`));
  });
}

test("sessão expirada antes do INSERT mantém o rascunho recuperável para a conta original", async t => {
  const h = harness(t, { auth: async () => ({ data: { user: null }, error: { message: "sessão expirada" } }) });
  await h.submit(); assert.equal(h.calls.inserts.length, 0); assert.equal(h.calls.redirects.length, 1);
  h.unmount(); const next = harness(t, { storage: h.storage }); await flush();
  assert.equal(next.state.titulo, "Primeiro capítulo"); assert.equal(next.state.texto, TEXT);
  assert.equal(next.render().recuperacaoPendente, false);
});

test("reconciliação local preserva leitura e interações existentes", () => {
  const { aplicarNovoCapituloNasObrasLocais } = loadApplicationModule("app/adicionar-capitulo/lib/adicionar-capitulo-local-create-mutation.ts");
  const old = { id: A, titulo: "Capítulo", texto: TEXT, criadoEm: "2026-11-13T12:00:00Z", ordem: 1,
    lido: true, lidoEm: "2026-11-13T12:01:00Z", curtiu: true, salvo: true, comentario: "Anotação" };
  const [result] = aplicarNovoCapituloNasObrasLocais({ obras: [{ id: W, autor: "A", autorId: A, capitulos: [old] }],
    obraId: W, novoCapitulo: { ...old, lido: false, lidoEm: "", curtiu: false, salvo: false, comentario: "" },
    nomeProfileAutor: "A", usuarioIdLogado: A, userId: A });
  assert.equal(result.capitulos.length, 1);
  assert.deepEqual(result.capitulos[0], old);
});

test("23505 com o UUID já gravado reconcilia a criação e não libera outro INSERT", async t => {
  const h = harness(t, { insert: (payload, rows) => {
    rows.set(payload.id, { ...payload, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" });
    return { data: null, error: { code: "23505", message: "capitulos_pkey" } };
  } });
  await h.submit(); await h.submit();
  assert.equal(h.calls.inserts.length, 1);
  assert.equal(h.state.criado.id, h.calls.inserts[0].id);
  assert.equal(h.calls.diary.length, 0); assert.equal(h.calls.notifications.length, 0);
});

test("colisão de UUID com leitura negativa permanece incerta e não libera novo envio", async t => {
  const h = harness(t, { insert: async () => ({ data: null, error: { code: "23505", message: 'duplicate key value violates unique constraint "capitulos_pkey"' } }) });
  await h.submit(); await h.submit();
  assert.equal(h.calls.inserts.length, 1);
  assert.equal(h.state.texto, TEXT);
  assert.equal(h.state.criado, null);
  assert.equal(h.action.recuperacaoPendente, true);
  assert.equal(h.calls.diary.length, 0); assert.equal(h.calls.notifications.length, 0);
});
