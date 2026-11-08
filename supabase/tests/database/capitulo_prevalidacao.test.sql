begin;
select no_plan();
insert into auth.users(id) values ('fa100000-0000-4000-8000-000000000001'),
  ('fa100000-0000-4000-8000-000000000002') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
  ('fa100000-0000-4000-8000-000000000001','fa100000-0000-4000-8000-000000000001','QA reservas','autor'),
  ('fa100000-0000-4000-8000-000000000002','fa100000-0000-4000-8000-000000000002','QA terceiro','leitor');
select set_config('request.jwt.claim.sub','fa100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
  ('fa200000-0000-4000-8000-000000000001','fa100000-0000-4000-8000-000000000001','QA reservas','QA','Fantasia','HQ','Livre',false,'qa-prevalidacao-capitulo');
insert into public.capitulos(id,obra_id,user_id,titulo,ordem,publicado) values
  ('fa300000-0000-4000-8000-000000000001','fa200000-0000-4000-8000-000000000001',
   'fa100000-0000-4000-8000-000000000001','Draft texto preservado',1,false);

insert into auth.sessions(id,user_id) values
 ('fa500000-0000-4000-8000-000000000001','fa100000-0000-4000-8000-000000000001');
select set_config('request.jwt.claims','{"sub":"fa100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"fa500000-0000-4000-8000-000000000001"}',true);
create temp table reserva_qa as select public.reservar_pagina_capitulo(
 'fa300000-0000-4000-8000-000000000001',0,'fa400000-0000-4000-8000-000000000001','image/png') r;
grant select on reserva_qa to authenticated;
select ok(not has_function_privilege('anon','public.conferir_reserva_pagina_capitulo(uuid,uuid,bigint)','EXECUTE'),'anon sem conferencia');
select ok(not has_function_privilege('service_role','public.conferir_reserva_pagina_capitulo(uuid,uuid,bigint)','EXECUTE'),'service role sem conferencia');
select ok(not (select prosecdef from pg_proc where oid='public.conferir_reserva_pagina_capitulo(uuid,uuid,bigint)'::regprocedure),'wrapper invoker');
set local role authenticated;
select lives_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0) from reserva_qa$$,
 'sessao real + propriedade + reserva validas');
select is((select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0)->>'mimeType' from reserva_qa),
 'image/png','formato vem da reserva');
select ok((select not (public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0) ? 'storage_path') from reserva_qa),
 'conferencia nao expoe caminho');
select throws_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',1) from reserva_qa$$,
 'PT409',null,'versao diferente recusada');
select throws_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000099',0) from reserva_qa$$,
 '42501',null,'nao mistura capitulo e reserva');
reset role;
select is((select estado from historietas_privado.capitulo_uploads_pendentes where user_id='fa100000-0000-4000-8000-000000000001'),'reservado','conferencia nao muda estado');
select is((select count(*)::integer from historietas_privado.capitulo_uploads_pendentes where user_id='fa100000-0000-4000-8000-000000000001'),1,'conferencia nao duplica quota');

savepoint transicao;
update public.capitulos set versao_paginas=1 where id='fa300000-0000-4000-8000-000000000001';
select throws_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0) from reserva_qa$$,
 'PT409',null,'mudanca concorrente de versao invalida conferencia');
rollback to transicao;

savepoint transicao;
select public.liberar_reserva_pagina_capitulo((r->>'reservaId')::uuid) from reserva_qa;
select throws_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0) from reserva_qa$$,
 'PT410',null,'liberacao invalida conferencia');
rollback to transicao;

savepoint transicao;
delete from auth.sessions where id='fa500000-0000-4000-8000-000000000001';
select throws_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0) from reserva_qa$$,
 '42501',null,'JWT antigo nao sobrevive ao logout');
rollback to transicao;

savepoint transicao;
update auth.sessions set not_after=now()-interval '1 second' where id='fa500000-0000-4000-8000-000000000001';
select throws_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0) from reserva_qa$$,
 '42501',null,'sessao expirada nao autoriza');
rollback to transicao;

select set_config('request.jwt.claims','{"sub":"fa100000-0000-4000-8000-000000000002","role":"authenticated","session_id":"fa500000-0000-4000-8000-000000000001"}',true);
select set_config('request.jwt.claim.sub','fa100000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0) from reserva_qa$$,
 '42501',null,'sessao de A nao autoriza B');
select set_config('request.jwt.claims','{"sub":"fa100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"invalido"}',true);
select set_config('request.jwt.claim.sub','fa100000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.conferir_reserva_pagina_capitulo((r->>'reservaId')::uuid,'fa300000-0000-4000-8000-000000000001',0) from reserva_qa$$,
 '42501',null,'sessao forjada/malformada falha fechada');
select ok(not has_table_privilege('authenticated','historietas_privado.capitulo_uploads_pendentes','UPDATE'),'nenhuma nova escrita concedida');
select ok(not has_function_privilege('service_role','public.limitar_prevalidacao_pagina_capitulo()','EXECUTE'),'adaptador nao concede service role');
select ok(not has_function_privilege('anon','public.limitar_prevalidacao_pagina_capitulo()','EXECUTE'),'adaptador nao concede anon');
select set_config('request.jwt.claims','{"sub":"fa100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"fa500000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
select ok((select bool_and((public.limitar_prevalidacao_pagina_capitulo()->>'permitido')::boolean)
 from generate_series(1,30)),'trinta chamadas permitidas por identidade');
select is(public.limitar_prevalidacao_pagina_capitulo()->>'permitido','false','excedente bloqueado no nucleo existente');
reset role;
insert into auth.sessions(id,user_id) values
 ('fa500000-0000-4000-8000-000000000002','fa100000-0000-4000-8000-000000000002');
select set_config('request.jwt.claims','{"sub":"fa100000-0000-4000-8000-000000000002","role":"authenticated","session_id":"fa500000-0000-4000-8000-000000000002"}',true);
select set_config('request.jwt.claim.sub','fa100000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is(public.limitar_prevalidacao_pagina_capitulo()->>'permitido','true','conta B nao herda bloqueio de A');
reset role;
delete from auth.sessions where id='fa500000-0000-4000-8000-000000000002';
select throws_ok($$select public.limitar_prevalidacao_pagina_capitulo()$$,'42501',null,'sessao revogada nao consome rate limit');
select * from finish();
rollback;
