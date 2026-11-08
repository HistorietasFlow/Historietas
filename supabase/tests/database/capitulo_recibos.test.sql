begin;
select no_plan();
-- BEGIN RECEIPT FIXTURE (SQL administrativo, nenhum upload ou prova real)
insert into auth.users(id) values ('fc100000-0000-4000-8000-000000000001'),('fc100000-0000-4000-8000-000000000002') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
 ('fc100000-0000-4000-8000-000000000001','fc100000-0000-4000-8000-000000000001','QA recibo','autor');
select set_config('request.jwt.claim.sub','fc100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
 ('fc200000-0000-4000-8000-000000000001','fc100000-0000-4000-8000-000000000001','QA recibo','QA','Fantasia','HQ','Livre',false,'qa-recibos-capitulo');
insert into public.capitulos(id,obra_id,user_id,titulo,ordem,publicado) values
 ('fc300000-0000-4000-8000-000000000001','fc200000-0000-4000-8000-000000000001','fc100000-0000-4000-8000-000000000001','Draft',1,false);
insert into auth.sessions(id,user_id) values
 ('fc500000-0000-4000-8000-000000000001','fc100000-0000-4000-8000-000000000001'),
 ('fc500000-0000-4000-8000-000000000002','fc100000-0000-4000-8000-000000000001');
select set_config('request.jwt.claims','{"sub":"fc100000-0000-4000-8000-000000000001","session_id":"fc500000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.reservar_pagina_capitulo('fc300000-0000-4000-8000-000000000001',0,'fc400000-0000-4000-8000-000000000001','image/png');
select historietas_privado.preparar_tentativa_upload_pagina(id,capitulo_id,0,'fc400000-0000-4000-8000-000000000002')
 from historietas_privado.capitulo_uploads_pendentes where capitulo_id='fc300000-0000-4000-8000-000000000001';
select historietas_privado.iniciar_transferencia_pagina(id,lease_token,repeat('a',64),100,2,2,'image/png')
 from historietas_privado.capitulo_upload_tentativas where user_id='fc100000-0000-4000-8000-000000000001';
-- END RECEIPT FIXTURE

create function pg_temp.recibo(p_hash text default repeat('a',64),p_version text default 'qa-version') returns jsonb language sql as $$
 select historietas_privado.registrar_observacao_upload_pagina(id,lease_token,
 'fc600000-0000-4000-8000-000000000001',p_version,p_hash)
 from historietas_privado.capitulo_upload_tentativas where user_id='fc100000-0000-4000-8000-000000000001';
$$;
create function pg_temp.conferir() returns jsonb language sql as $$
 select historietas_privado.conferir_finalizacao_pagina(t.id,t.lease_token,r.id)
 from historietas_privado.capitulo_upload_tentativas t
 left join historietas_privado.capitulo_upload_recibos r on r.tentativa_id=t.id
 where t.user_id='fc100000-0000-4000-8000-000000000001';
$$;
select ok(not exists(select 1 from pg_constraint where conrelid='historietas_privado.capitulo_upload_recibos'::regclass and contype='f'),'recibo sem cascatas');
select ok((select relrowsecurity from pg_class where oid='historietas_privado.capitulo_upload_recibos'::regclass),'RLS recibo');
select ok(not has_table_privilege(r,'historietas_privado.capitulo_upload_recibos','SELECT,INSERT,UPDATE,DELETE'),'recibos privados: '||r)
 from unnest(array['anon','authenticated','service_role']) r;
select ok(not has_function_privilege(r,p.oid,'EXECUTE'),'sem chamada cliente: '||r||'/'||p.proname)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 cross join unnest(array['anon','authenticated','service_role']) r
 where n.nspname='historietas_privado' and p.proname in ('registrar_observacao_upload_pagina','conferir_finalizacao_pagina');
select ok(not has_function_privilege(r,'public.ha_uploads_ilustrados_pendentes_exclusao(uuid)','EXECUTE'),'sem enumeracao por '||r)
 from unnest(array['anon','authenticated']) r;
select ok(has_function_privilege('service_role','public.ha_uploads_ilustrados_pendentes_exclusao(uuid)','EXECUTE'),'executor recebe apenas booleano');
select throws_ok($$select pg_temp.recibo()$$,'PT409',null,'ausencia de objeto nao produz observacao');
select throws_ok($$select pg_temp.conferir()$$,'PT409',null,'sem recibo nao finaliza');
select throws_ok($$select pg_temp.recibo(repeat('b',64))$$,'22023',null,'hash divergente recusado');
-- Metadata sintetica SOMENTE nesta transacao revertida; nenhum byte fisico.
insert into storage.objects(id,bucket_id,name,version,metadata)
 select 'fc600000-0000-4000-8000-000000000001','arquivos-obras',storage_path,'qa-version',
 '{"size":100,"mimetype":"image/png"}' from historietas_privado.capitulo_upload_tentativas
 where user_id='fc100000-0000-4000-8000-000000000001';
select is(pg_temp.recibo()->>'publicacaoHabilitada','false','recibo nao autoriza publicacao');
select is(pg_temp.recibo(),pg_temp.recibo(),'recibo duplicado idempotente');
select is((select count(*) from historietas_privado.capitulo_upload_recibos),1::bigint,'um recibo por tentativa');
select throws_ok($$select pg_temp.recibo(repeat('a',64),'outra-versao')$$,'PT409',null,'retry divergente nao sobrescreve');
select is(pg_temp.conferir(),'{"publicacaoHabilitada":false,"motivo":"terminalidade_nao_comprovada"}'::jsonb,'gate permanece fechado mesmo com todas as verificacoes locais');
select is((select count(*) from public.capitulo_paginas where capitulo_id='fc300000-0000-4000-8000-000000000001'),0::bigint,'nenhuma pagina publicada');
select is((select tipo_conteudo from public.capitulos where id='fc300000-0000-4000-8000-000000000001'),'texto','capitulo legado nao convertido');
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where name like 'fc100000-0000-4000-8000-000000000001/%'),2097152::bigint,'recibo nao libera quota');

savepoint obsoleta;
update public.capitulos set versao_paginas=1 where id='fc300000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.conferir()$$,'PT409',null,'versao obsoleta recusada');
rollback to obsoleta;
savepoint propriedade;
update public.obras set user_id='fc100000-0000-4000-8000-000000000002' where id='fc200000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.conferir()$$,'42501',null,'propriedade atual revalidada');
rollback to propriedade;
savepoint sessao;
select set_config('request.jwt.claims','{"sub":"fc100000-0000-4000-8000-000000000001","session_id":"fc500000-0000-4000-8000-000000000002"}',true);
select throws_ok($$select pg_temp.conferir()$$,'42501',null,'outra sessao nao herda recibo');
rollback to sessao;
savepoint logout;
delete from auth.sessions where id='fc500000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.conferir()$$,'42501',null,'logout impede finalizacao');
delete from historietas_privado.capitulo_upload_recibos where user_id='fc100000-0000-4000-8000-000000000001';
select lives_ok($$select pg_temp.recibo()$$,'observacao tardia apos logout nao perde rastreio');
rollback to logout;
savepoint lease;
update historietas_privado.capitulo_upload_tentativas set criado_em=now()-interval '4 minutes',lease_ate=now()-interval '2 minutes'
 where user_id='fc100000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.conferir()$$,'PT409',null,'lease vencido nao autoriza finalizacao');
rollback to lease;
savepoint cancelamento;
select historietas_privado.encerrar_tentativa_upload_pagina(id,lease_token,'cancelamento')
 from historietas_privado.capitulo_upload_tentativas where user_id='fc100000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.conferir()$$,'PT409',null,'cancelamento impede finalizacao');
select lives_ok($$select pg_temp.recibo()$$,'recibo tardio nao reativa tentativa cancelada');
rollback to cancelamento;
savepoint limpeza;
insert into historietas_privado.capitulo_arquivos_limpeza(storage_path,motivo)
 select storage_path,'upload_descartado' from historietas_privado.capitulo_upload_tentativas where user_id='fc100000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.conferir()$$,'PT409',null,'caminho destinado a limpeza nao finaliza');
rollback to limpeza;
savepoint exclusao;
select public.reivindicar_operacao_exclusao_conta('fc100000-0000-4000-8000-000000000001',gen_random_uuid(),180);
select throws_ok($$select pg_temp.conferir()$$,'PT409',null,'operacao de exclusao impede finalizacao');
select ok(public.ha_uploads_ilustrados_pendentes_exclusao('fc100000-0000-4000-8000-000000000001'),'limpeza deve aguardar ledger');
select throws_ok($$select historietas_privado.preparar_tentativa_upload_pagina(
 (public.reservar_pagina_capitulo('fc300000-0000-4000-8000-000000000001',0,gen_random_uuid(),'image/png')->>'reservaId')::uuid,
 'fc300000-0000-4000-8000-000000000001',0,gen_random_uuid())$$,'PT409',null,'conta em exclusao nao inicia nova tentativa');
rollback to exclusao;
select ok(not public.ha_uploads_ilustrados_pendentes_exclusao('fc100000-0000-4000-8000-000000000002'),'isolamento entre contas');
delete from public.obras where id='fc200000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.conferir()$$,'42501',null,'capitulo excluido nao finaliza');
select lives_ok($$select pg_temp.recibo()$$,'recibo sobrevive a cascata');
delete from public.profiles where user_id='fc100000-0000-4000-8000-000000000001';
delete from auth.users where id='fc100000-0000-4000-8000-000000000001';
select is((select count(*) from historietas_privado.capitulo_upload_recibos),1::bigint,'recibo sobrevive a exclusao da conta');
select ok(public.ha_uploads_ilustrados_pendentes_exclusao('fc100000-0000-4000-8000-000000000001'),'conta excluida ainda ocupa capacidade');
select * from finish();
rollback;
