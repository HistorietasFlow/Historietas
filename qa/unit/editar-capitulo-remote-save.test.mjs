import assert from "node:assert/strict";
import test from "node:test";
import {createClient} from "@supabase/supabase-js";
import {loadApplicationModule} from "../helpers/load-application-module.mjs";

const base = {id: "capitulo", obra_id: "obra", user_id: "A", titulo: "Antigo", texto: "Texto privado original",
  ordem: 2, publicado: false, tipo_conteudo: "texto", atualizado_em: "2026-11-13T00:00:00.000001+00:00"};
for (const cenario of ["sucesso", "rejeitado", "rede", "http", "zero", "nulo", "outro", "imagens", "versao-antiga"]) {
  test(`SDK real, resposta ${cenario}: referência, identidade e resultado conservador`, async () => {
    const requests = [];
    const client = createClient("http://127.0.0.1:59999", "chave-ficticia", {
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
      global: {fetch: async (url, options) => {
        requests.push({url: new URL(url), options});
        if (cenario === "rede") throw new TypeError("Resposta perdida");
        const row = {...base, metadata: {privada: "não persistir"}, diario_edicao_versao: "11111111-1111-4111-8111-111111111111", titulo: "Novo", texto: "Texto novo privado", atualizado_em: "2026-11-14T00:00:00.000002+00:00"};
        if (cenario === "versao-antiga") row.atualizado_em = base.atualizado_em;
        const result = cenario === "zero" ? [] : cenario === "nulo" ? null :
          [{...row, ...(cenario === "outro" ? {user_id: "B"} : {}), ...(cenario === "imagens" ? {tipo_conteudo: "imagens"} : {})}];
        return new Response(JSON.stringify(cenario === "rejeitado" ? {code: "42501", message: "Recusado"} : cenario === "http" ? {message: "Gateway"} : result), {
          status: cenario === "rejeitado" ? 403 : cenario === "http" ? 503 : 200, headers: {"Content-Type": "application/json"},
        });
      }},
    });
    const {salvarTextoCapituloRemoto} = loadApplicationModule("app/editar-capitulo/lib/editar-capitulo-remote-save.ts", {
      "../../../lib/supabase/client": {supabase: client},
    });
    const result = await salvarTextoCapituloRemoto(base, "Novo", "Texto novo privado");
    assert.equal(result.estado, cenario === "sucesso" ? "confirmado" : cenario === "rejeitado" ? "rejeitado" : cenario === "zero" ? "conflito" : "incerto");
    if (result.estado === "confirmado") {
      assert.equal(result.versaoDiario, "11111111-1111-4111-8111-111111111111");
      assert.equal("metadata" in result.referencia, false);
      assert.equal("diario_edicao_versao" in result.referencia, false);
    }
    else assert.equal("versaoDiario" in result, false, "PATCH incerto não fornece token de intenção");
    assert.equal(requests.length, 1, "PATCH não é repetido pelo hook nem pelo SDK");
    const {url, options} = requests[0];
    assert.equal(url.searchParams.get("select"), "*");
    assert.equal(options.method, "PATCH"); assert.equal(new Headers(options.headers).get("Prefer"), "return=representation");
    for (const key of ["id", "obra_id", "user_id", "atualizado_em", "ordem", "publicado", "tipo_conteudo"]) assert.equal(url.searchParams.get(key), `eq.${base[key]}`);
    assert.equal(url.searchParams.has("texto"), false);
    assert.equal(JSON.parse(options.body).texto, "Texto novo privado");
  });
}

for (const token of [undefined, null, "invalido", "22222222-2222-4222-8222-222222222222"]) {
  test(`retorno opcional de token ${token}: compatibilidade em um único PATCH`, async () => {
    let calls = 0;
    const client = createClient("http://127.0.0.1:59999", "chave-ficticia", {
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
      global: {fetch: async () => {calls++; return new Response(JSON.stringify([{...base, titulo: "Novo", texto: "Novo texto", atualizado_em: "2026-11-14T00:00:00.000002+00:00", diario_edicao_versao: token}]), {status: 200, headers: {"Content-Type": "application/json"}});}},
    });
    const {salvarTextoCapituloRemoto} = loadApplicationModule("app/editar-capitulo/lib/editar-capitulo-remote-save.ts", {"../../../lib/supabase/client": {supabase: client}});
    const result = await salvarTextoCapituloRemoto({...base, diario_edicao_versao: "99999999-9999-4999-8999-999999999999"}, "Novo", "Novo texto");
    assert.equal(result.estado, "confirmado"); assert.equal(result.versaoDiario, token?.startsWith("2222") ? token : null); assert.equal(calls, 1);
  });
}
test("PATCH sem mudança efetiva não reaproveita token de uma edição anterior", async () => {
  const client = createClient("http://127.0.0.1:59999", "chave-ficticia", {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}, global: {fetch: async () => new Response(JSON.stringify([{...base, atualizado_em: "2026-11-14T00:00:00.000002+00:00", diario_edicao_versao: "33333333-3333-4333-8333-333333333333"}]), {status: 200, headers: {"Content-Type": "application/json"}})}});
  const {salvarTextoCapituloRemoto} = loadApplicationModule("app/editar-capitulo/lib/editar-capitulo-remote-save.ts", {"../../../lib/supabase/client": {supabase: client}});
  const result = await salvarTextoCapituloRemoto(base, base.titulo, base.texto);
  assert.equal(result.estado, "confirmado"); assert.equal(result.versaoDiario, null);
});
