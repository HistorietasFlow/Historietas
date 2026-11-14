import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const A = "00000000-0000-4000-8000-000000000001", B = "00000000-0000-4000-8000-000000000002";
const tick = () => new Promise(resolve => setImmediate(resolve));
const adiar = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; };
const expira = () => Math.floor(Date.now() / 1000) + 3600;
function hooks() {
  const slots = []; let i = 0, efeitos = [], cleanups = [];
  const iguais = (a, b) => a && a.length === b.length && a.every((v, j) => Object.is(v, b[j]));
  return {
    react: { ...React,
      useRef(v) { const j = i++; if (!(j in slots)) slots[j] = { current: v }; return slots[j]; },
      useState(v) { const j = i++; if (!(j in slots)) slots[j] = v; return [slots[j], novo => { slots[j] = typeof novo === "function" ? novo(slots[j]) : novo; }]; },
      useEffect(fn, deps) { const j = i++; if (!iguais(slots[j], deps)) { slots[j] = deps; efeitos.push([j, fn]); } },
    },
    render(fn) { i = 0; return fn(); },
    commit() { const fila = efeitos; efeitos = []; for (const [j, fn] of fila) { cleanups[j]?.(); cleanups[j] = fn(); } },
    cleanup() { for (const fn of cleanups) fn?.(); },
  };
}
function preparar(t, query = "?recuperacao=1") {
  const original = globalThis.window, eventos = new Map();
  globalThis.window = { location: { search: query }, addEventListener: (n, fn) => eventos.set(n, fn), removeEventListener: n => eventos.delete(n) };
  const h = hooks(), chamadas = [], commits = [], estado = { link: "verificando", erro: "", salvando: false };
  const sessoes = new Map([ ["A", { access_token: "token-A", refresh_token: "refresh-A", user: { id: A } }],
    ["B", { access_token: "token-B", refresh_token: "refresh-B", user: { id: B } }],
    ["A2", { access_token: "token-A2", refresh_token: "refresh-A2", user: { id: A } }] ]);
  const claims = new Map([ ["token-A", { sub: A, session_id: "sessao-A", exp: expira(), amr: [{ method: "recovery" }] }],
    ["token-B", { sub: B, session_id: "sessao-B", exp: expira(), amr: [{ method: "recovery" }] }],
    ["token-A2", { sub: A, session_id: "sessao-A2", exp: expira(), amr: [{ method: "recovery" }] }] ]);
  const config = { session: sessoes.get("A"), claims, getUserGate: null, claimsGate: null, updateGate: null, logoutGate: null,
    erroUser: null, erroClaims: null, erroUpdate: null, erroLogout: null, usuarioUpdate: A, manterSessaoLogout: false, limpezas: 0 };
  let listener;
  const atualizar = async (id, senha) => {
    chamadas.push(["update", id, senha]); const resposta = config.usuarioUpdate;
    await config.updateGate; return { data: { user: resposta ? { id: resposta } : null }, error: config.erroUpdate };
  };
  const auth = {
    getSession: async () => { chamadas.push(["session"]); return { data: { session: config.session }, error: null }; },
    getUser: async jwt => {
      chamadas.push(["user", jwt]); const session = [...sessoes.values()].find(s => s.access_token === (jwt || config.session?.access_token));
      await config.getUserGate; return { data: { user: session?.user || null }, error: config.erroUser };
    },
    getClaims: async jwt => {
      const token = jwt || config.session?.access_token; chamadas.push(["claims", token]); const c = structuredClone(claims.get(token));
      await config.claimsGate; return { data: { claims: c }, error: config.erroClaims };
    },
    updateUser: ({ password }) => atualizar(config.session?.user.id, password),
    signOut: async () => {
      chamadas.push(["logout", config.session?.user.id]); await config.logoutGate;
      if (!config.erroLogout && !config.manterSessaoLogout) { config.session = null; listener?.("SIGNED_OUT", null); }
      return { error: config.erroLogout };
    },
    onAuthStateChange(fn) { listener = fn; return { data: { subscription: { unsubscribe() { listener = null; } } } }; },
  };
  class ContextoRecuperacaoObsoleto extends Error {}
  const mocks = { react: h.react, "../../../lib/supabase/client": { supabase: { auth } },
    "../lib/redefinir-senha-session-mutation": { ContextoRecuperacaoObsoleto, atualizarSenhaNaSessaoRecuperacao: (sessao, senha, atual) => {
      if (!atual()) throw new ContextoRecuperacaoObsoleto(); return atualizar(sessao.usuarioId, senha);
    } } };
  const { useRedefinirSenhaRecoveryValidation } = load("app/redefinir-senha/hooks/use-redefinir-senha-recovery-validation.ts", mocks);
  const { useRedefinirSenhaSaveAction } = load("app/redefinir-senha/hooks/use-redefinir-senha-save-action.ts", mocks);
  const setters = {
    setEstadoLink: v => { estado.link = v; commits.push(["link", v]); },
    setErro: v => { estado.erro = v; commits.push(["erro", v]); },
    setSalvando: v => { estado.salvando = v; commits.push(["salvando", v]); },
  };
  const limpar = () => { config.limpezas++; };
  const props = { router: { replace: href => chamadas.push(["replace", href]), refresh: () => chamadas.push(["refresh"]) },
    novaSenha: "SenhaNova123", confirmacao: "SenhaNova123", t: key => key, ...setters };
  let resultado;
  const render = () => h.render(() => {
    const ref = Reflect.apply(useRedefinirSenhaRecoveryValidation, null, [setters.setEstadoLink, limpar]);
    resultado = Reflect.apply(useRedefinirSenhaSaveAction, null, [{ ...props, estadoLink: estado.link, salvando: estado.salvando,
      contextoRecuperacaoRef: ref }]); return resultado;
  });
  t.after(() => { h.cleanup(); globalThis.window = original; });
  return { ...h, auth, chamadas, commits, config, props, estado, render,
    validar: async () => { render(); h.commit(); await tick(); return render(); },
    evento(id, event = "SIGNED_IN") { config.session = sessoes.get(id) || null; listener?.(event, config.session); },
    navegar(query) { window.location.search = query; eventos.get("popstate")?.(); },
    submit: () => render().salvarNovaSenha({ preventDefault() {} }),
  };
}

for (const query of ["", "?recuperacao=0", "?recuperacao=1&erro=link-invalido"]) {
  test(`link inválido não consulta Auth nem permite escrita: ${query || "sem parâmetros"}`, async t => {
    const h = preparar(t, query); await h.validar(); await h.submit(); assert.equal(h.estado.link, "invalido"); assert.deepEqual(h.chamadas, []);
  });
}
for (const [nome, mudar] of [
  ["expirado", c => { c.exp = 1; }], ["sem expiração", c => { delete c.exp; }],
  ["sem recovery", c => { c.amr = [{ method: "password" }]; }],
  ["claim de outro usuário", c => { c.sub = B; }], ["sem session_id", c => { delete c.session_id; }],
  ["AMR inválido", c => { c.amr = [null, {}, { method: 123 }]; }],
]) {
  test(`validação rejeita token ${nome}`, async t => { const h = preparar(t); mudar(h.config.claims.get("token-A")); await h.validar(); assert.equal(h.estado.link, "invalido"); });
}

test("getUser e claims são verificados para o mesmo token e formulário válido salva/logout/navega", async t => {
  const h = preparar(t); await h.validar(); assert.equal(h.estado.link, "valido");
  assert.ok(h.chamadas.some(c => c[0] === "user" && c[1] === "token-A"));
  await h.submit(); assert.deepEqual(h.chamadas.filter(c => ["update", "logout", "replace", "refresh"].includes(c[0])), [
    ["update", A, "SenhaNova123"], ["logout", A], ["replace", "/login?senhaRedefinida=1"], ["refresh"],
  ]); assert.equal(h.estado.salvando, false);
});

test("duas submissões no mesmo render iniciam uma única alteração", async t => {
  const h = preparar(t); const handler = await h.validar(); const gate = adiar(); h.config.updateGate = gate.promise;
  const primeira = handler.salvarNovaSenha({ preventDefault() {} }); const segunda = handler.salvarNovaSenha({ preventDefault() {} });
  await tick(); assert.equal(h.chamadas.filter(c => c[0] === "update").length, 1);
  gate.resolve(); await Promise.all([primeira, segunda]); assert.equal(h.chamadas.filter(c => c[0] === "replace").length, 1);
});

for (const id of ["B", "A2", ""]) {
  test(`troca/logout invalida o contexto já exibido sem reutilizar o handler: ${id || "logout"}`, async t => {
    const h = preparar(t); const handler = await h.validar(); h.evento(id, id ? "SIGNED_IN" : "SIGNED_OUT");
    await handler.salvarNovaSenha({ preventDefault() {} }); assert.equal(h.estado.link, "invalido");
    assert.equal(h.chamadas.filter(c => c[0] === "update").length, 0);
  });
}

test("validação atrasada da conta A não habilita o formulário após evento de B", async t => {
  const h = preparar(t), gate = adiar(); h.config.claimsGate = gate.promise; h.render(); h.commit(); await tick(); h.evento("B");
  gate.resolve(); await tick(); assert.equal(h.estado.link, "invalido");
});

test("troca de sessão enquanto getUser da submissão está pendente não atualiza senha", async t => {
  const h = preparar(t); await h.validar(); const gate = adiar(); h.config.getUserGate = gate.promise;
  const salvamento = h.submit(); await tick(); h.evento("B"); gate.resolve(); await salvamento;
  assert.equal(h.chamadas.filter(c => c[0] === "update").length, 0); assert.equal(h.estado.salvando, false);
});

test("resposta de alteração atrasada não faz logout da nova conta nem declara sucesso", async t => {
  const h = preparar(t); await h.validar(); const gate = adiar(); h.config.updateGate = gate.promise;
  const salvamento = h.submit(); await tick(); h.evento("B"); gate.resolve(); await salvamento;
  assert.equal(h.chamadas.filter(c => c[0] === "logout" || c[0] === "replace").length, 0);
  assert.equal(h.estado.link, "invalido"); assert.equal(h.estado.salvando, false);
});

test("mudança de sessão durante logout impede navegação de sucesso atrasada", async t => {
  const h = preparar(t); await h.validar(); const gate = adiar(); h.config.logoutGate = gate.promise;
  const salvamento = h.submit(); await tick(); h.evento("B"); gate.resolve(); await salvamento;
  assert.equal(h.chamadas.filter(c => c[0] === "replace").length, 0);
});

for (const id of [null, B]) {
  test(`resposta de update sem usuário esperado não é sucesso: ${id || "nulo"}`, async t => {
    const h = preparar(t); await h.validar(); h.config.usuarioUpdate = id; await h.submit();
    assert.equal(h.estado.link, "invalido"); assert.equal(h.chamadas.filter(c => c[0] === "replace" || c[0] === "logout").length, 0);
  });
}

test("logout com erro não permite repetir a senha com o contexto consumido", async t => {
  const h = preparar(t); await h.validar(); h.config.erroLogout = { message: "rede" };
  await h.submit(); assert.equal(h.estado.erro, "genericError"); await h.submit();
  assert.equal(h.chamadas.filter(c => c[0] === "update").length, 1); assert.equal(h.chamadas.filter(c => c[0] === "replace").length, 0);
});

test("logout retornando 200 sem encerrar sessão não gera falso sucesso", async t => {
  const h = preparar(t); await h.validar(); h.config.manterSessaoLogout = true; await h.submit();
  assert.equal(h.chamadas.filter(c => c[0] === "replace").length, 0); assert.equal(h.estado.link, "invalido");
});

test("falha de rede na alteração oferece erro e permite retry somente no contexto atual", async t => {
  const h = preparar(t); await h.validar(); h.config.erroUpdate = { message: "temporário" }; await h.submit();
  assert.equal(h.estado.erro, "temporário"); assert.equal(h.estado.salvando, false);
  h.config.erroUpdate = null; await h.submit(); assert.equal(h.chamadas.filter(c => c[0] === "replace").length, 1);
});

test("cleanup descarta resposta tardia sem navegar ou atualizar estados desmontados", async t => {
  const h = preparar(t); await h.validar(); const gate = adiar(); h.config.updateGate = gate.promise;
  const salvamento = h.submit(); await tick(); h.cleanup(); const commits = h.commits.length;
  gate.resolve(); await salvamento; assert.equal(h.commits.length, commits); assert.equal(h.chamadas.filter(c => c[0] === "replace" || c[0] === "logout").length, 0);
});

test("back/forward para link inválido descarta validação e formulário anteriores", async t => {
  const h = preparar(t); await h.validar(); h.navegar("?erro=link-invalido"); await tick();
  assert.equal(h.estado.link, "invalido"); await h.submit(); assert.equal(h.chamadas.filter(c => c[0] === "update").length, 0);
});

test("evento da mesma sessão preserva prova; A/B/A não reutiliza a prova antiga", async t => {
  const h = preparar(t); await h.validar(); h.evento("A"); assert.equal(h.estado.link, "valido");
  h.evento("B"); h.evento("A"); await h.submit(); assert.equal(h.estado.link, "invalido"); assert.equal(h.chamadas.filter(c => c[0] === "update").length, 0);
});

for (const etapa of ["erroUser", "erroClaims"]) {
  test(`falha remota na validação (${etapa}) não libera formulário; novo recovery permite recuperar`, async t => {
    const h = preparar(t); h.config[etapa] = { message: "rede" }; await h.validar();
    assert.equal(h.estado.link, "invalido"); h.config[etapa] = null;
    h.evento("A", "PASSWORD_RECOVERY"); await tick(); assert.equal(h.estado.link, "valido");
  });
}

test("renovação do token revalida somente a sessão de recuperação original", async t => {
  const h = preparar(t); await h.validar();
  h.config.claims.get("token-A2").session_id = "sessao-A";
  h.evento("A2", "TOKEN_REFRESHED"); assert.equal(h.estado.link, "invalido");
  await tick(); assert.equal(h.estado.link, "valido");
  await h.submit(); assert.equal(h.chamadas.filter(c => c[0] === "replace").length, 1);
});

test("refresh de outra sessão não herda o link validado", async t => {
  const h = preparar(t); await h.validar(); h.evento("B", "TOKEN_REFRESHED"); await tick();
  assert.equal(h.estado.link, "invalido"); await h.submit(); assert.equal(h.chamadas.filter(c => c[0] === "update").length, 0);
});

test("popstate e refresh não reabilitam contexto revogado por troca de conta", async t => {
  const h = preparar(t); await h.validar(); h.evento("B"); h.evento("A", "TOKEN_REFRESHED");
  h.navegar("?recuperacao=1"); await tick(); assert.equal(h.estado.link, "invalido");
});

test("contexto consumido não é reutilizado por refresh ou popstate após falha de logout", async t => {
  const h = preparar(t); await h.validar(); h.config.erroLogout = { message: "rede" }; await h.submit();
  h.evento("A", "TOKEN_REFRESHED"); h.navegar("?recuperacao=1"); await tick(); await h.submit();
  assert.equal(h.estado.link, "invalido"); assert.equal(h.chamadas.filter(c => c[0] === "update").length, 1);
});

for (const [senha, confirmacao, erro] of [["Ab1", "Ab1", "passwordMin"], ["abcdefgh", "abcdefgh", "passwordComposition"],
  ["12345678", "12345678", "passwordComposition"], ["Árvore123", "diferente123", "passwordMismatch"]]) {
  test(`validação local preservada: ${erro} (${senha})`, async t => {
    const h = preparar(t); await h.validar(); h.props.novaSenha = senha; h.props.confirmacao = confirmacao; await h.submit();
    assert.equal(h.estado.erro, erro); assert.equal(h.chamadas.filter(c => c[0] === "update").length, 0);
  });
}

test("exceção de rede libera o bloqueio de submissão e permite nova tentativa", async t => {
  const h = preparar(t); await h.validar(); const gate = adiar(); h.config.updateGate = gate.promise;
  const salvamento = h.submit(); await tick(); gate.reject(new Error("fetch failed")); await salvamento;
  assert.equal(h.estado.salvando, false); assert.equal(h.estado.erro, "fetch failed");
  h.config.updateGate = null; await h.submit(); assert.equal(h.chamadas.filter(c => c[0] === "replace").length, 1);
});

test("expiração entre validação e submissão impede escrita e anuncia sessão inválida", async t => {
  const h = preparar(t); await h.validar(); h.config.claims.get("token-A").exp = 1; await h.submit();
  assert.equal(h.estado.link, "invalido"); assert.equal(h.estado.erro, "sessionInvalid");
  assert.equal(h.chamadas.filter(c => c[0] === "update").length, 0);
});

test("validação inicial rejeitada por exceção termina sem loading preso", async t => {
  const h = preparar(t), gate = adiar(); h.config.getUserGate = gate.promise;
  h.render(); h.commit(); await tick(); gate.reject(new Error("fetch failed")); await tick();
  assert.equal(h.estado.link, "invalido");
});

test("refresh durante alteração pendente não cria formulário capaz de repetir a escrita confirmada", async t => {
  const h = preparar(t); await h.validar(); const gate = adiar(); h.config.updateGate = gate.promise;
  const salvamento = h.submit(); await tick(); h.config.claims.get("token-A2").session_id = "sessao-A";
  h.evento("A2", "TOKEN_REFRESHED"); await tick();
  gate.resolve(); await salvamento; h.navegar("?recuperacao=1"); await tick(); await h.submit();
  assert.equal(h.estado.link, "invalido"); assert.equal(h.chamadas.filter(c => c[0] === "update").length, 1);
  assert.equal(h.chamadas.filter(c => c[0] === "replace").length, 0);
});
