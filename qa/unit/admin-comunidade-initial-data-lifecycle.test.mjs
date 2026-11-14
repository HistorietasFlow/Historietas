import assert from "node:assert/strict";
import test from "node:test";
import {loadApplicationModule as load} from "../helpers/load-application-module.mjs";
import {adiarModeracao, denunciaModeracao, tickModeracao} from "../helpers/admin-moderacao-harness.mjs";

function harness(t) {
  const values = [], updates = [], access = [], reports = [], profiles = [], counts = [], messages = {}, redirects = [];
  let index = 0, cleanup, callback, unsubscribed = false;
  const pending = list => () => {const d = adiarModeracao(); list.push(d); return d.promise;};
  const react = {
    useState(initial) {
      const i = index++; values[i] = initial;
      return [values[i], next => {values[i] = typeof next === "function" ? next(values[i]) : next; updates.push([i, values[i]]);}];
    },
    useEffect(fn) {cleanup = fn();},
  };
  const control = {current: null};
  const {useAdminComunidadeInitialData: hook} = load("app/admin/comunidade/hooks/use-admin-comunidade-initial-data.ts", {
    react,
    "../../../../lib/supabase/client": {supabase: {auth: {onAuthStateChange(fn) {callback = fn; return {data: {subscription: {unsubscribe() {unsubscribed = true;}}}};}}}},
    "../loaders/verificar-acesso-moderacao": {verificarAcessoModeracao: pending(access)},
    "../loaders/carregar-denuncias-contexto-moderacao": {carregarDenunciasComContextoModeracao: pending(reports)},
    "../loaders/carregar-denuncias-perfis-moderacao": {buscarDenunciasPerfisModeracao: pending(profiles)},
    "../loaders/carregar-reincidencias-moderacao": {buscarReincidenciasModeracao: pending(counts)},
  });
  const props = {router: {replace: href => redirects.push(href)}, controleModeracao: control};
  for (const name of ["setErro", "setSucesso", "setAcaoEmAndamento", "setMenuDenunciaAbertoId"]) props[name] = v => {messages[name] = v; updates.push([name, v]);};
  const result = hook(props);
  t.after(() => cleanup());
  const auth = async (n, id, admin = true) => {access[n].resolve({user: id ? {id} : null, adminConfirmado: !!id && admin}); await tickModeracao();};
  const finish = async (n, id) => {reports[n].resolve([denunciaModeracao({id})]); profiles[n].resolve([{id: `perfil-${id}`}]); counts[n].resolve({[id]: 1}); await tickModeracao();};
  return {values, updates, access, reports, profiles, counts, messages, control, result, auth, finish, redirects,
    event(id) {callback(id ? "SIGNED_IN" : "SIGNED_OUT", id ? {user: {id}} : null);}, unmount() {cleanup();}, get unsubscribed() {return unsubscribed;}};
}

test("logout invalida ação e apaga dados, observações, mensagens e menus antes de nova leitura", async t => {
  const h = harness(t); await h.auth(0, "A"); await h.finish(0, "d1");
  h.result.setObservacoes({d1: "Privado"}); h.messages.setSucesso = "Sucesso antigo";
  const old = h.control.current; old.acao = Symbol();
  h.event("");
  assert.equal(old.ativo, false); assert.deepEqual(h.values.slice(1, 7), ["", false, [], [], {}, {}]);
  for (const value of Object.values(h.messages)) assert.equal(value, "");
  await h.auth(1, ""); assert.equal(h.values[0], false); assert.equal(h.redirects.length, 1);
});
for (const failure of [false, true]) {
  test(`A-B-A descarta ${failure ? "erro" : "lista"} antiga e preserva nova identidade`, async t => {
    const h = harness(t); await h.auth(0, "A"); h.event("B"); await h.auth(1, "B"); h.event("A"); await h.auth(2, "A");
    await h.finish(2, "nova");
    if (failure) h.reports[0].reject(new Error("Erro antigo")); else await h.finish(0, "antiga");
    await h.finish(1, "outra"); await tickModeracao();
    assert.equal(h.values[1], "A"); assert.equal(h.values[3][0].id, "nova"); assert.equal(h.messages.setErro, ""); assert.equal(h.values[0], false);
  });
}
test("desmontagem cancela setters de todos os carregadores e remove assinatura de auth", async t => {
  const h = harness(t); await h.auth(0, "A"); h.unmount(); const before = h.updates.length;
  await h.finish(0, "tardia"); assert.equal(h.updates.length, before); assert.equal(h.unsubscribed, true);
});
test("ação invalida leitura antiga sem deixar carregamento preso", async t => {
  const h = harness(t); await h.auth(0, "A");
  const {iniciarAcaoModeracao} = load("app/admin/comunidade/lib/admin-comunidade-action-control.ts", {"../loaders/verificar-acesso-moderacao": {}});
  assert.ok(iniciarAcaoModeracao(h.control, "A", true));
  h.result.setDenuncias([denunciaModeracao({id: "confirmada"})]);
  await h.finish(0, "obsoleta"); assert.equal(h.values[3][0].id, "confirmada"); assert.equal(h.values[0], false);
});
test("usuário sem validação administrativa não carrega denúncias", async t => {
  const h = harness(t); await h.auth(0, "leitor", false);
  assert.equal(h.values[2], false); assert.equal(h.control.current.ehAdmin, false); assert.equal(h.reports.length, 0); assert.equal(h.values[0], false);
});
test("erro de acesso libera carregamento e não deixa contexto administrativo válido", async t => {
  const h = harness(t); h.access[0].reject(new Error("Sem rede")); await tickModeracao();
  assert.match(h.messages.setErro, /Sem rede/); assert.equal(h.values[0], false); assert.equal(h.control.current.ehAdmin, false);
});
