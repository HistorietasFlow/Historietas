import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { criarInvocacaoStatusSupabase } from "./supabase-cli-invocation.mjs";

// Nenhum segredo e impresso. Mede apenas o banco descartavel identificado pelo CLI.
const inv = criarInvocacaoStatusSupabase();
const raw = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
const env = Object.fromEntries(raw.split(/\r?\n/).filter(line => /^[A-Z0-9_]+=/.test(line)).map(line => {
  const i = line.indexOf("="), value = line.slice(i + 1).trim();
  return [line.slice(0, i), value.startsWith('"') ? JSON.parse(value) : value];
}));
const db = new URL(env.DB_URL), api = new URL(env.API_URL);
for (const url of [db, api]) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Recusa ambiente remoto.");
assert.equal(db.protocol, "postgresql:"); assert.equal(api.protocol, "http:");
const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
  { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
assert.equal(containers.length, 1); assert.ok(containers[0].startsWith("supabase_db_"));
const source = `begin;
set local statement_timeout='30s';
select jsonb_build_object('cenario','banco_local_atual','medidas',historietas_privado.medir_capacidade_capitulos());
-- LIKE INCLUDING ALL copia layout, defaults, checks e indices; NAO copia triggers/FKs.
-- Somente tabelas TEMP: nenhuma escrita, exclusao ou limpeza da outbox real.
create temp table qa_outbox_space (like historietas_privado.capitulo_cache_outbox including all) on commit drop;
create temp table qa_notification_space (like public.notificacoes including all) on commit drop;
create function pg_temp.space(p_name text,p_table regclass,p_n integer) returns jsonb language sql as $$
 select jsonb_build_object('cenario',p_name,'linhas',p_n,'tabelaBytes',pg_table_size(p_table),
 'indicesBytes',pg_indexes_size(p_table),'totalBytes',pg_total_relation_size(p_table),
 'bytesPorLinha',case when p_n>0 then pg_total_relation_size(p_table)/p_n end); $$;
select pg_temp.space('outbox_vazia','qa_outbox_space',0);
insert into qa_outbox_space(capitulo_id,revisao_agendada,obra_id,slug_publicacao,numero_capitulo,publicado_em)
 select gen_random_uuid(),1,gen_random_uuid(),'qa-obra-'||lpad(i::text,24,'0'),i,now() from generate_series(1,1000) i;
select pg_temp.space('outbox_1000','qa_outbox_space',1000);
insert into qa_outbox_space(capitulo_id,revisao_agendada,obra_id,slug_publicacao,numero_capitulo,publicado_em)
 select gen_random_uuid(),1,gen_random_uuid(),'qa-obra-'||lpad(i::text,24,'0'),i,now() from generate_series(1001,10000) i;
select pg_temp.space('outbox_10000','qa_outbox_space',10000);
do $$begin for i in 1..5 loop
 update qa_outbox_space set lease_id=gen_random_uuid(),lease_ate=clock_timestamp()+interval '2 minutes',tentativas=tentativas+1;
end loop; end; $$;
select pg_temp.space('outbox_10000_cinco_leases','qa_outbox_space',10000);
insert into qa_notification_space(user_id,obra_id,capitulo_id,titulo,mensagem,tipo,link,notificacao_id,autor_id)
 select gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'Novo capítulo publicado',
 left(repeat('Texto de medicao local. ',20),300),'novo-capitulo','/obra/qa-medicao/capitulo/1',
 'novo-capitulo:'||gen_random_uuid()||':'||gen_random_uuid(),gen_random_uuid() from generate_series(1,1000);
select pg_temp.space('notificacoes_1000','qa_notification_space',1000);
insert into qa_notification_space(user_id,obra_id,capitulo_id,titulo,mensagem,tipo,link,notificacao_id,autor_id)
 select gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'Novo capítulo publicado',
 left(repeat('Texto de medicao local. ',20),300),'novo-capitulo','/obra/qa-medicao/capitulo/1',
 'novo-capitulo:'||gen_random_uuid()||':'||gen_random_uuid(),gen_random_uuid() from generate_series(1001,10000);
select pg_temp.space('notificacoes_10000','qa_notification_space',10000);
rollback;`;
const output = execFileSync("docker", ["exec", "-i", containers[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"],
  { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
for (const line of output.trim().split(/\r?\n/)) console.log(JSON.stringify(JSON.parse(line)));
