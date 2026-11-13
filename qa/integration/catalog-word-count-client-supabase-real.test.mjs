import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

test("cliente de palavras contra Data API local: paginação, zero, privacidade, combinações e erro", async t => {
  const inv=criarInvocacaoStatusSupabase();
  const out=execFileSync(inv.comando,inv.argumentos,{encoding:"utf8",windowsHide:true,stdio:["ignore","pipe","pipe"]});
  const env=Object.fromEntries(out.split(/\r?\n/).filter(s=>/^[A-Z_]+=/.test(s)).map(s=>{const i=s.indexOf("=");return [s.slice(0,i),JSON.parse(s.slice(i+1))];}));
  for(const url of [env.API_URL,env.DB_URL]) assert.ok(["127.0.0.1","localhost"].includes(new URL(url).hostname));
  const container=execFileSync("docker",["ps","--filter",`publish=${new URL(env.DB_URL).port}`,"--format","{{.Names}}"],{encoding:"utf8",windowsHide:true}).trim();
  assert.match(container,/^supabase_db_[a-z0-9-]+$/);
  const sql=q=>execFileSync("docker",["exec","-i",container,"psql","-U","postgres","-d","postgres","-XqAt","-v","ON_ERROR_STOP=1"],{input:q,encoding:"utf8",windowsHide:true,stdio:["pipe","pipe","pipe"]}).trim();
  const quote=s=>`'${String(s).replaceAll("'","''")}'`;
  const author=randomUUID(),works=Array.from({length:52},()=>randomUUID()),tag=`qa-client-${randomUUID()}`;
  t.after(()=>sql(`begin; delete from public.obras where id in (${works.map(quote)}); delete from auth.users where id=${quote(author)}; commit;`));
  sql(`begin; insert into auth.users(id) values (${quote(author)});
    ${works.map((id,i)=>`insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug,tags,status_editorial,criada_em)
    values (${quote(id)},${quote(author)},'Palavras cliente ${i}','QA','Fantasia','HQ',${quote(i===50?"18+":"Livre")},${i===50?"array['terror']":"array[]::text[]"},${i!==49},${quote(`${tag}-${i}`)},array[${quote(tag)}],'concluida','2037-01-01'::timestamptz+${i}*interval '1 day');
    insert into public.capitulos(obra_id,user_id,titulo,texto,publicado) values (${quote(id)},${quote(author)},'Texto',${quote(i===48?"":i===0||i>=49?"um dois tres quatro cinco":"duas palavras")},true);`).join("\n")}
    update public.obras set arquivo_url=${quote(`${author}/anexo-qa.txt`)} where id=${quote(works[51])}; commit;`);
  const anon=createClient(env.API_URL,env.PUBLISHABLE_KEY||env.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const calls=[];
  const {listarPaginaCatalogo}=loadApplicationModule("lib/catalogo.ts",{"./supabase/client":{supabase:{rpc:async(name,args)=>{calls.push(args);return anon.rpc(name,args);}}}});
  const q={tag,ordenacao:"mais-recentes",limite:7};
  const neutral=await listarPaginaCatalogo(q);
  assert.equal(neutral.obraIds.includes(works[0]),false);
  assert.equal(Object.keys(calls.at(-1)).length,11);
  const target=await listarPaginaCatalogo({...q,palavrasMinimas:5,palavrasMaximas:5,genero:"Fantasia",formato:"HQ",statusEditorial:"concluida"});
  assert.deepEqual(target.obraIds,[works[0]]); // private, 18+ and attachment never included.
  assert.deepEqual((await listarPaginaCatalogo({...q,palavrasMinimas:0,palavrasMaximas:0})).obraIds,[works[48]]);
  assert.deepEqual((await listarPaginaCatalogo({...q,palavrasMinimas:6})).obraIds,[]);
  const found=[];let cursor=null;
  do { const page=await listarPaginaCatalogo({...q,palavrasMinimas:2,palavrasMaximas:2,cursor}); found.push(...page.obraIds);cursor=page.proximoCursor;} while(cursor);
  assert.equal(found.length,47); assert.equal(new Set(found).size,47); assert.deepEqual(found,works.slice(1,48).reverse());
  const failureCalls=[];
  const failing=loadApplicationModule("lib/catalogo.ts",{"./supabase/client":{supabase:{rpc:async(name,args)=>{failureCalls.push(args);return anon.rpc(name,{...args,p_palavras_minimas:-1});}}}});
  await assert.rejects(failing.listarPaginaCatalogo({...q,palavrasMinimas:0}),/Intervalo de palavras/);
  assert.equal(failureCalls.length,1); assert.equal(Object.keys(failureCalls[0]).length,17);
});
