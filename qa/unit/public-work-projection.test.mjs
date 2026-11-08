import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../../lib/server/agendamento/ler-projecao-publica.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const id = "bf200000-0000-4000-8000-000000000001";
function load(result) {
  const calls = [], mod = { exports: {} };
  new Function("require", "module", "exports", "fetch", code)((name) => {
    if (name === "server-only") return {};
    assert.equal(name, "../../supabase/public");
    return { criarSupabasePublicClient: (options) => ({ rpc: async (name, args) => {
      calls.push({ name, args });
      await options.fetch("http://127.0.0.1/rpc", { method: "POST", headers: { apikey: "local-test" } });
      if (result instanceof Error) throw result;
      return result;
    } }) };
  }, mod, mod.exports, async (url, init) => { calls.push({ url, init }); return new Response("{}"); });
  return { read: mod.exports.lerProjecaoPublicaObra, calls };
}
const snapshot = { estado: "obra_publica", obraId: id, geracao: id, revisao: "9007199254740993", slug: "qa", obra: { titulo: "Obra" }, capitulo: null };

test("consulta autoritativa e sempre POST/no-store, sem memoizar barreiras nem perder precisao bigint", async () => {
  const { read, calls } = load({ data: snapshot, error: null });
  assert.deepEqual(await read("qa"), snapshot);
  assert.equal((await read("qa")).revisao, "9007199254740993");
  assert.equal(calls.length, 4);
  assert.deepEqual(calls[0], { name: "obter_projecao_publica_obra", args: { p_slug: "qa", p_numero: null } });
  for (const call of [calls[1], calls[3]]) {
    assert.equal(call.init.cache, "no-store"); assert.equal(call.init.method, "POST");
    assert.equal(call.init.headers.apikey, "local-test");
  }
});
test("ausencia publica e ausencia de capitulo sao distintas sem inventar revisao", async () => {
  assert.deepEqual(await load({ data: { estado: "obra_indisponivel", privado: "nao retornar" }, error: null }).read("qa"), { estado: "obra_indisponivel" });
  const value = { ...snapshot, estado: "capitulo_indisponivel" };
  assert.deepEqual(await load({ data: value, error: null }).read("qa", 2), value);
  const published = { ...snapshot, estado: "capitulo_publico", capitulo: { id, ordem: 2, titulo: "Dois", texto: "Texto" } };
  assert.deepEqual(await load({ data: published, error: null }).read("qa", 2), published);
});
test("falhas remotas, transporte e contratos invalidos nunca viram ausencia/404", async () => {
  const remote = { message: "indisponivel", code: "57014" };
  await assert.rejects(load({ data: null, error: remote }).read("qa"), (err) => err === remote);
  await assert.rejects(load(new Error("rede")).read("qa"), /rede/);
  for (const data of [null, {}, { ...snapshot, revisao: 1 }, { ...snapshot, geracao: "antiga" }, { ...snapshot, slug: "outra" }, { ...snapshot, capitulo: {} }]) {
    await assert.rejects(load({ data, error: null }).read("qa"), /Resposta.*invalida/);
  }
  const { read, calls } = load({ data: snapshot, error: null });
  for (const n of [0, -1, 1.5, 2147483648]) await assert.rejects(read("qa", n), RangeError);
  assert.equal(calls.length, 0);
});
