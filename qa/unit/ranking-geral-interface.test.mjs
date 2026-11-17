import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { carregarFonteStory } from "../scripts/story-source-loader.mjs";

const id = "00000000-0000-0000-0000-000000000001";
const assinatura = "a".repeat(32);
const row = { estado: "ok", obra_id: id, posicao: 1, nota_media: 4.5, total_avaliacoes: 4, assinatura, tem_mais: true };
const obra = { id, titulo: "História <segura>", slug: "historia" };
const contract = carregarFonteStory()("lib/ranking-geral-contract.ts");
function loader({ rows = [row], obras = [obra], error = null, obraError = null } = {}) {
  const calls = [];
  let fetchOptions;
  const query = {};
  for (const method of ["select", "in", "eq"]) query[method] = (...args) => { calls.push([method, ...args]); return query; };
  query.then = resolve => resolve({ data: obras, error: obraError });
  const client = {
    rpc: async (...args) => { calls.push(["rpc", ...args]); return { data: rows, error }; },
    from: table => { calls.push(["from", table]); return query; },
  };
  const load = carregarFonteStory({ "../supabase/public": { criarSupabasePublicClient: options => { fetchOptions = options; return client; } } });
  return { run: load("lib/server/ranking-geral.ts").carregarRankingGeral, calls, options: () => fetchOptions };
}

test("cursor exige par UUID/assinatura, sem parâmetros extras ou repetidos", () => {
  assert.equal(contract.lerCursorRanking(new URLSearchParams()), null);
  assert.deepEqual(contract.lerCursorRanking(new URLSearchParams({ obra: id, assinatura })), { obra: id, assinatura });
  for (const text of ["obra=x", `obra=${id}`, `assinatura=${assinatura}`, `obra=${id}&assinatura=${assinatura}&obra=${id}`, "limit=500", "user_id=private"]) {
    assert.throws(() => contract.lerCursorRanking(new URLSearchParams(text)));
  }
});
test("loader usa RPC fixa, cliente público e metadados restritos; não retorna pontuação ou identidades", async () => {
  const {run,calls} = loader(); const result = await run(null);
  assert.deepEqual(calls[0], ["rpc", "listar_ranking_geral", { p_apos_obra:null,p_assinatura:null,p_limite:20 }]);
  assert.deepEqual(calls.slice(1), [["from","obras"],["select","id,slug,titulo"],["in","id",[id]],["eq","publicado",true],["in","classificacao_indicativa",["Livre","10+","12+","14+","16+"]]]);
  assert.deepEqual(result, {estado:"ok",itens:[{id,slug:obra.slug,titulo:obra.titulo,posicao:1,nota:4.5,avaliacoes:4}],proximo:{obra:id,assinatura}});
});
test("cursor é encaminhado sem reconstrução de ordenação ou offset", async () => {
  const {run,calls} = loader(); await run({obra:id,assinatura});
  assert.deepEqual(calls[0][2],{p_apos_obra:id,p_assinatura:assinatura,p_limite:20});
});
test("stale e vazio não consultam metadados nem reutilizam páginas anteriores", async () => {
  for (const rows of [[],[{estado:"cursor_desatualizado"}]]) {
    const {run,calls} = loader({rows});
    assert.deepEqual(await run(null),rows.length ? {estado:"cursor_desatualizado"} : {estado:"ok",itens:[],proximo:null});
    assert.equal(calls.length,1);
  }
});
test("revogação de obra descarta a página; falhas não são vazio legítimo", async () => {
  assert.deepEqual(await loader({obras:[]}).run(null),{estado:"cursor_desatualizado"});
  for (const options of [{error:{message:"SECRET"}}, {obraError:{message:"SECRET"}}, {rows:null}, {rows:[{...row,nota_media:NaN}]}, {rows:[{...row,posicao:0}]}, {rows:[{...row,total_avaliacoes:0}]}, {rows:[row,row]}]) {
    await assert.rejects(loader(options).run(null),/ranking_indisponivel/);
  }
});
test("transporte Supabase é no-store e não injeta cookies ou sessão", async () => {
  const previous = globalThis.fetch; let captured;
  globalThis.fetch = async (...args) => { captured = args; return new Response("{}"); };
  try {
    const fixture = loader(); await fixture.run(null);
    await fixture.options().fetch("http://127.0.0.1/test",{method:"POST",headers:{apikey:"synthetic"}});
    assert.deepEqual(captured[1],{method:"POST",headers:{apikey:"synthetic"},cache:"no-store"});
    const source = readFileSync("lib/server/ranking-geral.ts","utf8");
    assert.match(source,/import "server-only"/);
    assert.doesNotMatch(source,/next\/headers|service_role|setSession|supabaseServer/);
  } finally { globalThis.fetch = previous; }
});
test("rota desligada não consulta; parâmetros inválidos 400; erro 503 sanitizado e no-store", async () => {
  const original = process.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW;
  let calls = 0;
  const GET = carregarFonteStory({"../../../lib/server/ranking-geral":{carregarRankingGeral:async () => {calls++; throw Error("SECRET SQL");}}})("app/api/ranking-geral/route.ts").GET;
  try {
    delete process.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW;
    assert.equal((await GET(new Request("http://localhost/api/ranking-geral"))).status,404);
    assert.equal(calls,0);
    process.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW="true";
    assert.equal((await GET(new Request("http://localhost/api/ranking-geral?obra=invalid"))).status,400);
    assert.equal(calls,0);
    const response = await GET(new Request("http://localhost/api/ranking-geral",{headers:{Authorization:"Bearer synthetic",Cookie:"synthetic"}}));
    assert.equal(response.status,503); assert.equal(response.headers.get("cache-control"),"no-store");
    assert.deepEqual(await response.json(),{estado:"indisponivel"}); assert.equal(calls,1);
  } finally { if (original === undefined) delete process.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW; else process.env.NEXT_PUBLIC_RANKING_GERAL_PREVIEW=original; }
});
function render(pagina, estado="pronto") {
  const states = [{cursor:null,versao:0},pagina,estado];
  const load = carregarFonteStory({react:{...React,useState:()=>[states.shift(),()=>{}],useEffect:()=>{},useRef:()=>({current:null})},"next/link":({href,children,style})=>React.createElement("a",{href,style},children)});
  return renderToStaticMarkup(React.createElement(load("app/em-alta/components/ranking-geral-historias.tsx").RankingGeralHistorias,{isDesktop:false}));
}
test("interface preserva meia estrela, posição e contagens; aviso somente de 1 a 4 votos", () => {
  for (const votos of [1,2,3,4,5,20]) {
    const html = render({estado:"ok",itens:[{id,slug:"historia",titulo:"<script>literal</script>",posicao:21,nota:4.5,avaliacoes:votos}],proximo:null});
    assert.match(html,/start="21"/); assert.match(html,/4,5/); assert.match(html,/&lt;script&gt;/);
    assert.equal(html.includes("Poucas avaliações"),votos<=4);
  }
});
test("carregamento, vazio, erro e cursor obsoleto têm mensagens acessíveis", () => {
  assert.match(render(null,"carregando"),/role="status"/);
  assert.match(render(null,"erro"),/role="alert"/);
  assert.match(render({estado:"ok",itens:[],proximo:null}),/Nenhuma história/);
  assert.match(render({estado:"cursor_desatualizado"}),/Reiniciar ranking/);
});
test("payload inválido, duplicações e cursor divergente são rejeitados", () => {
  for (const value of [null,{}, {estado:"ok",itens:[null],proximo:null}, {estado:"ok",itens:[],proximo:{obra:id,assinatura}}]) {
    assert.equal(contract.paginaRankingValida(value),false);
  }
});
