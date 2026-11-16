import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { carregarFonteStory } from "../scripts/story-source-loader.mjs";

const load = carregarFonteStory();
const { comporStoryAvaliacao, STORY, tamanhoTextoStory } = load("lib/server/stories/story-avaliacao-layout.tsx");
const { montarPayloadStoryAvaliacao } = load("lib/stories/avaliacao-story-payload.ts");
const { carregarGeistStory } = load("lib/server/stories/fonte-story.ts");
const geist = await carregarGeistStory();
const folder = "qa/reports/story-stage2";
mkdirSync(folder, { recursive: true });
const reference = readFileSync("qa/references/Historietas_Modelo_Stories_Aprovado.png");
const wordmark = readFileSync("lib/server/stories/assets/wordmark.png");
const data = bytes => `data:image/png;base64,${bytes.toString("base64")}`;
const media = {
  // Recortes apenas de QA, nunca usados como fallback no produto.
  capa: data(await sharp(reference).extract({ left: 195, top: 298, width: 550, height: 764 }).png().toBuffer()),
  leitor: data(await sharp(reference).extract({ left: 231, top: 119, width: 121, height: 121 }).png().toBuffer()),
  autor: data(await sharp(reference).extract({ left: 214, top: 1228, width: 73, height: 73 }).png().toBuffer()),
  wordmark: data(wordmark),
  legenda: data(readFileSync("lib/server/stories/assets/minha-avaliacao.png")),
  por: data(readFileSync("lib/server/stories/assets/por.png")),
  separador: data(readFileSync("lib/server/stories/assets/separador.png")),
};
function payload(overrides = {}) {
  return montarPayloadStoryAvaliacao({
    obra: { titulo: "A Última Luz", autor: "Helena Duarte", slug: "somente-fixture-visual", capa: null },
    leitor: { nome: "Lucas Almeida", avatar_url: null },
    autor: { nome: "Helena Duarte", avatar_url: null, username: "helenaduarte" },
    nota: 5, supabaseUrl: "https://local.invalid", ...overrides,
  });
}
const results = [];
async function render(name, value, images = media) {
  const response = comporStoryAvaliacao(value, images, geist);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  const png = Buffer.from(await response.arrayBuffer());
  const m = await sharp(png).metadata();
  assert.equal(m.width, 1080); assert.equal(m.height, 1920); assert.equal(m.format, "png");
  const line=await sharp(png).extract({left:250,top:1563,width:1,height:1}).removeAlpha().raw().toBuffer();
  assert(line[0]>40&&line[0]<160,"Linha cinza deve persistir em toda geração");
  const brand=await sharp(png).extract({left:356,top:1750,width:370,height:65}).removeAlpha().raw().toBuffer();
  assert(brand.some(v=>v>240),"Wordmark deve persistir em toda geração");
  writeFileSync(`${folder}/${name}.png`, png);
  results.push({ name, width: m.width, height: m.height, bytes: png.length });
  return png;
}
test("wordmark autorizado é byte a byte o original, sem redesenho", () => {
  const sha = b => createHash("sha256").update(b).digest("hex");
  assert.equal(sha(wordmark), sha(readFileSync("qa/references/Historietas_Wordmark_Extraido_Referencia.png")));
});
test("PNG real 1080×1920 preserva posições, fundo preto e linhas laterais", async () => {
  const png = await render("modelo-5-estrelas", payload());
  const pixel = async (x,y) => [...await sharp(png).extract({left:x,top:y,width:1,height:1}).removeAlpha().raw().toBuffer()];
  assert.deepEqual(await pixel(10,10), [0,0,0]);
  const lineY = Math.round(1361 * STORY.scale + STORY.offsetY);
  for (const x of [250,800]) { const v = await pixel(x,lineY); assert(v[0] > 40 && v[0] < 160); assert.equal(v[0],v[1]); }
  await sharp(reference).resize(1080,1920,{fit:"contain",background:"#000"}).png().toFile(`${folder}/referencia-1080.png`);
});
test("meia estrela preenche somente metade, sem arredondar nota", async () => {
  const half = await render("nota-4-5", payload({nota:4.5}));
  const full = readFileSync(`${folder}/modelo-5-estrelas.png`);
  const region = async b => sharp(b).extract({left:Math.round((350+4*54)*STORY.scale),top:Math.round(1345*STORY.scale+STORY.offsetY),width:36,height:38}).removeAlpha().raw().toBuffer();
  const a=await region(half), b=await region(full);
  assert(!a.equals(b));
  const bright = bytes => [...bytes].filter(v=>v>240).length;
  assert(bright(a) < bright(b)*0.75 && bright(a) > bright(b)*0.25);
});
test("sem username remove @ e & sem deslocar linhas, capa ou wordmark", async () => {
  const without=payload({autor:{nome:"Helena Duarte",avatar_url:null,username:null}});
  const png=await render("sem-arroba",without);
  const area=await sharp(png).extract({left:245,top:1625,width:590,height:103}).removeAlpha().raw().toBuffer();
  assert(area.every(v=>v===0));
});
test("nomes e título longos cabem nas caixas; fotos ausentes preservam composição", async () => {
  const p=payload({
    obra:{titulo:"A Última Luz sobre as Montanhas: Crônicas da Cidade Esquecida e dos Viajantes entre Mundos",autor:"Autora",slug:"fixture"},
    leitor:{nome:"Ana Carolina de Albuquerque e Vasconcelos da Silva",avatar_url:null},
    autor:{nome:"Helena Maria de Albuquerque e Vasconcelos Duarte",avatar_url:null,username:"helena.duarte"},nota:0.5,
  });
  assert(tamanhoTextoStory(p.obra.titulo.texto,66,554,90)>=16);
  await render("textos-longos",p);
  await render("fotos-ausentes",payload(),{...media,leitor:null,autor:null});
});
test("payload incompleto/truncado nunca é exportado silenciosamente", () => {
  assert.throws(()=>comporStoryAvaliacao({...payload(),compartilhavel:false},media,geist));
  const p=payload();p.obra.titulo.truncado=true;
  assert.throws(()=>comporStoryAvaliacao(p,media,geist));
  assert.throws(()=>comporStoryAvaliacao(payload({leitor:{nome:"Nome 😀",avatar_url:null}}),media,geist),/glifo_indisponivel/);
});

test("Geist explícita usa exatamente os bytes locais do Next e é obrigatória", async () => {
  assert.deepEqual(Buffer.from(geist), readFileSync("node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"));
  assert.throws(() => comporStoryAvaliacao(payload(), media), /fonte_indisponivel/);
  assert.throws(() => comporStoryAvaliacao(payload(), media, new ArrayBuffer(0)), /fonte_indisponivel/);
  let options;
  const renderer = carregarFonteStory({ "next/og": { ImageResponse: class {
    constructor(_element, value) { options = value; }
  } } })("lib/server/stories/story-avaliacao-layout.tsx");
  renderer.comporStoryAvaliacao(payload(), media, geist);
  assert.deepEqual(options.fonts, [{ name: "geist", data: geist, weight: 400, style: "normal" }]);
});

test("diagnóstico registra somente etapas/status/tempos, inclusive falha sem vazamento", async () => {
  const previous = process.env.STORY_PNG_DIAGNOSTICS, info = console.info;
  const records = [];
  console.info = (...args) => records.push(args);
  try {
    process.env.STORY_PNG_DIAGNOSTICS = "1";
    const { diagnosticoPng } = load("lib/server/stories/diagnostico-png.ts");
    const diag = diagnosticoPng();
    const secret = "password=segredo Cookie=privado Bearer token leitor@privado.invalid id-pessoal";
    assert.equal(await diag.medir("geist", async () => secret), secret);
    await assert.rejects(diag.medir("render_png", async () => { throw new Error(secret); }));
    diag.finalizar("indisponivel");
    assert.equal(records.length, 5);
    assert(!JSON.stringify(records).includes(secret));
    for (const [prefix, json] of records) {
      assert.equal(prefix, "[story-png]");
      const r = JSON.parse(json);
      assert.deepEqual(Object.keys(r), ["etapa", "status", "duracaoMs"]);
      assert(["geist", "render_png", "total"].includes(r.etapa));
      assert(["inicio", "concluido", "falhou", "indisponivel"].includes(r.status));
      assert(Number.isInteger(r.duracaoMs) && r.duracaoMs >= 0);
    }
    process.env.STORY_PNG_DIAGNOSTICS = "0";
    await diagnosticoPng().medir("geist", async () => null);
    assert.equal(records.length, 5);
    process.env.STORY_PNG_DIAGNOSTICS = "1";
    console.info = () => { throw new Error(secret); };
    assert.equal(await diagnosticoPng().medir("geist", async () => 42), 42);
  } finally {
    console.info = info;
    if (previous === undefined) delete process.env.STORY_PNG_DIAGNOSTICS;
    else process.env.STORY_PNG_DIAGNOSTICS = previous;
  }
});
test("mídia pública: decoder real, limites e ausência de credenciais/redirects",async()=>{
  const original=globalThis.fetch, old=process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:65421";
  const {carregarMidiaStory}=load("lib/server/stories/midia-story.ts");
  const url="http://127.0.0.1:65421/storage/v1/object/public/capas-obras/fixture.png";
  let calls=0;
  try {
    globalThis.fetch=async(_url,options)=>{
      calls++;assert.equal(options.credentials,"omit");assert.equal(options.redirect,"error");assert.equal(options.cache,"no-store");assert.equal(options.headers,undefined);
      return new Response(await sharp({create:{width:20,height:20,channels:3,background:"#ff0000"}}).png().toBuffer(),{headers:{"content-type":"image/png"}});
    };
    for(const bad of [null,url+"?token=segredo",url.replace("/public/","/sign/"),url.replace("127.0.0.1","externo.invalid")]) assert.equal(await carregarMidiaStory(bad,"capas-obras"),null);
    assert.equal(calls,0);
    const valid=await carregarMidiaStory(url,"capas-obras");assert(valid?.startsWith("data:image/png;base64,"));
    const buffer=Buffer.from(valid.split(",")[1],"base64"),m=await sharp(buffer).metadata();assert.equal(m.width,636);assert.equal(m.height,882);
    const top=await sharp(buffer).extract({left:300,top:0,width:1,height:1}).removeAlpha().raw().toBuffer();assert.deepEqual([...top],[0,0,0],"Capa quadrada tem margens, não é esticada");
    for(const response of [new Response("bad",{status:404}),new Response("<svg/>",{headers:{"content-type":"image/svg+xml"}}),new Response("bad",{headers:{"content-type":"image/png"}}),new Response("bad",{headers:{"content-type":"image/png","content-length":"99999999"}})]) {
      globalThis.fetch=async()=>response;assert.equal(await carregarMidiaStory(url,"capas-obras"),null);
    }
  } finally {globalThis.fetch=original;if(old===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=old;}
});
test("entrada segura não renderiza sem autorização e descarta imagem após revogação",async()=>{
  let loads=0,mediaCalls=0;
  const harness=carregarFonteStory({
    "./carregar-story-avaliacao":{carregarStoryAvaliacaoObra:async()=>{loads++;return{estado:"indisponivel",payload:null};}},
    "./midia-story":{carregarMidiaStory:async()=>{mediaCalls++;throw Error("não deve chamar");}},
  });
  assert.equal((await harness("lib/server/stories/gerar-story-avaliacao.ts").gerarStoryAvaliacao({slug:"fixture",leitorId:"fixture"})).estado,"indisponivel");
  assert.equal(loads,1);assert.equal(mediaCalls,0);
  let confirmed=0;
  const changed=carregarFonteStory({
    "./carregar-story-avaliacao":{carregarStoryAvaliacaoObra:async()=>++confirmed===1?{estado:"disponivel",payload:payload()}:{estado:"indisponivel",payload:null}},
    "./midia-story":{carregarMidiaStory:async()=>media.capa},
  });
  const result=await changed("lib/server/stories/gerar-story-avaliacao.ts").gerarStoryAvaliacao({slug:"fixture",leitorId:"fixture"});
  assert.equal(result.motivo,"fonte_alterada");assert.equal(result.png,undefined);
});
test.after(()=>writeFileSync(`${folder}/png-results.json`,JSON.stringify(results,null,2)));
