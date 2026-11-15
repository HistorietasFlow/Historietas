import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const user = { id: "usuario-A", email: "autor@test.local", user_metadata: { nome: "Autor" } };
const authenticated = { data: { user, session: { access_token: "somente-teste" } }, error: null };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const flush = () => new Promise(resolve => setImmediate(resolve));

function mount(overrides = {}) {
  const events = [], slots = [];
  let cursor = 0, pendingEffects = [], current, props;
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, i) => value !== b[i]);
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(initial) {
      const i = cursor++;
      slots[i] ||= { value: initial, set(value) { slots[i].value = typeof value === "function" ? value(slots[i].value) : value; } };
      return [slots[i].value, slots[i].set];
    },
    useCallback(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) slots[i] = { fn, deps }; return slots[i].fn; },
    useEffect(fn, deps) {
      const i = cursor++;
      if (changed(slots[i]?.deps, deps)) pendingEffects.push(() => {
        slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() };
      });
    },
  };
  const setters = Object.fromEntries(["Modo", "Senha", "AceitouTermos", "CientePrivacidade", "Carregando", "Erro", "Aviso"]
    .map(name => [`set${name}`, value => { events.push([`set${name}`, value]); }]));
  const profile = async (...args) => { events.push(["profile", ...args]); return overrides.profile ? overrides.profile(...args) : { ok: true }; };
  const router = { replace: url => events.push(["replace", url]), refresh: () => events.push(["refresh"]) };
  const mocks = {
    react,
    "../../../lib/supabase/client": { supabase: { auth: { async getUser() {
      events.push(["getUser"]); return overrides.getUser ? overrides.getUser() : { data: { user: null }, error: null };
    } } } },
    "../../../lib/aceiteTermos": { async registrarAceiteTermosPublicacao() {
      events.push(["terms"]); return overrides.terms ? overrides.terms() : { aceito: true, erro: "" };
    } },
    "../actions/entrar-com-senha-login": { async entrarComSenhaLogin(args) {
      events.push(["signIn", args]); return overrides.signIn ? overrides.signIn() : authenticated;
    } },
    "../actions/criar-conta-login": { async criarContaLogin(args) {
      events.push(["signUp", args]); return overrides.signUp ? overrides.signUp() : authenticated;
    } },
    "../actions/solicitar-recuperacao-senha-login": { async solicitarRecuperacaoSenhaLogin(email) {
      events.push(["recovery", email]); return overrides.recovery ? overrides.recovery() : { ok: true };
    } },
    "../lib/login-storage-sync": { sincronizarStorageUsuarioLogin: id => events.push(["storage", id]) },
  };
  const { useLoginSubmitAction } = load("app/login/hooks/useLoginSubmitAction.ts", mocks);
  const { useLoginExistingSessionRedirect } = load("app/login/hooks/useLoginExistingSessionRedirect.ts", mocks);
  const t = key => key;
  props = { router, language: "pt-BR", t, email: "  AUTOR@test.local ", nome: "Autor", senha: "senha1234",
    criandoConta: false, recuperandoSenha: false, aceitouTermos: true, cientePrivacidade: true,
    carregando: false, salvarProfile: profile, ...setters, ...overrides.props };
  function TestLoginHooks(patch = {}) {
    props = { ...props, ...patch }; cursor = 0; pendingEffects = [];
    current = useLoginSubmitAction(props);
    useLoginExistingSessionRedirect({ ...props, ...current });
    for (const effect of pendingEffects) effect();
    return current;
  }
  TestLoginHooks();
  return { events, render: TestLoginHooks, get current() { return current; }, submit: () => current.enviarFormulario({ preventDefault() {} }),
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
    calls: name => events.filter(event => event[0] === name),
  };
}

function browser(t) {
  const original = globalThis.window;
  globalThis.window = { location: { search: "?redirectTo=%2Fpublicar" }, setTimeout() { throw new Error("Espera artificial no login"); } };
  t.after(() => { globalThis.window = original; });
}

function navigatedOnce(h) {
  assert.deepEqual(h.calls("storage"), [["storage", user.id]]);
  assert.deepEqual(h.calls("replace"), [["replace", "/publicar"]]);
  assert.deepEqual(h.calls("refresh"), [["refresh"]]);
}

test("login normal: mantém Auth → perfil → storage/redirect, sem pausa e sem duplicar submit", async t => {
  browser(t); const result = deferred();
  const h = mount({ signIn: () => result.promise });
  const first = h.submit(), second = h.submit();
  assert.equal(h.calls("signIn").length, 1);
  assert.equal(h.calls("profile").length, 0);
  result.resolve(authenticated); await Promise.all([first, second]);
  navigatedOnce(h); assert.equal(h.calls("profile").length, 1); assert.equal(h.calls("terms").length, 0);
  assert.ok(h.events.findIndex(e => e[0] === "profile") < h.events.findIndex(e => e[0] === "replace"));
  await h.submit(); navigatedOnce(h);
});

test("sessão existente: uma sincronização e uma navegação, sem signIn nem pausa", async t => {
  browser(t); const h = mount({ getUser: async () => ({ data: { user }, error: null }) });
  await flush(); navigatedOnce(h);
  assert.equal(h.calls("profile").length, 1); assert.equal(h.calls("signIn").length, 0);
  h.render(); await flush(); navigatedOnce(h); assert.equal(h.calls("getUser").length, 1);
});

test("getUser antigo concluído após submit não sincroniza nem redireciona de novo", async t => {
  browser(t); const lookup = deferred(); const h = mount({ getUser: () => lookup.promise });
  await h.submit(); lookup.resolve({ data: { user }, error: null }); await flush();
  navigatedOnce(h); assert.equal(h.calls("profile").length, 1);
});

test("validação local inválida não invalida a sessão existente nem chama signIn", async t => {
  browser(t); const lookup = deferred(); const h = mount({ props: { email: "" }, getUser: () => lookup.promise });
  await h.submit(); assert.equal(h.calls("signIn").length, 0);
  lookup.resolve({ data: { user }, error: null }); await flush(); navigatedOnce(h);
});

test("checagem já sincronizando não navega enquanto cadastro aguarda aceite", async t => {
  browser(t); const oldProfile = deferred(), terms = deferred(); let calls = 0;
  const h = mount({ props: { criandoConta: true }, getUser: async () => ({ data: { user }, error: null }),
    profile: async () => ++calls === 1 ? oldProfile.promise : { ok: true }, terms: () => terms.promise });
  await flush(); const submitting = h.submit(); await flush();
  oldProfile.resolve({ ok: true }); await flush(); assert.equal(h.calls("replace").length, 0);
  terms.resolve({ aceito: true, erro: "" }); await submitting; navigatedOnce(h);
});

test("perfil indisponível: aviso persiste sem timer; Continuar finaliza só uma vez", async t => {
  browser(t);
  for (const existing of [false, true]) {
    const h = mount({ profile: async () => ({ ok: false }),
      getUser: async () => ({ data: { user: existing ? user : null }, error: null }) });
    if (existing) await flush(); else await h.submit();
    assert.equal(h.calls("replace").length, 0);
    assert.ok(h.calls("setErro").some(e => e[1] === "profileSyncWarning"));
    h.render(); assert.equal(h.current.continuacaoPendente, true);
    h.current.continuarLogin(); h.current.continuarLogin(); navigatedOnce(h);
    h.unmount();
  }
});

test("nova tentativa recupera perfil sem reutilizar a continuação anterior", async t => {
  browser(t); let count = 0;
  const h = mount({ profile: async () => ({ ok: ++count > 1 }) });
  await h.submit(); h.render(); const oldContinue = h.current.continuarLogin;
  await h.submit(); oldContinue(); navigatedOnce(h); assert.equal(h.calls("profile").length, 2);
});

test("cadastro preserva confirmação de aceite e erro; perfil indisponível não inventa aceite", async t => {
  browser(t);
  const denied = mount({ props: { criandoConta: true }, terms: async () => ({ aceito: false, erro: "aceite recusado" }) });
  await denied.submit(); assert.equal(denied.calls("replace").length, 0);
  assert.ok(denied.calls("setErro").some(e => e[1] === "aceite recusado"));
  const pending = mount({ props: { criandoConta: true }, profile: async () => ({ ok: false }) });
  await pending.submit(); assert.equal(pending.calls("terms").length, 0); assert.equal(pending.calls("replace").length, 0);
  pending.render(); pending.current.continuarLogin(); navigatedOnce(pending);
  const noSession = mount({ props: { criandoConta: true }, signUp: async () => ({ ...authenticated, data: { user, session: null } }) });
  await noSession.submit(); assert.equal(noSession.calls("profile").length, 0); assert.equal(noSession.calls("replace").length, 0);
  assert.ok(noSession.calls("setAviso").some(e => e[1] === "accountCreatedNotice"));
});

test("erro de credenciais e recuperação preservam alertas sem perfil/redirect", async t => {
  browser(t);
  const failed = mount({ signIn: async () => ({ data: { user: null }, error: { code: "invalid_credentials" } }) });
  await failed.submit(); assert.equal(failed.calls("profile").length, 0); assert.equal(failed.calls("replace").length, 0);
  assert.ok(failed.calls("setErro").some(e => e[1]));
  const recovery = mount({ props: { recuperandoSenha: true } });
  await recovery.submit(); assert.equal(recovery.calls("signIn").length, 0); assert.equal(recovery.calls("profile").length, 0);
  assert.ok(recovery.calls("setAviso").some(e => e[1] === "recoveryEmailSent"));
});

test("desmontagem durante Auth, perfil, aceite ou recuperação ignora resultados e setters tardios", async t => {
  browser(t);
  for (const step of ["signIn", "signUp", "getUser", "profile", "terms", "recovery"]) {
    const pending = deferred(); const h = mount({
      [step]: () => pending.promise,
      props: { criandoConta: step === "terms" || step === "signUp", recuperandoSenha: step === "recovery" },
    });
    const submitting = step === "getUser" ? Promise.resolve() : h.submit();
    await flush(); h.unmount(); const count = h.events.length;
    pending.resolve(step === "profile" ? { ok: false } : step === "terms" ? { aceito: true } : step === "recovery" ? { ok: true } : authenticated);
    await submitting; await flush(); assert.equal(h.events.length, count, step);
  }
});

test("desmontagem durante perfil da sessão existente não sincroniza storage nem navega", async t => {
  browser(t); const pending = deferred();
  const h = mount({ getUser: async () => ({ data: { user }, error: null }), profile: () => pending.promise });
  await flush(); h.unmount(); const count = h.events.length;
  pending.resolve({ ok: true }); await flush(); assert.equal(h.events.length, count);
});

test("tradução nova/re-render cancela checagem anterior e não navega após erro de getUser", async t => {
  browser(t); const old = deferred(); let count = 0;
  const h = mount({ getUser: async () => ++count === 1 ? old.promise : { data: { user }, error: new Error("indisponível") } });
  h.render({ t: key => `en:${key}` }); await flush(); old.resolve({ data: { user }, error: null }); await flush();
  assert.equal(h.calls("profile").length, 0); assert.equal(h.calls("replace").length, 0);
});

test("retry de recuperação do perfil conserva 350 ms e diagnóstico, sem usar a pausa de 1.600 ms", async () => {
  for (const recovered of [false, true]) {
    const events = []; let calls = 0;
    const { sincronizarProfileLogin } = load("app/login/actions/sincronizar-profile-login.ts", {
      "../lib/login-timing-utils": { aguardarLogin: async ms => events.push(["wait", ms]) },
      "../lib/login-profile-sync-diagnostics": { registrarFalhaSincronizacaoPerfil: () => events.push(["diagnostic"]) },
      "./sincronizar-profile-login-uma-vez": { sincronizarProfileLoginUmaVez: async () => { calls++; if (calls === 1 || !recovered) throw new Error("perfil indisponível"); } },
    });
    const result = await sincronizarProfileLogin(user.id, "", user.email);
    assert.equal(result.ok, recovered); assert.equal(calls, 2);
    assert.deepEqual(events, recovered ? [["wait", 350]] : [["wait", 350], ["diagnostic"]]);
  }
});

test("aviso e botão de continuação mantêm rótulos PT/EN/ES e semântica acessível", () => {
  const { traduzirLogin } = load("app/login/lib/login-translations.ts");
  for (const lang of ["pt-BR", "en", "es"]) {
    assert.ok(traduzirLogin(lang, "continueWithSession")); assert.ok(traduzirLogin(lang, "profileSyncWarning"));
  }
  const source = readFileSync("app/login/page.tsx", "utf8");
  assert.match(source, /role="alert" aria-live="assertive"/);
  assert.match(source, /continuacaoPendente &&[\s\S]*?type="button" onClick=\{continuarLogin\}/);
});
