import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {loadApplicationModule as load} from "../helpers/load-application-module.mjs";

const version = "00000000-0000-4000-8000-000000000001";
const confirmado = {id: "obra", userId: "A", status: null, versao: version};
const retorno = {id: "obra", user_id: "A", status_editorial: "concluida", status_editorial_versao: version};

function setup({data = [retorno], error = null, rejeitar = false, depois} = {}) {
  const calls = [];
  const query = {
    update(payload) {calls.push(["update", payload]); return query;},
    eq(key, value) {calls.push(["eq", key, value]); return query;},
    is(key, value) {calls.push(["is", key, value]); return query;},
    async select(fields) {
      calls.push(["select", fields]);
      if (depois) await depois();
      if (rejeitar) throw new TypeError("Resposta perdida");
      return {data, error};
    },
  };
  const client = {from(table) {calls.push(["from", table]); return query;}};
  return {calls, client, ...load("app/editar-obra/lib/editar-obra-editorial-write.ts")};
}
const parameters = (extra = {}) => ({id: "obra", userId: "A", payload: {sinopse: "Outro campo"},
  editorial: {confirmado, escolha: "concluida"}, ...extra});

test("um UPDATE protege todos os campos por id, dono e UUID; versão nunca é payload", async () => {
  const s = setup();
  const result = await s.escreverMetadadosObra(s.client, parameters());
  assert.equal(result.estado, "confirmada");
  assert.deepEqual(s.calls, [["from", "obras"], ["update", {sinopse: "Outro campo", status_editorial: "concluida"}],
    ["eq", "id", "obra"], ["eq", "user_id", "A"], ["eq", "status_editorial_versao", version],
    ["select", "id,user_id,status_editorial,status_editorial_versao"]]);
  assert.equal(result.confirmacao.status, "concluida");
});

test("NULL confirmado usa IS NULL; ausência/versão inválida/identidade diferente não executam", async () => {
  const s = setup();
  await s.escreverMetadadosObra(s.client, parameters({editorial: {confirmado: {...confirmado, versao: null}, escolha: null}}));
  assert.deepEqual(s.calls[4], ["is", "status_editorial_versao", null]);
  for (const patch of [{versao: undefined}, {versao: ""}, {status: undefined}, {id: "outra"}, {userId: "B"}]) {
    const invalid = setup();
    assert.equal((await invalid.escreverMetadadosObra(invalid.client, parameters({editorial: {confirmado: {...confirmado, ...patch}, escolha: "pausada"}}))).estado, "contexto_invalido");
    assert.equal(invalid.calls.length, 0);
  }
});

test("salvamento não editorial omite status e CAS, sem sobrescrever outra sessão", async () => {
  const s = setup();
  assert.equal((await s.escreverMetadadosObra(s.client, parameters({editorial: undefined}))).estado, "confirmada");
  assert.deepEqual(s.calls[1], ["update", {sinopse: "Outro campo"}]);
  assert.equal(s.calls.some(call => call[1] === "status_editorial_versao"), false);
});

test("SQLSTATE, zero linhas, transporte, cardinalidade e retorno inválido são resultados distintos", async () => {
  for (const [options, expected] of [
    [{error: {code: "42501"}}, "rejeitada"], [{data: []}, "sem_linha"],
    [{error: {code: "", message: "Network Error"}}, "incerta"], [{error: {code: "503"}}, "incerta"],
    [{rejeitar: true}, "incerta"], [{data: null}, "incerta"], [{data: [retorno, retorno]}, "incerta"],
    [{data: [{id: "obra"}]}, "incerta"], [{data: [{...retorno, user_id: "B"}]}, "incerta"],
  ]) {
    const s = setup(options);
    assert.equal((await s.escreverMetadadosObra(s.client, parameters())).estado, expected);
    assert.equal(s.calls.filter(c => c[0] === "update").length, 1, "nenhum retry");
  }
});

test("resposta antiga/conta anterior não confirma, inclusive após retorno A→B→A", async () => {
  let incarnation = 1;
  const original = incarnation;
  const s = setup({depois: async () => {incarnation++; incarnation++;}});
  assert.equal((await s.escreverMetadadosObra(s.client, parameters({vigente: () => incarnation === original}))).estado, "contexto_invalido");
});

test("payload não pode contornar o protocolo com status ou versão", async () => {
  for (const key of ["status_editorial", "status_editorial_versao"]) {
    const s = setup();
    assert.equal((await s.escreverMetadadosObra(s.client, parameters({payload: {[key]: null}}))).estado, "contexto_invalido");
    assert.deepEqual(s.calls, []);
  }
});

test("wrapper real não faz cleanup em rejeição, zero linhas ou resposta incerta", async () => {
  for (const options of [{error: {code: "42501"}}, {data: []}, {rejeitar: true}, {}]) {
    const s = setup(options);
    const {atualizarObraRemotaEdicaoObra} = load("app/editar-obra/lib/editar-obra-remote-update.ts", {
      "../../../lib/supabase/client": {supabase: s.client},
    });
    const result = await atualizarObraRemotaEdicaoObra({
      obraId: "obra", userId: "A", tituloFinal: "Título", autorFinal: "Autor", generoFinalSalvo: "Fantasia",
      formatoFinalSalvo: "HQ", classificacaoFinal: "Livre", avisosConteudoFinal: [], sinopseFinal: "Sinopse",
      tagsFinais: [], capaFinal: "", capaNomeFinal: "", arquivoObraFinal: null, agora: "2026-11-13",
      arquivosNovosEnviados: [{bucket: "capas-obras", caminho: "A/novo.png", referencia: "novo"}],
    });
    assert.ok(result.estado);
    assert.equal(s.calls.filter(c => c[0] === "update").length, 1);
  }
  const source = readFileSync(new URL("../../app/editar-obra/lib/editar-obra-remote-update.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /removerArquivosStorageEdicaoObra|\.remove\(|localStorage/);
  const hook = readFileSync(new URL("../../app/editar-obra/hooks/use-editar-obra-save-action.ts", import.meta.url), "utf8");
  assert.ok(hook.indexOf('resultadoRemoto.estado !== "confirmada"') < hook.indexOf("await removerArquivosStorageEdicaoObra(arquivosAntigosParaRemover)"));
  assert.ok(hook.indexOf('if (!capturaEditorial.vigente()) return;', hook.indexOf("await removerArquivosStorageEdicaoObra(arquivosAntigosParaRemover)")) < hook.indexOf("const novasObrasDoUsuario ="));
});
