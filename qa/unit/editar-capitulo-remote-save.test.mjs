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
        const row = {...base, titulo: "Novo", texto: "Texto novo privado", atualizado_em: "2026-11-14T00:00:00.000002+00:00"};
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
    assert.equal(requests.length, 1, "PATCH não é repetido pelo hook nem pelo SDK");
    const {url, options} = requests[0];
    assert.equal(options.method, "PATCH"); assert.equal(new Headers(options.headers).get("Prefer"), "return=representation");
    for (const key of ["id", "obra_id", "user_id", "atualizado_em", "ordem", "publicado", "tipo_conteudo"]) assert.equal(url.searchParams.get(key), `eq.${base[key]}`);
    assert.equal(url.searchParams.has("texto"), false);
    assert.equal(JSON.parse(options.body).texto, "Texto novo privado");
  });
}
