import assert from "node:assert/strict";
import test from "node:test";
import {execFileSync, spawn} from "node:child_process";
import {randomBytes, randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
import {criarInvocacaoStatusSupabase} from "../scripts/supabase-cli-invocation.mjs";
import {loadApplicationModule as load} from "../helpers/load-application-module.mjs";

const {escreverMetadadosObra} = load("app/editar-obra/lib/editar-obra-editorial-write.ts");
const {confirmarEditorialRemoto} = load("lib/statusEditorial.ts");
const check = r => {assert.equal(r.error, null, r.error?.message); return r.data;};
const opts = {auth: {persistSession: false, autoRefreshToken: false}};
const fields = "id,user_id,status_editorial,status_editorial_versao,sinopse,capa_url";

test("aplicação real: CAS, recuperação e Storage exclusivamente descartáveis", async t => {
  const inv = criarInvocacaoStatusSupabase();
  const raw = execFileSync(inv.comando, inv.argumentos, {encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"]});
  const env = Object.fromEntries(raw.split(/\r?\n/).filter(s => /^[A-Z0-9_]+=/.test(s)).map(s => {
    const i = s.indexOf("="), v = s.slice(i + 1).trim(); return [s.slice(0,i), v.startsWith('"') ? JSON.parse(v) : v];
  }));
  for (const url of [env.API_URL, env.DB_URL]) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname), "Somente local");
  const names = execFileSync("docker", ["ps", "--filter", `publish=${new URL(env.DB_URL).port}`, "--format", "{{.Names}}"], {encoding: "utf8", windowsHide: true}).trim().split(/\r?\n/);
  assert.equal(names.length,1); assert.match(names[0], /^supabase_db_/);
  const args = ["exec", "-i", names[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = s => execFileSync("docker", args, {input: s, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"]}).trim();
  const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, opts);
  const userId = randomUUID(), thirdId = randomUUID(), id = randomUUID(), legacyId = randomUUID();
  const password = randomBytes(24).toString("base64url"), email = `qa-editorial-app-${userId}@historietas.test`;
  const storagePaths = [], writers = [];
  t.after(async () => {
    for (const w of writers) if (w.child.exitCode === null) {w.child.stdin.end("rollback;\n"); await w.exit;}
    sql(`delete from public.obras where id in ('${id}','${legacyId}');`);
    if (storagePaths.length) check(await admin.storage.from("capas-obras").remove(storagePaths));
    check(await admin.auth.admin.deleteUser(userId)); check(await admin.auth.admin.deleteUser(thirdId));
  });
  check(await admin.auth.admin.createUser({id: userId, email, password, email_confirm: true}));
  check(await admin.auth.admin.createUser({id: thirdId, email: `qa-other-${thirdId}@historietas.test`, password, email_confirm: true}));
  const a = createClient(env.API_URL, env.ANON_KEY, opts), b = createClient(env.API_URL, env.ANON_KEY, opts), other = createClient(env.API_URL, env.ANON_KEY, opts);
  const session = check(await a.auth.signInWithPassword({email, password})).session;
  check(await b.auth.signInWithPassword({email, password}));
  check(await other.auth.signInWithPassword({email: `qa-other-${thirdId}@historietas.test`, password}));
  check(await a.rpc("aceitar_termos_publicacao", {p_termos_versao: "2026-08-05", p_diretrizes_versao: "2026-08-05", p_politica_versao: "2026-08-05"}));
  const insert = () => ({id, user_id: userId, titulo: "Contrato da aplicação", autor: "QA", genero: "Fantasia", formato: "HQ", classificacao_indicativa: "Livre", avisos_conteudo: [], sinopse: "Original", publicado: false, slug: `qa-app-editorial-${id}`, status_editorial: null});
  check(await a.from("obras").insert(insert()));
  const read = async (workId = id) => check(await a.from("obras").select(fields).eq("id", workId).eq("user_id", userId).single());
  const confirmed = r => {const c = confirmarEditorialRemoto(r, r.id, userId); assert.ok(c); return c;};
  const write = (client, c, escolha, payload = {}) => escreverMetadadosObra(client, {id: c.id, userId, payload, editorial: {confirmado: c, escolha}});
  function processSql(input, mark) {
    const child = spawn("docker", args, {windowsHide: true, stdio: ["pipe", "pipe", "pipe"]});
    let out = "", err = "";
    const exit = new Promise((resolve, reject) => {child.on("error", reject); child.on("exit", code => code === 0 ? resolve() : reject(new Error(`psql ${code}: ${err}`)));});
    exit.catch(() => {}); child.stderr.on("data", s => {err += s;});
    const ready = mark ? new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Barreira SQL ausente")), 10000);
      child.stdout.on("data", s => {out += s; if (out.includes(mark)) {clearTimeout(timer); resolve();}});
    }) : exit;
    child.stdin.write(input);
    const w = {child, exit, ready}; writers.push(w); return w;
  }
  async function waiting(count) {
    const p = processSql(`do $$ declare deadline timestamptz:=clock_timestamp()+interval '8 seconds'; begin loop
      exit when (select count(*) from pg_stat_activity where wait_event_type='Lock' and query ilike '%UPDATE%obras%' and query ilike '%status_editorial_versao%')>=${count};
      if clock_timestamp()>deadline then raise exception 'Requisicoes nao aguardaram lock'; end if;
      perform pg_sleep(0.01); end loop; end $$;`);
    p.child.stdin.end(); await p.exit;
  }

  await t.test("duas sessões reais: uma vence e conflito não salva parcialmente outros campos", async () => {
    const c = confirmed(await read()), locker = processSql(`begin; select id from public.obras where id='${id}' for update;\n\\echo LOCKED\n`, "LOCKED");
    await locker.ready;
    const pending = Promise.all([write(a,c,"concluida",{sinopse: "A"}), write(b,c,"pausada",{sinopse: "B"})]);
    pending.catch(() => {}); await waiting(2); locker.child.stdin.end("commit;\n"); await locker.exit;
    const results = await pending;
    assert.deepEqual(results.map(r=>r.estado).sort(), ["confirmada", "sem_linha"]);
    const current = await read(); assert.equal(current.sinopse, current.status_editorial === "concluida" ? "A" : "B");
  });
  await t.test("metadados sem status preservam mudança de outra sessão e não escrevem token", async () => {
    const c = confirmed(await read());
    assert.equal((await write(b,c,"em_andamento")).estado, "confirmada");
    const latest = await read();
    const result = await escreverMetadadosObra(a, {id, userId, payload: {sinopse: "Somente metadado"}});
    assert.equal(result.estado, "confirmada");
    assert.equal(result.confirmacao.status, latest.status_editorial); assert.equal(result.confirmacao.versao, latest.status_editorial_versao);
  });
  await t.test("ABA e recriação recusam intenção antiga", async () => {
    const before = confirmed(await read());
    sql(`begin; update public.obras set status_editorial='pausada' where id='${id}'; update public.obras set status_editorial='${before.status}' where id='${id}'; commit;`);
    assert.equal((await write(a,before,"concluida",{sinopse: "Nao salvar"})).estado, "sem_linha");
    const deleted = confirmed(await read());
    check(await a.from("obras").delete().eq("id",id)); check(await a.from("obras").insert(insert()));
    assert.equal((await write(a,deleted,"concluida")).estado, "sem_linha");
  });
  await t.test("legado NULL confirmado funciona; campo ausente não habilita a integração", async () => {
    sql(`begin; alter table public.obras disable trigger obras_status_editorial_versao;
      insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,slug) values ('${legacyId}','${userId}','Legado','QA','Fantasia','HQ','Livre','qa-app-legacy-${legacyId}');
      alter table public.obras enable trigger obras_status_editorial_versao; commit;`);
    const before = await read(legacyId); assert.equal(before.status_editorial_versao,null);
    assert.equal(confirmarEditorialRemoto({...before, status_editorial_versao: undefined},legacyId,userId),null);
    assert.equal((await write(a,confirmed(before),"pausada")).estado,"confirmada");
    assert.equal((await write(a,confirmed(before),"concluida")).estado,"sem_linha");
  });
  await t.test("autoria, privacidade e rollback seguem sob RLS/termos", async () => {
    const before = await read(), c = confirmed(before);
    assert.equal((await write(other,c,"concluida")).estado,"sem_linha");
    assert.deepEqual(check(await other.from("obras").select(fields).eq("id",id)),[]);
    sql(`begin; update public.obras set status_editorial='pausada' where id='${id}'; rollback;`);
    assert.deepEqual(await read(),before);
    sql(`update public.obras set publicado=true,user_id='${thirdId}' where id='${id}';`);
    const noTerms = check(await other.from("obras").select(fields).eq("id",id).single());
    assert.equal((await escreverMetadadosObra(other,{id,userId: thirdId,payload: {sinopse:"Nao salvar"},editorial:{confirmado: confirmarEditorialRemoto(noTerms,id,thirdId),escolha:"pausada"}})).estado,"rejeitada");
    sql(`update public.obras set publicado=false,user_id='${userId}' where id='${id}';`);
  });
  await t.test("PATCH real com resposta perdida preserva arquivos novos e antigos no Storage", async () => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
    for (const label of ["antiga","nova"]) {
      const path = `${userId}/${randomUUID()}-${label}.png`;
      check(await a.storage.from("capas-obras").upload(path,png,{contentType:"image/png",upsert:false})); storagePaths.push(path);
    }
    const urls = storagePaths.map(p=>a.storage.from("capas-obras").getPublicUrl(p).data.publicUrl);
    check(await a.from("obras").update({capa_url:urls[0]}).eq("id",id));
    const antes18 = await read();
    const {prepararEEnviarAssetsEdicaoObra} = load("app/editar-obra/lib/editar-obra-save-assets-preparation.ts",{"../../../lib/supabase/client":{supabase:a}});
    await assert.rejects(() => prepararEEnviarAssetsEdicaoObra({capa:urls[0],capaNome:"antiga.png",arquivoObra:null,
      obraRemotaAtual:antes18,obraLocalAtual:null,backupArquivosObras:{},capaRemovidaManualmente:false,
      arquivoObraRemovidoManualmente:false,capaBloqueadaPorClassificacao:true,capaArquivo:null,arquivoObraArquivo:null,
      userId,agora:new Date().toISOString(),arquivosNovosEnviados:[]}), /Esta alteração 18\+ exige uma remoção segura/);
    assert.deepEqual(await read(),antes18,"recusa 18+ não atualiza a obra nem remove capa");
    const capaRetida=await fetch(urls[0]);assert.equal(capaRetida.status,200);assert.deepEqual(Buffer.from(await capaRetida.arrayBuffer()),png);
    const c = confirmed(await read()); let patches=0;
    const lost = createClient(env.API_URL,env.ANON_KEY,{...opts,global:{fetch:async(input,init)=>{
      const response=await fetch(input,init);
      if(init?.method==="PATCH"){patches++;await response.arrayBuffer();throw new TypeError("Resposta perdida depois do PATCH real");}
      return response;
    }}});
    check(await lost.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token}));
    const {atualizarObraRemotaEdicaoObra} = load("app/editar-obra/lib/editar-obra-remote-update.ts",{"../../../lib/supabase/client":{supabase:lost}});
    const result = await atualizarObraRemotaEdicaoObra({obraId:id,userId,tituloFinal:"Contrato da aplicação",autorFinal:"QA",generoFinalSalvo:"Fantasia",
      formatoFinalSalvo:"HQ",classificacaoFinal:"Livre",avisosConteudoFinal:[],sinopseFinal:"Salvo sem resposta",tagsFinais:[],
      capaFinal:urls[1],capaNomeFinal:"nova.png",arquivoObraFinal:null,agora:new Date().toISOString(),
      arquivosNovosEnviados:[{bucket:"capas-obras",caminho:storagePaths[1],referencia:urls[1]}],editorial:{confirmado:c,escolha:"concluida"}});
    assert.equal(result.estado,"incerta"); assert.equal(patches,1);
    const current=await read(); assert.equal(current.status_editorial,"concluida");assert.equal(current.capa_url,urls[1]);
    for(const url of urls){const r=await fetch(url);assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),png);}
    assert.equal((await write(b,c,"pausada")).estado,"sem_linha");
    assert.equal(result.estado,"incerta","leitura posterior não é recibo causal");
    await lost.auth.signOut({scope:"local"});
  });
});
