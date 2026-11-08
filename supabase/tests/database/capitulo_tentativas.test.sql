begin;
select no_plan();
insert into auth.users(id) values ('fb100000-0000-4000-8000-000000000001'),('fb100000-0000-4000-8000-000000000002');
insert into public.profiles(id,user_id,nome,tipo) values
 ('fb100000-0000-4000-8000-000000000001','fb100000-0000-4000-8000-000000000001','QA tentativa','autor');
select set_config('request.jwt.claim.sub','fb100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
 ('fb200000-0000-4000-8000-000000000001','fb100000-0000-4000-8000-000000000001','QA tentativa','QA','Fantasia','HQ','Livre',false,'qa-tentativas-capitulo');
insert into public.capitulos(id,obra_id,user_id,titulo,ordem,publicado) values
 ('fb300000-0000-4000-8000-000000000001','fb200000-0000-4000-8000-000000000001','fb100000-0000-4000-8000-000000000001','Draft',1,false);
insert into auth.sessions(id,user_id) values
 ('fb500000-0000-4000-8000-000000000001','fb100000-0000-4000-8000-000000000001'),
 ('fb500000-0000-4000-8000-000000000002','fb100000-0000-4000-8000-000000000001'),
 ('fb500000-0000-4000-8000-000000000003','fb100000-0000-4000-8000-000000000002');
select set_config('request.jwt.claims','{"sub":"fb100000-0000-4000-8000-000000000001","session_id":"fb500000-0000-4000-8000-000000000001","role":"authenticated"}',true);
create temp table qa_tentativa as select public.reservar_pagina_capitulo(
 'fb300000-0000-4000-8000-000000000001',0,gen_random_uuid(),'image/png') r;
alter table qa_tentativa add column t jsonb;
update qa_tentativa set t=historietas_privado.preparar_tentativa_upload_pagina(
 (r->>'reservaId')::uuid,'fb300000-0000-4000-8000-000000000001',0,'fb400000-0000-4000-8000-000000000001');

-- Estes helpers sao do teste e executam o protocolo privado como postgres.
create function pg_temp.iniciar(p_token uuid default null,p_size bigint default 100) returns void language sql as $$
 select historietas_privado.iniciar_transferencia_pagina((t->>'tentativaId')::uuid,
 coalesce(p_token,(t->>'leaseToken')::uuid),repeat('a',64),p_size,2,2,'image/png') from qa_tentativa;
$$;
create function pg_temp.encerrar(p_code text default 'timeout') returns void language sql as $$
 select historietas_privado.encerrar_tentativa_upload_pagina((t->>'tentativaId')::uuid,(t->>'leaseToken')::uuid,p_code) from qa_tentativa;
$$;
create function pg_temp.contagem() returns bigint language sql as $$
 select count(*) from historietas_privado.objetos_storage_com_reservas() where name like 'fb100000-0000-4000-8000-000000000001/%';
$$;
select ok(not exists(select 1 from pg_constraint where conrelid='historietas_privado.capitulo_upload_tentativas'::regclass and contype='f'),'ledger sem FK/cascata');
select ok((select relrowsecurity from pg_class where oid='historietas_privado.capitulo_upload_tentativas'::regclass),'RLS habilitada');
select ok(not has_table_privilege(r,'historietas_privado.capitulo_upload_tentativas','SELECT,INSERT,UPDATE,DELETE'),'ledger fechado para '||r)
 from unnest(array['anon','authenticated','service_role']) r;
select ok(not has_function_privilege(r,p.oid,'EXECUTE'),'protocolo privado: '||r||'/'||p.proname)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 cross join unnest(array['anon','authenticated','service_role']) r
 where n.nspname='historietas_privado' and p.proname in
 ('preparar_tentativa_upload_pagina','iniciar_transferencia_pagina','encerrar_tentativa_upload_pagina');
select is((select t->>'escritaHabilitada' from qa_tentativa),'false','nenhuma capacidade Storage concedida');
select is(pg_temp.contagem(),1::bigint,'reserva e tentativa contam uma vez');
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where name like 'fb100000-0000-4000-8000-000000000001/%'),2097152::bigint,'reserva conservadora mantida');
select is((select historietas_privado.preparar_tentativa_upload_pagina((r->>'reservaId')::uuid,
 'fb300000-0000-4000-8000-000000000001',0,'fb400000-0000-4000-8000-000000000001') from qa_tentativa),
 (select t from qa_tentativa),'retry nao renova lease nem duplica tentativa');
select throws_ok($$select historietas_privado.preparar_tentativa_upload_pagina((r->>'reservaId')::uuid,
 'fb300000-0000-4000-8000-000000000001',0,gen_random_uuid()) from qa_tentativa$$,'PT409',null,'reserva nao aceita outro escritor');
select throws_ok($$select pg_temp.iniciar(gen_random_uuid())$$,'PT409',null,'token diferente nao passa o fence');
select throws_ok($$select pg_temp.iniciar(null,2097153)$$,'23514',null,'bytes acima de 2 MiB recusados atomicamente');
select is((select estado from historietas_privado.capitulo_upload_tentativas),'preparada','erro anterior ao envio nao muda estado');

savepoint identidade;
select set_config('request.jwt.claims','{"sub":"fb100000-0000-4000-8000-000000000001","session_id":"fb500000-0000-4000-8000-000000000002"}',true);
select throws_ok($$select pg_temp.iniciar()$$,'42501',null,'outra sessao da mesma conta nao reutiliza lease');
rollback to identidade;
savepoint identidade;
select set_config('request.jwt.claim.sub','fb100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"fb100000-0000-4000-8000-000000000002","session_id":"fb500000-0000-4000-8000-000000000003"}',true);
select throws_ok($$select pg_temp.iniciar()$$,'42501',null,'troca para B nao reutiliza tentativa de A');
rollback to identidade;
savepoint logout;
delete from auth.sessions where id='fb500000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.iniciar()$$,'42501',null,'JWT ainda assinado apos logout nao inicia');
select is(pg_temp.contagem(),1::bigint,'logout nao apaga capacidade');
rollback to logout;
savepoint versao;
update public.capitulos set versao_paginas=1 where id='fb300000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.iniciar()$$,'PT409',null,'versao concorrente invalida inicio');
rollback to versao;
savepoint lease;
-- Fixture administrativa de tempo, nao ha API para alterar/renovar leases.
update historietas_privado.capitulo_upload_tentativas set criado_em=now()-interval '4 minutes',lease_ate=now()-interval '2 minutes';
select throws_ok($$select pg_temp.iniciar()$$,'PT409',null,'lease expirado nao pode enviar');
select is(pg_temp.contagem(),1::bigint,'lease expirado nao libera capacidade');
rollback to lease;

savepoint expiracao;
-- Snapshot historico sintetico: reserva ja vencida, tentativa que a precedeu.
-- Nao alteramos prazo por RPC nem removemos triggers para simular o relogio.
insert into historietas_privado.capitulo_uploads_pendentes
 (id,capitulo_id,user_id,storage_path,versao_esperada,criado_em,expira_em)
 values('fb600000-0000-4000-8000-000000000001','fb300000-0000-4000-8000-000000000001',
 'fb100000-0000-4000-8000-000000000001',
 'fb100000-0000-4000-8000-000000000001/capitulos/fb300000-0000-4000-8000-000000000001/fb600000-0000-4000-8000-000000000001.png',
 0,now()-interval '2 hours',now()-interval '1 hour');
insert into historietas_privado.capitulo_upload_tentativas
 (reserva_id,capitulo_id,user_id,sessao_id,chave_requisicao,versao_esperada,storage_path,mime_type,criado_em,lease_ate)
 select id,capitulo_id,user_id,'fb500000-0000-4000-8000-000000000001',gen_random_uuid(),0,storage_path,'image/png',
 now()-interval '2 hours',now()-interval '119 minutes'
 from historietas_privado.capitulo_uploads_pendentes where id='fb600000-0000-4000-8000-000000000001';
select is(pg_temp.contagem(),2::bigint,'expiracao da reserva E lease nao libera compromisso duravel');
select throws_ok($$select historietas_privado.preparar_tentativa_upload_pagina('fb600000-0000-4000-8000-000000000001',
 'fb300000-0000-4000-8000-000000000001',0,gen_random_uuid())$$,'PT410',null,'reserva vencida nao prepara outro envio');
rollback to expiracao;

savepoint propriedade;
update public.obras set user_id='fb100000-0000-4000-8000-000000000002' where id='fb200000-0000-4000-8000-000000000001';
select throws_ok($$select pg_temp.iniciar()$$,'42501',null,'propriedade revalidada antes do inicio');
rollback to propriedade;

savepoint antes_envio;
select lives_ok($$select pg_temp.encerrar('cancelamento')$$,'cancelamento antes do inicio');
select public.liberar_reserva_pagina_capitulo((r->>'reservaId')::uuid) from qa_tentativa;
select is(pg_temp.contagem(),0::bigint,'somente preparada cancelada pode liberar sem IO');
select lives_ok($$select pg_temp.encerrar('cancelamento')$$,'cancelamento idempotente');
select throws_ok($$select pg_temp.iniciar()$$,'PT410',null,'cancelada nao reativa');
rollback to antes_envio;

select lives_ok($$select pg_temp.iniciar()$$,'transicao unica com metadados canonicos');
select throws_ok($$select pg_temp.iniciar()$$,'PT409',null,'retry nao inicia segunda transferencia');
select lives_ok($$select pg_temp.encerrar()$$,'timeout registrado');
select lives_ok($$select pg_temp.encerrar()$$,'resultado ambiguo idempotente');
select is((select estado from historietas_privado.capitulo_upload_tentativas),'incerta','falha de rede nao comprova ausencia');
select throws_ok($$select pg_temp.iniciar()$$,'PT409',null,'incerta nao pode reenviar');
select throws_ok($$select pg_temp.encerrar('texto privado')$$,'22023',null,'nao grava mensagens internas ou arbitrarias');
select public.liberar_reserva_pagina_capitulo((r->>'reservaId')::uuid) from qa_tentativa;
select is(pg_temp.contagem(),1::bigint,'liberar reserva nao libera tentativa incerta');

savepoint objeto;
-- Apenas metadata sintetica na transacao com rollback; nenhum arquivo fisico.
insert into storage.objects(bucket_id,name,metadata)
 select 'arquivos-obras',storage_path,'{"size":100}' from historietas_privado.capitulo_upload_tentativas;
select is(pg_temp.contagem(),1::bigint,'arquivo e tentativa contam uma vez');
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where name like 'fb100000-0000-4000-8000-000000000001/%'),2097152::bigint,'arquivo menor nao solta compromisso');
rollback to objeto;

savepoint quota;
insert into storage.objects(bucket_id,name,metadata) select 'arquivos-obras',
 'fb100000-0000-4000-8000-000000000001/legado-'||g,'{"size":1}' from generate_series(1,29) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'fb100000-0000-4000-8000-000000000001/outro','1',null),'tentativa incerta ocupa ultima vaga dos anexos legados');
rollback to quota;

savepoint quota_bytes;
insert into storage.objects(bucket_id,name,metadata) select 'capas-obras',
 'fb100000-0000-4000-8000-000000000001/capa-'||g,'{"size":2097152}' from generate_series(1,49) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'fb100000-0000-4000-8000-000000000001/outro','1',null),'100 MiB inclui tentativa incerta');
rollback to quota_bytes;

savepoint quota_projeto;
insert into storage.objects(bucket_id,name,metadata) select 'arquivos-obras',
 'fb100000-0000-4000-8000-000000000002/legado-'||g,'{"size":1}' from generate_series(1,4999) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'fb100000-0000-4000-8000-000000000001/outro','1',null),'5000 objetos inclui tentativa incerta');
rollback to quota_projeto;

savepoint quota_projeto_bytes;
insert into storage.objects(bucket_id,name,metadata) select 'arquivos-obras',
 'fb100000-0000-4000-8000-000000000002/legado-'||g,'{"size":5242880}' from generate_series(1,140) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'fb100000-0000-4000-8000-000000000001/outro','1',null),'700 MiB inclui tentativa incerta');
rollback to quota_projeto_bytes;

delete from public.obras where id='fb200000-0000-4000-8000-000000000001';
select is((select count(*) from historietas_privado.capitulo_uploads_pendentes
 where user_id='fb100000-0000-4000-8000-000000000001'),0::bigint,'cascata remove reserva antiga');
select is(pg_temp.contagem(),1::bigint,'cascata da obra nao remove capacidade');
select ok(exists(select 1 from historietas_privado.capitulo_arquivos_limpeza
 where storage_path=(select storage_path from historietas_privado.capitulo_upload_tentativas)),'cascata preserva outbox');
select throws_ok($$select pg_temp.iniciar()$$,'42501',null,'capitulo apagado nao autoriza envio tardio');
delete from public.profiles where user_id='fb100000-0000-4000-8000-000000000001';
delete from auth.users where id='fb100000-0000-4000-8000-000000000001';
select is(pg_temp.contagem(),1::bigint,'excluir conta nao apaga rastreio ou quota global');
select lives_ok($$select pg_temp.encerrar()$$,'registro de falha continua possivel apos cascata');
select * from finish();
rollback;
