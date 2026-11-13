import assert from "node:assert/strict";
import test from "node:test";
import {createClient} from "@supabase/supabase-js";
import {loadApplicationModule} from "../helpers/load-application-module.mjs";

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function preparar(responder) {
  const queries = [];
  const {buscarUsuariosParaSeguirSupabase} = loadApplicationModule("app/seguindo/lib/seguindo-user-search-utils.ts", {
    "../../../lib/supabase/client": {supabase: {from(table) {
      const query = {table}; queries.push(query);
      return {select(campos) {query.campos = campos; return {
        ilike(coluna, padrao) {Object.assign(query, {coluna, padrao}); return {
          async limit(limite) {query.limite = limite; return responder(query);},
        };},
      };}};
    }}},
  });
  return {queries, buscar: buscarUsuariosParaSeguirSupabase};
}

test("termo sem duas letras após retirar curingas não gera consulta ampla", async () => {
  const h = preparar(() => {throw new Error("Não deve consultar");});
  for (const termo of ["", "a", "@@", "%_", "@_%a", "  @_%  "]) assert.deepEqual(await h.buscar(termo), []);
  assert.deepEqual(h.queries, []);
});

test("consulta e filtro local usam o mesmo termo seguro, sem descartar resultado válido", async () => {
  const h = preparar(() => ({data: [{user_id: id(1), nome: "Ana Silva", username: "ana"}], error: null}));
  const users = await h.buscar("  @Ana_%  ");
  assert.equal(users.length, 1);
  assert.equal(users[0].id, id(1));
  assert.deepEqual(h.queries.map(q => [q.table, q.coluna, q.padrao, q.limite]), [
    ["profiles", "nome", "%Ana%", 20], ["profiles", "username", "%Ana%", 20], ["profiles", "nome_usuario", "%Ana%", 20],
  ]);
  assert.deepEqual(h.queries.map(q => q.campos), ["id,user_id,nome,avatar_url", "id,user_id,nome,avatar_url,username", "id,user_id,nome,avatar_url,nome_usuario"]);
});

test("deduplicação, IDs válidos, handles, ordenação e limite de 12 são preservados", async () => {
  const rows = Array.from({length: 18}, (_, i) => ({user_id: id(i + 1), nome: `Ana ${String(i).padStart(2, "0")}`}));
  const h = preparar(() => ({data: [...rows, rows[0], {user_id: "invalido", nome: "Ana"}, {user_id: id(40)}, null, []], error: null}));
  const result = await h.buscar("ana");
  assert.equal(result.length, 12);
  assert.equal(new Set(result.map(user => user.id)).size, 12);
  assert.deepEqual(result.map(user => user.nome), rows.slice(0, 12).map(row => row.nome));
  assert.equal(result[0].handle, "@ana.00");
});

test("falha de coluna opcional mantém resultados das consultas válidas sem ampliar acesso", async () => {
  const h = preparar(query => {
    if (query.coluna === "nome_usuario") throw new Error("Resposta perdida");
    if (query.coluna === "username") return {data: null, error: {code: "42703"}};
    return {data: [{user_id: id(1), nome: "Ana"}], error: null};
  });
  assert.deepEqual((await h.buscar("ana")).map(user => user.id), [id(1)]);
  assert.equal(h.queries.length, 3);
});

test("erro remoto total ou retorno inválido não reusa dados nem consulta outro recurso", async () => {
  for (const responder of [() => {throw new Error("Falha remota");},
    () => ({data: null, error: {code: "42501"}}), () => ({data: {}, error: null})]) {
    const h = preparar(responder);
    assert.deepEqual(await h.buscar("ana"), []);
    assert.equal(h.queries.length, 3);
    assert.equal(h.queries.every(query => query.table === "profiles" && query.limite === 20), true);
  }
});

for (const cenario of ["sucesso", "negado", "rede"]) {
  test(`SDK real com HTTP controlado: ${cenario} mantém somente as leituras autorizadas de profiles`, async () => {
    const requests = [];
    const client = createClient("http://127.0.0.1:59999", "chave-ficticia-de-teste", {
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
      global: {fetch: async (url, options) => {
        requests.push({url: new URL(url), method: options.method, retry: new Headers(options.headers).get("X-Retry-Count")});
        if (cenario === "rede") throw new TypeError("Falha de rede");
        return new Response(JSON.stringify(cenario === "negado"
          ? {code: "42501", message: "Acesso negado"}
          : [{user_id: id(1), nome: "Ana"}]), {
          status: cenario === "negado" ? 403 : 200, headers: {"Content-Type": "application/json"},
        });
      }},
    });
    const {buscarUsuariosParaSeguirSupabase} = loadApplicationModule("app/seguindo/lib/seguindo-user-search-utils.ts", {
      "../../../lib/supabase/client": {supabase: client},
    });
    const users = await buscarUsuariosParaSeguirSupabase(" @ana_% ");
    assert.equal(users.length, cenario === "sucesso" ? 1 : 0);
    // O SDK instalado já repete GETs com falha de transporte até três vezes.
    // Preservar esse contrato; o helper não adiciona tentativas próprias.
    assert.equal(requests.length, cenario === "rede" ? 12 : 3);
    for (const {url, method} of requests) {
      assert.equal(method, "GET");
      assert.equal(url.pathname, "/rest/v1/profiles");
      assert.equal(url.searchParams.get("limit"), "20");
      assert.equal(["nome", "username", "nome_usuario"].some(coluna => url.searchParams.get(coluna) === "ilike.%ana%"), true);
    }
    for (const coluna of ["nome", "username", "nome_usuario"]) {
      assert.deepEqual(requests.filter(request => request.url.searchParams.has(coluna)).map(request => request.retry),
        cenario === "rede" ? [null, "1", "2", "3"] : [null]);
    }
  });
}
