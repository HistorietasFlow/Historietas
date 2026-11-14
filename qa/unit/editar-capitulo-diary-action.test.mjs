import assert from "node:assert/strict";
import test from "node:test";
import {createClient} from "@supabase/supabase-js";
import {loadApplicationModule as load} from "../helpers/load-application-module.mjs";
const capituloId = "00000000-0000-4000-8000-000000000001", versao = "00000000-0000-4000-8000-000000000002";
for (const [scenario, expected] of [["uuid", "confirmado"], ["null", "incerto"], ["vazia-200", "incerto"], ["55000", "indisponivel"], ["PGRST202", "indisponivel"], ["42883", "indisponivel"], ["PT409", "conflito"], ["42501", "conflito"], ["rede", "incerto"], ["503", "incerto"], ["204", "incerto"], ["invalida", "incerto"]]) {
  test(`RPC Diário ${scenario}: somente IDs e um POST`, async () => {
    const requests = [];
    const client = createClient("http://127.0.0.1:59999", "chave-ficticia", {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}, global: {fetch: async (url, options) => {
      requests.push({url: new URL(url), options});
      if (scenario === "rede") throw new TypeError("Resposta perdida");
      if (scenario === "vazia-200") return new Response(null, {status: 200});
      if (scenario === "204") return new Response(null, {status: 204});
      const success = ["uuid", "null", "invalida"].includes(scenario);
      const body = scenario === "uuid" ? capituloId : scenario === "null" ? null : scenario === "invalida" ? {id: capituloId} : {code: scenario, message: "Recusado"};
      return new Response(JSON.stringify(body), {status: success ? 200 : ({PGRST202: 404, "42883": 404, "55000": 400, PT409: 409, "42501": 403}[scenario] || 503), headers: {"Content-Type": "application/json"}});
    }}});
    const {registrarDiarioEdicaoCapitulo} = load("app/editar-capitulo/actions/registrar-diario-edicao-capitulo.ts", {"../../../lib/supabase/client": {supabase: client}});
    assert.equal(await registrarDiarioEdicaoCapitulo({capituloId, versao}), expected);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url.pathname, "/rest/v1/rpc/registrar_diario_edicao_capitulo");
    assert.equal(requests[0].options.method, "POST");
    assert.deepEqual(JSON.parse(requests[0].options.body), {p_capitulo_id: capituloId, p_versao: versao});
  });
}
test("token ou capítulo inválidos não disparam RPC", async () => {
  const {registrarDiarioEdicaoCapitulo} = load("app/editar-capitulo/actions/registrar-diario-edicao-capitulo.ts", {"../../../lib/supabase/client": {supabase: {rpc() {assert.fail("RPC inesperada");}}}});
  assert.equal(await registrarDiarioEdicaoCapitulo({capituloId, versao: "invalido"}), "conflito");
  assert.equal(await registrarDiarioEdicaoCapitulo({capituloId: "local", versao}), "conflito");
});
