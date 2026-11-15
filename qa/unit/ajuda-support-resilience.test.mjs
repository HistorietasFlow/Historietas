import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const ID = "33333333-3333-4333-8333-333333333333";
const auth = id => ({ data: { user: id ? { id } : null }, error: null });
const receipt = { data: [{ problema_id: ID, problema_status: "aberto", problema_criado_em: "2026-11-13T12:00:00Z" }], error: null };
const row = (id = ID, titulo = "Chamado privado de A") => ({ problema_id: id, titulo, descricao: "Descrição particular do chamado", status: "aberto" });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function load(path, deps = {}) {
  const mod = { exports: {} };
  const js = ts.transpileModule(readFileSync(new URL(path, root), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", js)(name => {
    if (name in deps) return deps[name];
    if (name.startsWith(".")) {
      const relative = new URL(`${name}.ts`, new URL(path, root));
      return load(relative.href, deps);
    }
    throw new Error(`Unexpected dependency ${name}`);
  }, mod, mod.exports);
  return mod.exports;
}
function harness({ getUser, list, create } = {}) {
  const slots = [], effects = [], pending = [];
  let cursor = 0, effectCursor = 0, listener, closed = false, dirty = false, output, unsubscriptions = 0;
  let viewer = A, lookup = getUser, read = list, write = create, language = "pt";
  const calls = [], updatesAfterUnmount = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => { if (closed) updatesAfterUnmount.push(index); const next = typeof value === "function" ? value(slots[index]) : value; dirty ||= !Object.is(next, slots[index]); slots[index] = next; }];
    },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useCallback(fn, deps) { const index = cursor++; const old = slots[index]; if (!old || deps.some((v, i) => !Object.is(v, old.deps[i]))) slots[index] = { fn, deps }; return slots[index].fn; },
    useEffect(fn, deps) {
      const index = effectCursor++, old = effects[index];
      if (!old || deps.some((v, i) => !Object.is(v, old.deps[i]))) pending.push(() => { old?.cleanup?.(); effects[index] = { deps, cleanup: fn() }; });
    },
  };
  const api = {
    auth: {
      async getUser() { calls.push(["auth"]); return lookup ? lookup() : auth(viewer); },
      onAuthStateChange(fn) { listener = fn; return { data: { subscription: { unsubscribe() { unsubscriptions++; } } } }; },
    },
    async rpc(name, args) { calls.push([name, args]); return name === "listar_meus_problemas_tecnicos" ? read ? read(args) : { data: [row()], error: null } : write ? write(args) : receipt; },
  };
  const { useAjudaTechnicalSupport: hook } = load("app/ajuda/hooks/use-ajuda-technical-support.ts", { react, "../../../lib/supabase/client": { supabase: api } });
  function render(nextLanguage = language) { language = nextLanguage; cursor = 0; effectCursor = 0; dirty = false; output = hook(language); while (pending.length) pending.shift()(); return output; }
  async function settle() { for (let i = 0; i < 60; i++) { await Promise.resolve(); if (dirty) render(); } return output; }
  return {
    render, settle, calls, updatesAfterUnmount,
    restartEffects() { effects.forEach(e => e.cleanup?.()); effects.length = 0; render(); },
    get value() { return output; },
    setLookup(fn) { lookup = fn; }, setList(fn) { read = fn; }, setCreate(fn) { write = fn; },
    event(id, event = id ? "SIGNED_IN" : "SIGNED_OUT") { viewer = id; listener?.(event, id ? { user: { id } } : null); render(); },
    async ready() { render(); await settle(); },
    async fill() { output.setTituloProblema("Problema ao abrir capítulo"); output.setDescricaoProblema("O capítulo não carrega ao tentar abrir a leitura."); render(); },
    submit: () => output.enviarProblemaTecnico({ preventDefault() {} }),
    stop() { closed = true; effects.forEach(e => e.cleanup?.()); },
    get unsubscriptions() { return unsubscriptions; },
  };
}

test("dois submits antes do render fazem uma única criação", async () => {
  const gate = deferred();
  const h = harness({ create: () => gate.promise });
  await h.ready(); await h.fill();
  const first = h.submit(), second = h.submit(); await h.settle();
  assert.equal(h.calls.filter(([name]) => name === "criar_problema_tecnico").length, 1);
  gate.resolve(receipt); await Promise.all([first, second]); await h.settle();
  assert.ok(h.value.mensagemProblema); assert.equal(h.value.tituloProblema, ""); h.stop();
});

test("resposta sem recibo não confirma sucesso nem apaga o relato", async () => {
  const h = harness({ create: async () => ({ data: null, error: null }) });
  await h.ready(); await h.fill(); await h.submit(); await h.settle();
  assert.equal(h.value.mensagemProblema, "");
  assert.equal(h.value.tituloProblema, "Problema ao abrir capítulo");
  assert.ok(h.value.erroProblema); h.stop();
});

test("falha na atualização posterior preserva a lista válida e informa erro", async () => {
  const h = harness(); await h.ready(); await h.fill();
  h.setList(async () => ({ data: null, error: { message: "offline" } }));
  await h.submit(); await h.settle();
  assert.equal(h.value.chamadosTecnicos[0]?.id, ID);
  assert.ok(h.value.erroChamados); assert.ok(h.value.mensagemProblema); h.stop();
});

test("erro de sessão inicial não equivale a visitante ou lista vazia; retry é só leitura", async () => {
  const h = harness({ getUser: async () => ({ ...auth(null), error: { name: "AuthRetryableFetchError" } }) });
  await h.ready();
  assert.equal(h.value.usuarioAutenticado, null); assert.equal(h.value.sessaoConfirmada, false);
  assert.equal(h.value.chamadosCarregados, false); assert.ok(h.value.erroChamados);
  assert.equal(h.value.carregandoChamados, false); assert.equal(h.calls.length, 1);
  h.setLookup(async () => auth(A));
  await h.value.recarregarChamados(); await h.settle();
  assert.equal(h.value.chamadosTecnicos.length, 1); assert.equal(h.value.erroChamados, "");
  assert.equal(h.calls.filter(([n]) => n === "criar_problema_tecnico").length, 0); h.stop();
});

test("ausência normal de sessão encerra loading e não consulta RPC privada", async () => {
  const h = harness({ getUser: async () => ({ ...auth(null), error: { name: "AuthSessionMissingError" } }) });
  await h.ready(); assert.equal(h.value.usuarioAutenticado, false); assert.equal(h.value.erroChamados, "");
  assert.equal(h.value.carregandoChamados, false); assert.equal(h.calls.length, 1); h.stop();
});

test("falha de revalidação mantém o snapshot anterior sem confirmar sessão ou vazio", async () => {
  const h = harness(); await h.ready();
  h.setLookup(async () => { throw new Error("offline"); });
  await h.value.recarregarChamados(); await h.settle();
  assert.equal(h.value.chamadosTecnicos[0].id, ID); assert.ok(h.value.erroChamados);
  assert.equal(h.value.sessaoConfirmada, false); assert.equal(h.value.chamadosCarregados, true);
  await h.fill(); await h.submit(); await h.settle();
  assert.equal(h.calls.filter(([n]) => n === "criar_problema_tecnico").length, 0); h.stop();
});

for (const data of [null, {}, [null], [{ titulo: "sem id" }]]) {
  test(`resposta de lista inválida ${JSON.stringify(data)} não apaga snapshot`, async () => {
    const h = harness(); await h.ready(); h.setList(async () => ({ data, error: null }));
    await h.value.recarregarChamados(); await h.settle();
    assert.equal(h.value.chamadosTecnicos[0].id, ID); assert.ok(h.value.erroChamados);
    assert.equal(h.value.carregandoChamados, false); h.stop();
  });
}

test("vazio é confirmado somente após resposta [] válida; retry recupera erro remoto", async () => {
  const h = harness({ list: async () => ({ data: null, error: { code: "503" } }) }); await h.ready();
  assert.equal(h.value.chamadosCarregados, false); assert.ok(h.value.erroChamados);
  h.setList(async () => ({ data: [], error: null })); await h.value.recarregarChamados(); await h.settle();
  assert.equal(h.value.chamadosCarregados, true); assert.equal(h.value.erroChamados, "");
  assert.deepEqual(h.value.chamadosTecnicos, []); h.stop();
});

test("retry de leitura mais recente vence uma resposta antiga", async () => {
  const gate = deferred(); const h = harness(); await h.ready();
  h.setList(() => gate.promise); const old = h.value.recarregarChamados(); await h.settle();
  h.setList(async () => ({ data: [row(B, "Snapshot novo")], error: null }));
  await h.value.recarregarChamados(); await h.settle();
  gate.resolve({ data: [row(ID, "Snapshot velho")], error: null }); await old; await h.settle();
  assert.equal(h.value.chamadosTecnicos[0].id, B); assert.equal(h.value.carregandoChamados, false); h.stop();
});

test("falha de leitura antiga não encerra loading ou apaga snapshot de retry atual", async () => {
  const oldGate = deferred(), currentGate = deferred(); const h = harness(); await h.ready();
  h.setList(() => oldGate.promise); const old = h.value.recarregarChamados(); await h.settle();
  h.setList(() => currentGate.promise); const current = h.value.recarregarChamados(); await h.settle();
  oldGate.reject(new Error("offline")); await old; await h.settle();
  assert.equal(h.value.carregandoChamados, true); assert.equal(h.value.erroChamados, "");
  assert.equal(h.value.chamadosTecnicos[0].id, ID);
  currentGate.resolve({ data: [], error: null }); await current; await h.settle();
  assert.equal(h.value.carregandoChamados, false); h.stop();
});

test("logout remove chamados, rascunho e feedback; resposta antiga não restaura A", async () => {
  const gate = deferred(); const h = harness(); await h.ready(); await h.fill();
  h.setList(() => gate.promise); const old = h.value.recarregarChamados(); await h.settle();
  h.event(null); assert.deepEqual(h.value.chamadosTecnicos, []); assert.equal(h.value.tituloProblema, "");
  await h.settle(); gate.resolve({ data: [row()], error: null }); await old; await h.settle();
  assert.equal(h.value.usuarioAutenticado, false); assert.equal(h.value.mensagemProblema, "");
  assert.deepEqual(h.value.chamadosTecnicos, []); assert.equal(h.value.carregandoChamados, false); h.stop();
});

test("A → B → A usa versões distintas e ignora resposta da primeira visita", async () => {
  const gate = deferred(); const h = harness(); await h.ready();
  h.setList(() => gate.promise); const old = h.value.recarregarChamados(); await h.settle();
  h.setList(async () => ({ data: [row(B, "Privado B")], error: null }));
  h.event(B); assert.deepEqual(h.value.chamadosTecnicos, []); await h.settle();
  assert.equal(h.value.chamadosTecnicos[0].id, B);
  h.setList(async () => ({ data: [], error: null })); h.event(A); await h.settle();
  gate.resolve({ data: [row()], error: null }); await old; await h.settle();
  assert.deepEqual(h.value.chamadosTecnicos, []); assert.equal(h.value.chamadosCarregados, true); h.stop();
});

test("getUser atrasado anterior a troca de conta não inicia RPC", async () => {
  const gate = deferred(); const h = harness({ getUser: () => gate.promise });
  h.render(); await h.settle(); h.setLookup(async () => auth(B));
  h.event(B); await h.settle(); const calls = h.calls.length;
  gate.resolve(auth(A)); await h.settle(); assert.equal(h.calls.length, calls);
  assert.equal(h.value.usuarioAutenticado, true); h.stop();
});

test("refresh da mesma identidade e INITIAL_SESSION tardio não recarregam", async () => {
  const h = harness(); await h.ready(); const calls = h.calls.length;
  h.event(A, "TOKEN_REFRESHED"); h.event(B, "INITIAL_SESSION"); h.event(A, "SIGNED_IN"); await h.settle();
  assert.equal(h.calls.length, calls); assert.equal(h.value.chamadosTecnicos[0].id, ID); h.stop();
});

test("getUser divergente do evento não autoriza a lista de outra conta", async () => {
  const h = harness(); await h.ready(); h.setLookup(async () => auth(A)); const reads = h.calls.filter(([n]) => n === "listar_meus_problemas_tecnicos").length;
  h.event(B); await h.settle(); assert.deepEqual(h.value.chamadosTecnicos, []); assert.ok(h.value.erroChamados);
  assert.equal(h.calls.filter(([n]) => n === "listar_meus_problemas_tecnicos").length, reads);
  h.setLookup(async () => auth(B)); await h.value.recarregarChamados(); await h.settle();
  assert.equal(h.value.erroChamados, ""); h.stop();
});

test("troca descoberta por getUser limpa dados anteriores antes de consultar B", async () => {
  const gate = deferred(); const h = harness(); await h.ready(); await h.fill();
  h.setLookup(async () => auth(B)); h.setList(() => gate.promise);
  const read = h.value.recarregarChamados(); await h.settle();
  assert.deepEqual(h.value.chamadosTecnicos, []); assert.equal(h.value.tituloProblema, "");
  gate.resolve({ data: [row(B)], error: null }); await read; await h.settle();
  assert.equal(h.value.chamadosTecnicos[0].id, B); h.stop();
});

for (const failure of [() => Promise.reject(new Error("connection lost")), async () => ({ data: null, error: { code: "40003" } }), async () => ({ data: [], error: null })]) {
  test("envio incerto preserva rascunho e bloqueia repetição mesmo após atualizar chamados", async () => {
    const h = harness({ create: failure }); await h.ready(); await h.fill(); await h.submit(); await h.settle();
    assert.equal(h.value.envioIncerto, true); assert.equal(h.value.mensagemProblema, "");
    assert.ok(h.value.tituloProblema); assert.equal(h.value.enviandoProblema, false);
    await h.value.recarregarChamados(); await h.settle(); await h.submit(); await h.settle();
    assert.equal(h.calls.filter(([n]) => n === "criar_problema_tecnico").length, 1);
    assert.equal(h.value.mensagemProblema, ""); h.stop();
  });
}

test("rejeição SQL confirmada permite retry manual e preserva payload/RPC", async () => {
  const h = harness({ create: async () => ({ data: null, error: { code: "23514" } }) });
  await h.ready(); await h.fill(); await h.submit(); await h.settle();
  assert.equal(h.value.envioIncerto, false); assert.ok(h.value.tituloProblema);
  h.setCreate(async () => receipt); await h.submit(); await h.settle();
  const writes = h.calls.filter(([n]) => n === "criar_problema_tecnico");
  assert.equal(writes.length, 2); assert.deepEqual(writes[0][1], writes[1][1]);
  assert.deepEqual(Object.keys(writes[1][1]).sort(), ["p_categoria", "p_descricao", "p_dispositivo", "p_navegador", "p_pagina_url", "p_titulo"]);
  assert.ok(h.value.mensagemProblema); assert.equal(h.value.enviandoProblema, false); h.stop();
});

test("falha Auth antes da escrita exige revalidação manual e não duplica RPC", async () => {
  const h = harness(); await h.ready(); await h.fill(); h.setLookup(async () => { throw new Error("offline"); });
  await h.submit(); await h.settle(); assert.equal(h.value.sessaoConfirmada, false);
  assert.equal(h.value.envioIncerto, false); assert.ok(h.value.tituloProblema);
  h.setLookup(async () => auth(A)); await h.value.recarregarChamados(); await h.settle();
  await h.submit(); await h.settle(); assert.equal(h.calls.filter(([n]) => n === "criar_problema_tecnico").length, 1); h.stop();
});

test("troca entre validar sessão e criar chamado impede escrita de A em B", async () => {
  const gate = deferred(); const h = harness(); await h.ready(); await h.fill();
  h.setLookup(() => gate.promise); const send = h.submit(); await h.settle();
  h.setLookup(async () => auth(B)); h.event(B); await h.settle();
  gate.resolve(auth(A)); await send; await h.settle();
  assert.equal(h.calls.filter(([n]) => n === "criar_problema_tecnico").length, 0);
  assert.equal(h.value.tituloProblema, ""); assert.equal(h.value.mensagemProblema, ""); h.stop();
});

test("getUser do submit descobre troca sem evento e não transfere relato", async () => {
  const h = harness(); await h.ready(); await h.fill(); h.setLookup(async () => auth(B));
  await h.submit(); await h.settle(); assert.equal(h.calls.filter(([n]) => n === "criar_problema_tecnico").length, 0);
  assert.equal(h.value.tituloProblema, ""); assert.equal(h.value.mensagemProblema, ""); h.stop();
});

test("conclusão de envio antigo não confirma sucesso nem destrava novo envio de B", async () => {
  const first = deferred(), second = deferred(); const h = harness({ create: () => first.promise });
  await h.ready(); await h.fill(); const old = h.submit(); await h.settle();
  h.event(B); await h.settle(); await h.fill(); h.setCreate(() => second.promise);
  const current = h.submit(); await h.settle(); first.resolve(receipt); await old; await h.settle();
  assert.equal(h.value.enviandoProblema, true); assert.ok(h.value.tituloProblema); assert.equal(h.value.mensagemProblema, "");
  second.resolve(receipt); await current; await h.settle(); assert.equal(h.value.enviandoProblema, false); h.stop();
});

test("callback de submit capturado em A não envia após trocar a conta", async () => {
  const h = harness(); await h.ready(); await h.fill(); const old = h.value.enviarProblemaTecnico;
  h.event(B); await h.settle(); await old({ preventDefault() {} }); await h.settle();
  assert.equal(h.calls.filter(([n]) => n === "criar_problema_tecnico").length, 0); h.stop();
});

for (const stage of ["auth", "list", "create"]) {
  test(`desmontagem durante ${stage} ignora setters e novas consultas`, async () => {
    const gate = deferred(); const h = harness(); await h.ready();
    let pending;
    if (stage === "auth") { h.setLookup(() => gate.promise); pending = h.value.recarregarChamados(); }
    if (stage === "list") { h.setList(() => gate.promise); pending = h.value.recarregarChamados(); }
    if (stage === "create") { await h.fill(); h.setCreate(() => gate.promise); pending = h.submit(); }
    await h.settle(); h.stop(); const count = h.calls.length;
    gate.resolve(stage === "auth" ? auth(A) : stage === "list" ? { data: [row()], error: null } : receipt);
    await pending; await h.settle();
    assert.deepEqual(h.updatesAfterUnmount, []); assert.equal(h.calls.length, count); assert.equal(h.unsubscriptions, 1);
  });
}

const responses = load("app/ajuda/lib/ajuda-support-responses.ts");
test("recibo exige uma linha, UUID, status e data; erros desconhecidos não certificam rollback", () => {
  assert.equal(responses.criacaoConfirmada(receipt.data), true);
  for (const data of [null, [], [...receipt.data, ...receipt.data], [{}], [{ ...receipt.data[0], problema_id: "" }], [{ ...receipt.data[0], problema_status: "unknown" }], [{ ...receipt.data[0], problema_criado_em: "invalid" }]]) assert.equal(responses.criacaoConfirmada(data), false);
  for (const code of ["40003", "08006", "PGRST000", "503", ""]) assert.equal(responses.criacaoRejeitada({ code }), false);
  assert.equal(responses.criacaoRejeitada({ code: "P0001" }), true);
});


test("replay de efeitos não permite que a primeira sessão restaure dados antigos", async () => {
  const gate = deferred(); const h = harness({ getUser: () => gate.promise });
  h.render(); await h.settle(); h.setLookup(async () => auth(B)); h.restartEffects(); await h.settle();
  const count = h.calls.length; gate.resolve(auth(A)); await h.settle();
  assert.equal(h.calls.length, count); assert.equal(h.value.usuarioAutenticado, true);
  assert.equal(h.value.carregandoChamados, false); h.stop(); assert.equal(h.unsubscriptions, 2);
});

test("incerteza continua bloqueando o mesmo relato após A → B → A", async () => {
  const h = harness({ create: async () => ({ data: null, error: null }) }); await h.ready(); await h.fill();
  await h.submit(); await h.settle(); h.event(B); await h.settle(); h.event(A); await h.settle();
  await h.fill(); await h.submit(); await h.settle();
  assert.equal(h.calls.filter(([n]) => n === "criar_problema_tecnico").length, 1);
  assert.equal(h.value.envioIncerto, true); assert.equal(h.value.mensagemProblema, ""); h.stop();
});

test("título e descrição inválidos não consultam Auth ou RPC", async () => {
  const h = harness(); await h.ready(); const count = h.calls.length;
  h.value.setTituloProblema("curto"); h.render(); await h.submit(); await h.settle();
  assert.match(h.value.erroProblema, /8 caracteres/);
  h.value.setTituloProblema("Título válido"); h.render(); await h.submit(); await h.settle();
  assert.match(h.value.erroProblema, /20 caracteres/); assert.equal(h.calls.length, count); h.stop();
});

test("idioma não consulta novamente; falhas/retries usam a tradução atual", async () => {
  const h = harness(); await h.ready(); const count = h.calls.length;
  h.render("en"); await h.settle(); assert.equal(h.calls.length, count);
  h.setList(async () => { throw new Error("offline"); });
  await h.value.recarregarChamados(); await h.settle(); assert.match(h.value.erroChamados, /^Could not refresh/);
  h.render("es"); await h.settle(); await h.value.recarregarChamados(); await h.settle();
  assert.match(h.value.erroChamados, /^No se pudieron actualizar/); h.stop();
});

test("evento de logout sem navegação limpa lista válida e rascunho", async () => {
  const h = harness(); await h.ready(); await h.fill();
  assert.equal(h.value.chamadosTecnicos[0].id, ID);
  h.event(null); await h.settle();
  assert.deepEqual(h.value.chamadosTecnicos, []);
  assert.equal(h.value.tituloProblema, "");
  assert.equal(h.value.usuarioAutenticado, false); h.stop();
});
