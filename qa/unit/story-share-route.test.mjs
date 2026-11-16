import test from "node:test";
import assert from "node:assert/strict";
import { carregarFonteStory } from "../scripts/story-source-loader.mjs";

function route(available = true) {
  const calls = [];
  const load = carregarFonteStory({
    "../../../lib/server/stories/carregar-story-avaliacao": { carregarStoryAvaliacaoObra: async input => {
      calls.push(input); return available ? { estado: "disponivel", payload: { avaliacao: { nota: 4.5 } } } : { estado: "indisponivel" };
    } },
    "../../../lib/server/stories/gerar-story-avaliacao": { gerarStoryAvaliacao: async input => {
      calls.push(input); return available ? { estado: "gerado", png: Buffer.from([137,80,78,71]) } : { estado: "indisponivel" };
    } },
  });
  return { post: load("app/api/story-avaliacao/route.ts").POST, calls };
}
const request = (acao, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/story-avaliacao", {
  method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ slug: "obra", leitorId: "reader", acao }),
});
test("rota recusa origem externa e ação desconhecida antes do loader", async () => {
  const {post,calls} = route();
  assert.equal((await post(request("gerar","https://other.test"))).status,403);
  assert.equal((await post(request("inventar"))).status,400); assert.equal(calls.length,0);
});
test("confirmação devolve somente disponibilidade e nota, sem identidade/payload", async () => {
  const {post,calls} = route(); const response = await post(request("confirmar"));
  assert.deepEqual(await response.json(),{disponivel:true,nota:4.5});
  assert.deepEqual(calls,[{slug:"obra",leitorId:"reader"}]); assert.match(response.headers.get("cache-control"),/no-store/);
});
test("Host externo legítimo é preservado quando Next normaliza URL interna", async () => {
  const req = request("confirmar","http://127.0.0.1:3000");req.headers.set("host","127.0.0.1:3000");
  assert.equal((await route().post(req)).status,200);
  req.headers.set("origin","https://other.test");assert.equal((await route().post(req)).status,403);
});
test("geração devolve PNG privado com nome fixo", async () => {
  const response = await route().post(request("gerar"));
  assert.equal(response.status,200); assert.equal(response.headers.get("content-type"),"image/png");
  assert.equal(response.headers.get("vary"),"Cookie"); assert.match(response.headers.get("content-disposition"),/historietas-avaliacao.png/);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[137,80,78,71]);
});
test("recusa do loader/gerador não retorna PNG ou motivo privado", async () => {
  for (const action of ["confirmar","gerar"]) {
    const response = await route(false).post(request(action)); assert.equal(response.status,403);
    assert.deepEqual(await response.json(),{disponivel:false});
  }
});
