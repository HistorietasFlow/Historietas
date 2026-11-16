import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomUUID, randomBytes } from "node:crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { carregarFonteStory } from "../scripts/story-source-loader.mjs";
import "../env.mjs";

test("PNG da conta proprietária: Auth SSR, fontes públicas, mídia real e revogação", async t => {
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert(api && key && secret, "Configurar somente Supabase LOCAL");
  assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(api).hostname), "Remoto proibido");
  const check = r => { assert.equal(r.error === null,true,"Fixture local deve concluir sem erro"); return r.data; };
  const options = { auth: { persistSession:false,autoRefreshToken:false,detectSessionInUrl:false } };
  const admin = createClient(api,secret,options);
  async function account(nome,tipo,username=null) {
    const email=`qa-story-png-${randomUUID()}@historietas.test`,password=randomBytes(24).toString("base64url");
    const created=check(await admin.auth.admin.createUser({email,password,email_confirm:true}));
    const client=createClient(api,key,options), auth=check(await client.auth.signInWithPassword({email,password})),id=created.user.id;
    check(await client.from("profiles").insert({id,user_id:id,nome,tipo,username}));
    check(await client.rpc("aceitar_termos_publicacao",{p_termos_versao:"2026-08-05",p_diretrizes_versao:"2026-08-05",p_politica_versao:"2026-08-05"}));
    return {id,client,session:auth.session};
  }
  const author=await account("Helena Duarte","autor",`helena.duarte.${randomBytes(3).toString("hex")}`), reader=await account("Lucas Almeida","leitor");
  check(await reader.client.from("preferencias_privacidade").upsert({user_id:reader.id,visibilidade_biblioteca:"publico",mostrar_avaliacoes:true},{onConflict:"user_id"}));
  const model=readFileSync("qa/references/Historietas_Modelo_Stories_Aprovado.png");
  async function upload(who,bucket,rect) {
    const image=await sharp(model).extract(rect).png().toBuffer(),path=`${who.id}/story-${randomUUID()}.png`;
    check(await who.client.storage.from(bucket).upload(path,image,{contentType:"image/png"}));
    return who.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const cover=await upload(author,"capas-obras",{left:195,top:298,width:550,height:764});
  const photoReader=await upload(reader,"avatars",{left:231,top:119,width:121,height:121});
  const photoAuthor=await upload(author,"avatars",{left:214,top:1228,width:73,height:73});
  check(await reader.client.from("profiles").update({avatar_url:photoReader}).eq("user_id",reader.id));
  check(await author.client.from("profiles").update({avatar_url:photoAuthor}).eq("user_id",author.id));
  const id=randomUUID(),slug=`qa-story-png-${randomUUID()}`;
  check(await author.client.from("obras").insert({id,user_id:author.id,slug,titulo:"A Última Luz",autor:"Helena Duarte",genero:"Fantasia",formato:"Conto",classificacao_indicativa:"Livre",sinopse:"Fixture local do gerador de PNG.",capa_url:cover,publicado:false}));
  check(await author.client.from("obras").update({publicado:true}).eq("id",id).eq("user_id",author.id));
  check(await reader.client.from("obra_avaliacoes").insert({obra_id:id,user_id:reader.id,nota:4.5,visibilidade:"publico"}));
  const jar=new Map(),cookies={getAll:()=>[...jar].map(([name,value])=>({name,value})),set:(name,value)=>value?jar.set(name,value):jar.delete(name)};
  async function session(who) {
    jar.clear();const ssr=createServerClient(api,key,{cookies:{getAll:()=>[],setAll:values=>values.forEach(v=>cookies.set(v.name,v.value))}});
    check(await ssr.auth.setSession(who.session));
  }
  const load=carregarFonteStory({"next/headers":{cookies:async()=>cookies}});
  const {gerarStoryAvaliacao}=load("lib/server/stories/gerar-story-avaliacao.ts");
  const input={slug,leitorId:reader.id};
  const output="qa/reports/story-stage2";mkdirSync(output,{recursive:true});
  await t.test("anônimo e outra conta são recusados antes da exportação",async()=>{
    assert.equal((await gerarStoryAvaliacao(input)).estado,"indisponivel");
    await session(author);assert.equal((await gerarStoryAvaliacao(input)).estado,"indisponivel");
  });
  await session(reader);
  await t.test("nota 4.5 da própria conta gera PNG real de 1080×1920",async()=>{
    const result=await gerarStoryAvaliacao(input);assert.equal(result.estado,"gerado");
    const meta=await sharp(result.png).metadata();assert.equal(meta.width,1080);assert.equal(meta.height,1920);
    assert.equal(result.cacheControl,"private, no-store, max-age=0");assert.deepEqual(result.ausencias,{fotoLeitor:false,fotoAutor:false});
    writeFileSync(`${output}/supabase-real-4-5.png`,result.png);
  });
  await t.test("sem @ público continua gerando, sem inventar handle",async()=>{
    check(await author.client.from("profiles").update({username:null}).eq("user_id",author.id));
    const result=await gerarStoryAvaliacao(input);assert.equal(result.estado,"gerado");writeFileSync(`${output}/supabase-real-sem-arroba.png`,result.png);
  });
  await t.test("avaliação privada e obra despublicada impedem geração",async()=>{
    check(await reader.client.from("obra_avaliacoes").update({visibilidade:"privado"}).eq("obra_id",id).eq("user_id",reader.id));
    assert.equal((await gerarStoryAvaliacao(input)).estado,"indisponivel");
    check(await reader.client.from("obra_avaliacoes").update({visibilidade:"publico"}).eq("obra_id",id).eq("user_id",reader.id));
    check(await author.client.from("obras").update({publicado:false}).eq("id",id).eq("user_id",author.id));
    assert.equal((await gerarStoryAvaliacao(input)).estado,"indisponivel");
  });
  // Preserva fixtures novas e todos os dados anteriores; nenhuma migration/limpeza global.
});
