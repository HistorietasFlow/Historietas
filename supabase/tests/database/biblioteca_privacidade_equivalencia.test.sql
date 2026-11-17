begin;
select plan(36);

-- Copia literal da implementacao anterior, nao uma reescrita do oraculo.
-- Criada somente nesta transacao de teste, nunca em migration.
create or replace function historietas_privado.biblioteca_original_qa(
  p_user_id uuid,
  p_visibilidade text,
  p_categoria text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id is not null
    and (
      auth.uid() = p_user_id
      or (
        coalesce(p_visibilidade, 'privado') in ('publico', 'parcial')
        and public.usuario_pode_ver_aba_perfil(
          p_user_id,
          coalesce(
            (
              select preferencias.visibilidade_biblioteca
              from public.preferencias_privacidade preferencias
              where preferencias.user_id = p_user_id
            ),
            'somente_eu'
          )
        )
        and coalesce(
          (
            select case p_categoria
              when 'favoritos' then preferencias.mostrar_favoritos
              when 'concluidas' then preferencias.mostrar_concluidas
              when 'obra_avaliacoes' then preferencias.mostrar_avaliacoes
              when 'seguindo_obras' then preferencias.mostrar_quero_ler
              when 'salvos_capitulos' then preferencias.mostrar_historico_leitura
              else false
            end
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = p_user_id
          ),
          false
        )
      )
    );
$$;
revoke all on function historietas_privado.biblioteca_original_qa(uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function historietas_privado.biblioteca_original_qa(uuid,text,text) to anon,authenticated;

insert into auth.users(id) select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,8) g;
insert into public.preferencias_privacidade(user_id,visibilidade_biblioteca,mostrar_favoritos,mostrar_concluidas,mostrar_avaliacoes,mostrar_quero_ler,mostrar_historico_leitura)
select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,
 case g when 3 then 'seguidores' when 4 then 'seguindo' when 5 then 'somente_eu' else 'publico' end,
 g<>6,g<>7,g<>6,g<>7,g<>6 from generate_series(1,7) g;
-- Usuario 8 sem preferencias; 9 inexistente. Relações com direcoes distintas.
insert into public.seguindo_usuarios(seguidor_id,seguido_id) values ('b9100000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000003'),('b9100000-0000-4000-8000-000000000004','b9100000-0000-4000-8000-000000000001');
insert into public.usuarios_bloqueados(bloqueador_id,bloqueado_id) values ('b9100000-0000-4000-8000-000000000002','b9100000-0000-4000-8000-000000000001');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: anon; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: authenticated 1; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: authenticated 2; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: authenticated 3; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000004","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: authenticated 4; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000005","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: authenticated 5; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000006',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000006","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: authenticated 6; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000007',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000007","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: authenticated 7; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000008',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000008","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'inicial: authenticated 8; 350 comparacoes incluindo NULL');

reset role;
update public.preferencias_privacidade set visibilidade_biblioteca='somente_eu',mostrar_avaliacoes=false,mostrar_favoritos=false where user_id in ('b9100000-0000-4000-8000-000000000002','b9100000-0000-4000-8000-000000000003');
update public.preferencias_privacidade set mostrar_concluidas=not mostrar_concluidas,mostrar_quero_ler=not mostrar_quero_ler,mostrar_historico_leitura=not mostrar_historico_leitura where user_id in ('b9100000-0000-4000-8000-000000000006','b9100000-0000-4000-8000-000000000007');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: anon; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: authenticated 1; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: authenticated 2; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: authenticated 3; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000004","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: authenticated 4; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000005","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: authenticated 5; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000006',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000006","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: authenticated 6; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000007',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000007","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: authenticated 7; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000008',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000008","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'revogacao preferencias: authenticated 8; 350 comparacoes incluindo NULL');

reset role;
delete from public.usuarios_bloqueados where bloqueador_id='b9100000-0000-4000-8000-000000000002' and bloqueado_id='b9100000-0000-4000-8000-000000000001';
insert into public.usuarios_bloqueados(bloqueador_id,bloqueado_id) values ('b9100000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000004');
delete from public.seguindo_usuarios where seguidor_id='b9100000-0000-4000-8000-000000000001' and seguido_id='b9100000-0000-4000-8000-000000000003';

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: anon; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: authenticated 1; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: authenticated 2; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: authenticated 3; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000004","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: authenticated 4; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000005","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: authenticated 5; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000006',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000006","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: authenticated 6; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000007',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000007","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: authenticated 7; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000008',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000008","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'bloqueio inverso e remocao seguimento: authenticated 8; 350 comparacoes incluindo NULL');

reset role;
delete from public.preferencias_privacidade where user_id in ('b9100000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000004','b9100000-0000-4000-8000-000000000005','b9100000-0000-4000-8000-000000000006','b9100000-0000-4000-8000-000000000007');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: anon; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: authenticated 1; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: authenticated 2; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: authenticated 3; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000004","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: authenticated 4; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000005","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: authenticated 5; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000006',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000006","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: authenticated 6; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000007',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000007","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: authenticated 7; 350 comparacoes incluindo NULL');

reset role;
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000008',true);
select set_config('request.jwt.claims','{"sub":"b9100000-0000-4000-8000-000000000008","role":"authenticated"}',true);
set local role authenticated;
select is((
 with subjects(id) as (
  select ('b9100000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid from generate_series(1,9) g
  union all select null::uuid
 ), visibility(value) as (values ('publico'::text),('parcial'),('privado'),('invalida'),(null::text)),
 categories(value) as (values ('favoritos'::text),('concluidas'),('obra_avaliacoes'),('seguindo_obras'),('salvos_capitulos'),('invalida'),(null::text))
 select count(*) from subjects s cross join visibility v cross join categories c
 where historietas_privado.biblioteca_original_qa(s.id,v.value,c.value)
 is distinct from historietas_privado.usuario_pode_ver_registro_biblioteca(s.id,v.value,c.value)
),0::bigint,'preferencias removidas: authenticated 8; 350 comparacoes incluindo NULL');

reset role;
select * from finish();
rollback;
