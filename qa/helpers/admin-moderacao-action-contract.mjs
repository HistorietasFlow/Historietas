import assert from "node:assert/strict";
import test from "node:test";
import {loadApplicationModule as load} from "./load-application-module.mjs";
import {denunciaModeracao} from "./admin-moderacao-harness.mjs";

// Contratos dos adaptadores; as queries reais são exercitadas com o SDK e fetch local.
export function testarAdaptadorModeracao({file, name, profile = false, resolved = false, params, payload}) {
  const esperada = profile ? {id: "d1", status: resolved ? "resolvida" : "pendente", atualizadoEm: "2026-11-13T00:00:00Z"} : denunciaModeracao({status: resolved ? "resolvida" : "pendente"});
  const args = {denunciaId: "d1", esperada, ...params};
  const dependency = profile ? "../lib/admin-comunidade-profile-write" : "../lib/admin-comunidade-confirmed-write";
  const writer = profile ? "escreverPerfilModeracao" : "escreverEstadoDenunciaModeracao";
  function action(fn) {return load(`app/admin/comunidade/actions/${file}.ts`, {[dependency]: {[writer]: fn}})[name];}
  test(`${file}: encaminha snapshot e payload limitados, retorna confirmação sem fabricar estado`, async () => {
    const calls = [], receipt = {...esperada, atualizadoEm: "2026-11-14T00:00:00Z"};
    const result = await action(async (...values) => {calls.push(values); return receipt;})(args);
    assert.deepEqual(calls, [[esperada, payload]]); assert.equal(result, receipt);
  });
  test(`${file}: propaga falha sem confirmar nem repetir escrita`, async () => {
    const error = new Error("Falha na persistência"); let calls = 0;
    await assert.rejects(() => action(async () => {calls++; throw error;})(args), error);
    assert.equal(calls, 1);
  });
  test(`${file}: identidade do registro divergente impede escrita`, async () => {
    let calls = 0;
    await assert.rejects(() => action(async () => {calls++;})({...args, denunciaId: "outro"}));
    assert.equal(calls, 0);
  });
  if (resolved) test(`${file}: denúncia não resolvida não autoriza exclusão`, async () => {
    let calls = 0;
    await assert.rejects(() => action(async () => {calls++;})({...args, esperada: {...esperada, status: "pendente"}}));
    assert.equal(calls, 0);
  });
}
