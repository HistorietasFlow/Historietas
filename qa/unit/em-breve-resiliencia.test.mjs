import assert from "node:assert/strict";
import test from "node:test";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";
const defer = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const obra = { id: "obra-1", slug: "obra", titulo: "Obra" };
function runner(t, path, name, mocks, props) {
  let index = 0, result;
  const cells = [], effects = [], listeners = new Set();
  const auth = { getUser: async () => ({ data: { user: { id: "A" } }, error: null }), onAuthStateChange: fn => { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } }; } };
  const react = {
    useRef(value) { return cells[index++] ??= { current: value }; },
    useState(value) { const i = index++; cells[i] ??= { value }; return [cells[i].value, next => { cells[i].value = typeof next === "function" ? next(cells[i].value) : next; }]; },
    useEffect(fn, deps) { const i = index++, old = cells[i]; if (!old || deps.some((v, k) => v !== old.deps[k])) { cells[i] = { deps }; effects.push(() => { old?.cleanup?.(); cells[i].cleanup = fn(); }); } },
  };
  const hook = loadApplicationModule(path, { react, "../../../lib/supabase/client": { supabase: { auth } }, ...mocks })[name];
  function render() { index = 0; result = hook(props); effects.splice(0).forEach(fn => fn()); return result; }
  const unmount = () => cells.forEach(cell => cell?.cleanup?.());
  t.after(unmount); render();
  return { render, auth, unmount, get result() { return result; }, account(id) { listeners.forEach(fn => fn("SIGNED_IN", id ? { user: { id } } : null)); } };
}
function browser(t) {
  const previous = globalThis.window;
  globalThis.window = { location: { search: "" }, setTimeout: fn => queueMicrotask(fn) };
  t.after(() => { globalThis.window = previous; });
}
function save(t, sync) {
  let salvas = [], calls = 0;
  const h = runner(t, "app/em-breve/hooks/use-em-breve-salvar-lancamento.ts", "useEmBreveSalvarLancamento", {
    "../actions/sincronizar-aviso-lancamento-supabase-em-breve": { sincronizarAvisoLancamentoSupabaseEmBreve: async (...args) => { calls++; return sync(...args); } },
  }, { usuarioIdLogado: "A", obrasSalvasNormalizadas: [], obrasReaisEmBreve: [obra], router: { push() {} }, setUsuarioIdLogado() {}, setObrasSalvas: value => { salvas = typeof value === "function" ? value(salvas) : value; } });
  return { h, get salvas() { return salvas; }, get calls() { return calls; } };
}
test("clique duplo antes do render envia uma única mutação", async t => {
  const wait = defer(), s = save(t, () => wait.promise);
  const first = s.h.result.salvarLancamento(obra), second = s.h.result.salvarLancamento(obra);
  await flush(); assert.equal(s.calls, 1); wait.resolve(true); await Promise.all([first, second]);
  assert.deepEqual(s.salvas, [obra.id]);
});
test("callback antigo usa lista confirmada e alterna em vez de perder favorito", async t => {
  const intents = [], s = save(t, (_u, _o, ativo) => { intents.push(ativo); return true; });
  const action = s.h.result.salvarLancamento;
  await action(obra); await action(obra);
  assert.deepEqual(intents, [true, false]); assert.deepEqual(s.salvas, []);
});
for (const mode of ["logout", "troca", "unmount"]) test(`resposta de salvar após ${mode} não altera favoritos`, async t => {
  const wait = defer(), s = save(t, () => wait.promise);
  const op = s.h.result.salvarLancamento(obra); await flush();
  if (mode === "unmount") s.h.unmount(); else s.h.account(mode === "logout" ? "" : "B");
  wait.resolve(true); await op; assert.deepEqual(s.salvas, []);
});
test("falha remota não altera favoritos e permite recuperação explícita", async t => {
  let ok = false; const s = save(t, () => ok);
  await s.h.result.salvarLancamento(obra); assert.deepEqual(s.salvas, []);
  ok = true; await s.h.result.salvarLancamento(obra); assert.deepEqual(s.salvas, [obra.id]);
});
function initial(t, remote, options = {}) {
  browser(t);
  if (options.search) window.location.search = options.search;
  return runner(t, "app/em-breve/hooks/use-em-breve-lancamentos-salvos-iniciais.ts", "useEmBreveLancamentosSalvosIniciais", {
    "../lib/em-breve-storage-utils": { SAVED_RELEASES_STORAGE_KEY: "saved", carregarJsonUsuarioEmBreve: (_k, id) => [id + "-local"], salvarJsonUsuarioEmBreve() {} },
    "../loaders/carregar-lancamentos-salvos-supabase-em-breve": { carregarLancamentosSalvosSupabaseEmBreve: remote },
    "../loaders/encontrar-link-obra-com-conteudo-em-breve": { encontrarLinkObraComConteudoEmBreve: options.link ?? (async () => "") },
  }, { replace: options.replace ?? (() => {}) });
}
test("cache aparece antes da rede e resposta antiga não desfaz edição", async t => {
  const wait = defer(), h = initial(t, () => wait.promise); await flush();
  assert.deepEqual(h.render().obrasSalvas, ["A-local"]);
  h.result.setObrasSalvas(["novo"]); wait.resolve(["antigo"]); await flush();
  assert.deepEqual(h.render().obrasSalvas, ["novo"]);
});
test("troca A para B descarta resposta antiga e logout limpa a conta", async t => {
  const a = defer(), h = initial(t, id => id === "A" ? a.promise : Promise.resolve(["B-remoto"]));
  await flush(); h.account("B"); await flush(); a.resolve(["A-remoto"]); await flush();
  assert.deepEqual(h.render().obrasSalvas, ["B-local", "B-remoto"]);
  assert.equal(h.result.usuarioIdLogado, "B"); h.account(""); await flush();
  assert.deepEqual(h.render().obrasSalvas, []);
});
test("falha inicial de rede preserva cache; refresh de token não relê favoritos", async t => {
  let calls = 0; const h = initial(t, async () => { calls++; throw Error("offline"); });
  await flush(); assert.deepEqual(h.render().obrasSalvas, ["A-local"]);
  h.account("A"); await flush(); assert.equal(calls, 1);
});
test("obras reais: resposta antiga após troca de conta não substitui a nova", async t => {
  const a = defer(); let calls = 0;
  const h = runner(t, "app/em-breve/hooks/use-em-breve-obras-reais.ts", "useEmBreveObrasReais", {
    "../loaders/carregar-obras-reais-em-breve": { carregarObrasReaisEmBreve: () => ++calls === 1 ? a.promise : Promise.resolve([{ id: "nova" }]) },
  });
  h.account("B"); await flush(); a.resolve([{ id: "antiga" }]); await flush();
  assert.deepEqual(h.render(), [{ id: "nova" }]);
});
test("identidade estável deduplica sem fundir obras diferentes de mesmo título", () => {
  const { removerObrasDuplicadasEmBreve, normalizarLancamentosSalvosComObrasEmBreve } = loadApplicationModule("app/em-breve/lib/em-breve-work-list-utils.ts");
  const outra = { ...obra, id: "obra-2" };
  assert.deepEqual(removerObrasDuplicadasEmBreve([obra, { ...obra, titulo: "Revisada" }, outra]), [obra, outra]);
  const collision = { ...outra, slug: obra.id };
  assert.deepEqual(normalizarLancamentosSalvosComObrasEmBreve([obra.id], [obra, collision]), [obra.id]);
});
test("carregamento combina favoritos remotos com alterações confirmadas durante a rede", async t => {
  const wait = defer(), h = initial(t, () => wait.promise); await flush();
  h.result.setObrasSalvas(prev => [...prev.filter(id => id !== "A-local"), "novo"]);
  wait.resolve(["A-local", "remoto"]); await flush();
  assert.deepEqual(h.render().obrasSalvas, ["remoto", "novo"]);
});
for (const code of ["", "42703"]) test(`fallback de INSERT só após rejeição de coluna: ${code || "rede"}`, async () => {
  const posts = [];
  const { sincronizarAvisoLancamentoSupabaseEmBreve: action } = loadApplicationModule("app/em-breve/actions/sincronizar-aviso-lancamento-supabase-em-breve.ts", {
    "../../../lib/supabase/client": { supabase: { from() { const q = { select: () => q, eq: () => q, limit: () => q, maybeSingle: async () => ({ data: null, error: null }), insert: async payload => { posts.push(payload); return { error: posts.length === 1 ? { code, message: "visibilidade" } : null }; } }; return q; } } },
  });
  assert.equal(await action("A", obra.id, true), code === "42703");
  assert.equal(posts.length, code === "42703" ? 2 : 1);
});

test("troca de conta invalida destino antigo e resolve o destino da sessão atual uma vez", async t => {
  const antigo = defer(), destinos = []; let consultas = 0;
  const h = initial(t, async () => [], { search: "?obraId=obra-1", link: () => ++consultas === 1 ? antigo.promise : Promise.resolve("/atual"), replace: href => destinos.push(href) });
  await flush(); h.account("B"); await flush(); antigo.resolve("/antigo"); await flush();
  assert.deepEqual(destinos, ["/atual"]);
});
