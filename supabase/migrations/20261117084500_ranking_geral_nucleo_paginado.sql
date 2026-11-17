begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';

-- CORRECTIVE PR DRAFT stacked on #2348. Not a remote/production instruction.
-- Fail closed if the current anonymous access predicates differ from the
-- privacy semantics audited for this dedicated ranking function.
do $guard$
begin
  if not exists (
    select 1 from pg_catalog.pg_class t
    join pg_catalog.pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='obra_avaliacoes' and t.relrowsecurity
  ) or not exists (
    select 1 from pg_catalog.pg_policies p
    where p.schemaname='public' and p.tablename='obra_avaliacoes'
      and p.policyname='obra_avaliacoes_select_visiveis'
      and p.cmd='SELECT' and p.permissive='PERMISSIVE'
      and p.roles @> array['anon'::name,'authenticated'::name]
      and p.qual like '%usuario_pode_ver_registro_biblioteca%'
  ) or (select count(*) from pg_catalog.pg_policies p
    where p.schemaname='public' and p.tablename='obra_avaliacoes'
      and p.cmd in ('SELECT','ALL')) <> 1 then
    raise exception 'Ranking Geral: precondicao RLS de avaliacoes divergente.';
  end if;
  if not pg_catalog.has_schema_privilege('anon','historietas_privado','USAGE')
    or not pg_catalog.has_function_privilege('anon',
      'historietas_privado.usuario_pode_ver_registro_biblioteca(uuid,text,text)',
      'EXECUTE') then
    raise exception 'Ranking Geral: helper privado de privacidade sem ACL esperada.';
  end if;
end $guard$;

-- RLS fail-closed signature for tables, policies and privacy helpers.
-- The privileged page function checks this record on EVERY call.
create function historietas_privado.ranking_geral_assinatura_acesso()
returns text language sql stable security invoker set search_path = ''
as $audit$
with tables_and_policies as (
  select 'T:'||n.nspname||'.'||c.relname||':'||
    c.relrowsecurity::text||':'||c.relforcerowsecurity::text||':'||
    coalesce(c.relacl::text,'')||':'||coalesce(p.polname,'')||':'||
    coalesce(p.polcmd::text,'')||':'||coalesce(p.polpermissive::text,'')||':'||
    coalesce(p.polroles::text,'')||':'||
    coalesce(pg_catalog.pg_get_expr(p.polqual,c.oid,true),'')||':'||
    coalesce(pg_catalog.pg_get_expr(p.polwithcheck,c.oid,true),'') as item
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  left join pg_catalog.pg_policy p on p.polrelid=c.oid
  where n.nspname='public' and c.relkind in ('r','p')
    and c.relname in ('obra_avaliacoes','obras','capitulos',
      'preferencias_privacidade','usuarios_bloqueados','seguindo_usuarios')
), auth_helpers as (
  select 'F:'||n.nspname||'.'||p.proname||':'||
    p.pronargs::text||':'||p.prosrc||':'||p.prosecdef::text||':'||
    p.provolatile::text||':'||p.proowner::text||':'||
    coalesce(p.proconfig::text,'')||':'||coalesce(p.proacl::text,'') as item
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='historietas_privado'
      and p.proname='usuario_pode_ver_registro_biblioteca' and p.pronargs=3)
    or (n.nspname='public' and p.proname='usuario_pode_ver_aba_perfil'
      and p.pronargs=2)
    or (n.nspname='public' and p.proname='usuarios_possuem_bloqueio'
      and p.pronargs=2)
), items as (
  select item from tables_and_policies
  union all select item from auth_helpers
)
select pg_catalog.md5(coalesce(pg_catalog.string_agg(item,E'\n'
  order by item),''))
from items;
$audit$;
alter function historietas_privado.ranking_geral_assinatura_acesso()
  owner to postgres;
revoke all on function historietas_privado.ranking_geral_assinatura_acesso()
  from public, anon, authenticated, service_role;

create table historietas_privado.ranking_geral_selo_acesso (
  id boolean primary key default true check (id),
  assinatura text not null check (assinatura ~ '^[0-9a-f]{32}$')
);
alter table historietas_privado.ranking_geral_selo_acesso owner to postgres;
revoke all on historietas_privado.ranking_geral_selo_acesso
  from public, anon, authenticated, service_role;

do $audit_ready$
begin
  if (select count(*) from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind in ('r','p')
      and c.relname in ('obra_avaliacoes','obras','capitulos',
        'preferencias_privacidade','usuarios_bloqueados','seguindo_usuarios')
    ) <> 6
    or pg_catalog.to_regprocedure(
      'historietas_privado.usuario_pode_ver_registro_biblioteca(uuid,text,text)'
    ) is null
    or pg_catalog.to_regprocedure('public.usuario_pode_ver_aba_perfil(uuid,text)')
      is null
    or pg_catalog.to_regprocedure('public.usuarios_possuem_bloqueio(uuid,uuid)')
      is null then
    raise exception 'Ranking Geral: contrato de auditoria RLS incompleto.';
  end if;
end $audit_ready$;

insert into historietas_privado.ranking_geral_selo_acesso(id,assinatura)
values (true,historietas_privado.ranking_geral_assinatura_acesso());

-- This INTERNAL function bypasses RLS: its explicit visibility filters, 
-- source schema/owner, EXECUTE ACL and role/identity gate are security-critical.
-- Its output intentionally equals the public paginated RPC (never raw votes
-- or voter identifiers). Never grant it to authenticated, PUBLIC, service_role.
create function historietas_privado.listar_ranking_geral_nucleo(
  p_apos_obra uuid default null,
  p_assinatura text default null,
  p_limite integer default 20
)
returns table (
  estado text,
  obra_id uuid,
  posicao bigint,
  nota_media numeric,
  total_avaliacoes bigint,
  pontuacao numeric,
  assinatura text,
  tem_mais boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $func$
#variable_conflict use_column
declare
  v_limite integer;
begin
  -- Nunca permitir que um contexto autenticado inclua registros pessoais.
  -- O consumidor server-only faz a chamada usando uma sessao anonima.
  if current_setting('role',true) is distinct from 'anon'
     or auth.uid() is not null then
    raise exception using errcode = '42501',
      message = 'O Ranking Geral exige contexto anonimo.';
  end if;

  -- Fail closed when any audited SQL permission, RLS policy or helper
  -- changes after migration. Definer code must not silently outlive RLS.
  if not exists (
    select 1 from historietas_privado.ranking_geral_selo_acesso as selo
    where selo.id is true
      and selo.assinatura = historietas_privado.ranking_geral_assinatura_acesso()
  ) then
    raise exception using errcode = '42501',
      message = 'Ranking Geral bloqueado por divergencia nas regras de acesso.';
  end if;

  if p_limite is null or p_limite not between 1 and 50 then
    raise exception using errcode = '22023', message = 'Limite do Ranking Geral invalido.';
  end if;
  v_limite := p_limite;

  if (p_apos_obra is null) <> (p_assinatura is null) or
     (p_assinatura is not null and p_assinatura !~ '^[0-9a-f]{32}$') then
    raise exception using errcode = '22023', message = 'Cursor do Ranking Geral invalido.';
  end if;

  return query
  with
  obras_publicas as materialized (
    select obra.id, obra.user_id
    from public.obras as obra
    where obra.publicado is true
      and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
      and (
        coalesce(nullif(btrim(obra.arquivo_url), ''), '') <> ''
        or exists (
          select 1
          from public.capitulos as capitulo
          where capitulo.obra_id = obra.id
            and capitulo.publicado is true
              and capitulo.user_id = obra.user_id
        )
      )
  ),
  -- Authorization is computed once per preference owner under a privileged
  -- anonymous-only internal function. Reuses the existing privacy predicate.
  autores_autorizados as materialized (
    select p.user_id
    from public.preferencias_privacidade as p
    where historietas_privado.usuario_pode_ver_registro_biblioteca(
      p.user_id, 'parcial', 'obra_avaliacoes'
    )
  ),
  votos_publicos as materialized (
    select a.obra_id, count(*)::bigint as total,
      sum(a.nota)::numeric as soma
    from public.obra_avaliacoes as a
    join obras_publicas as obra on obra.id = a.obra_id
    join autores_autorizados as permitido on permitido.user_id = a.user_id
    where a.visibilidade in ('publico', 'parcial')
      and a.user_id <> obra.user_id
    group by a.obra_id
  ),
  calculadas as materialized (
    select
      votos.obra_id,
      votos.total as total_avaliacoes,
      votos.soma,
      (votos.soma / votos.total)::numeric as nota_media,
      ((votos.soma + 30::numeric) / (votos.total + 10)::numeric) as pontuacao
    from votos_publicos as votos
    where votos.total >= 1
  ),
  ordenadas as materialized (
    select
      calculadas.obra_id,
      calculadas.total_avaliacoes,
      calculadas.nota_media,
      calculadas.pontuacao,
      row_number() over (
        order by calculadas.pontuacao desc,
          calculadas.total_avaliacoes desc,
          calculadas.obra_id asc
      )::bigint as posicao
    from calculadas
  ),
  -- Candidato a protecao contra paginas obsoletas: medir custo em escala
  -- antes de aprovar esta estrategia como definitiva.
  identificacao as materialized (
    select md5(coalesce(string_agg(
      calculadas.obra_id::text || ':' ||
      calculadas.total_avaliacoes::text || ':' ||
      calculadas.soma::text,
      '|' order by calculadas.obra_id
    ), '')) as valor
    from calculadas
  ),
  cursor_atual as materialized (
    select
      identificacao.valor,
      coalesce((
        select ordenadas.posicao
        from ordenadas
        where ordenadas.obra_id = p_apos_obra
      ), 0::bigint) as apos_posicao,
      (
        p_apos_obra is null
        or (
          p_assinatura = identificacao.valor
          and exists (
            select 1 from ordenadas
            where ordenadas.obra_id = p_apos_obra
          )
        )
      ) as valido
    from identificacao
  ),
  proximas as materialized (
    select ordenadas.*
    from ordenadas
    cross join cursor_atual
    where cursor_atual.valido
      and ordenadas.posicao > cursor_atual.apos_posicao
    order by ordenadas.posicao
    limit (v_limite + 1)
  ),
  pagina as (
    select proximas.*,
      row_number() over (order by proximas.posicao) as numero_pagina
    from proximas
  ),
  saida as (
    select
      'ok'::text as estado,
      pagina.obra_id,
      pagina.posicao,
      pagina.nota_media,
      pagina.total_avaliacoes,
      pagina.pontuacao,
      cursor_atual.valor as assinatura,
      exists (select 1 from pagina as extra where extra.numero_pagina > v_limite) as tem_mais
    from pagina
    cross join cursor_atual
    where cursor_atual.valido
      and pagina.numero_pagina <= v_limite

    union all

    -- Sinal explicito: o cliente deve descartar paginas anteriores e recomecar.
    select
      'cursor_desatualizado'::text,
      null::uuid,
      null::bigint,
      null::numeric,
      null::bigint,
      null::numeric,
      cursor_atual.valor,
      false
    from cursor_atual
    where not cursor_atual.valido
  )
  select
    saida.estado, saida.obra_id, saida.posicao, saida.nota_media,
    saida.total_avaliacoes, saida.pontuacao, saida.assinatura, saida.tem_mais
  from saida
  order by saida.posicao asc nulls first;
end;
$func$;

alter function historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer) owner to postgres;
revoke all on function historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer) from public, anon, authenticated, service_role;
grant execute on function historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer) to anon;
comment on function historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer) is
  'Nucleo SECURITY DEFINER de ranking publico paginado, somente papel anon sem identidade; acesso SQL direto equivale a pagina da RPC publica; autoriza preferencias sem depender de RLS filtrada por linha.';

create or replace function public.listar_ranking_geral(
  p_apos_obra uuid default null,
  p_assinatura text default null,
  p_limite integer default 20
)
returns table (
  estado text, obra_id uuid, posicao bigint, nota_media numeric,
  total_avaliacoes bigint, pontuacao numeric, assinatura text, tem_mais boolean
)
language plpgsql stable security invoker
set search_path = ''
as $wrapper$
begin
  if current_user <> 'anon' or auth.uid() is not null then
    raise exception using errcode = '42501',
      message = 'O Ranking Geral exige contexto anonimo.';
  end if;
  return query
    select r.estado, r.obra_id, r.posicao, r.nota_media,
      r.total_avaliacoes, r.pontuacao, r.assinatura, r.tem_mais
    from historietas_privado.listar_ranking_geral_nucleo(
      p_apos_obra, p_assinatura, p_limite
    ) as r;
end;
$wrapper$;

-- Explicit ownership and least-privilege ACL, within this same transaction.
alter function public.listar_ranking_geral(uuid,text,integer) owner to postgres;
revoke all on function public.listar_ranking_geral(uuid,text,integer)
  from public, anon, authenticated, service_role;
grant execute on function public.listar_ranking_geral(uuid,text,integer) to anon;

comment on function public.listar_ranking_geral(uuid,text,integer) is
  'Ranking Geral publico, SECURITY INVOKER, anon-only; delega exclusivamente pagina publica a nucleo privado auditavel. Nunca divulga votos individuais.';

-- Migration invariants; fail instead of persisting a widened EXECUTE.
do $checks$
begin
  if not exists (
    select 1 from pg_catalog.pg_proc
    where oid='public.listar_ranking_geral(uuid,text,integer)'::pg_catalog.regprocedure
      and not prosecdef and provolatile='s'
  ) or not exists (
    select 1 from pg_catalog.pg_proc
    where oid='historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)'::pg_catalog.regprocedure
      and prosecdef and provolatile='s' and proowner='postgres'::pg_catalog.regrole
  ) then
    raise exception 'Ranking Geral: identidade/owner da funcao incorretos.';
  end if;
  if pg_catalog.has_function_privilege('anon',
      'historietas_privado.ranking_geral_assinatura_acesso()','EXECUTE')
     or pg_catalog.has_table_privilege('anon',
      'historietas_privado.ranking_geral_selo_acesso','SELECT')
     or (select count(*) from historietas_privado.ranking_geral_selo_acesso
         where id is true and assinatura =
           historietas_privado.ranking_geral_assinatura_acesso()) <> 1 then
    raise exception 'Ranking Geral: selo RLS ausente ou divergente.';
  end if;
  if not pg_catalog.has_function_privilege('anon',
       'historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)',
       'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated',
       'historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)',
       'EXECUTE')
    or pg_catalog.has_function_privilege('service_role',
       'historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)',
       'EXECUTE')
    or exists (
      select 1 from pg_catalog.pg_proc p,
        lateral pg_catalog.aclexplode(p.proacl) a
      where p.oid='historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)'::pg_catalog.regprocedure
        and a.grantee=0 and a.privilege_type='EXECUTE'
    ) then
    raise exception 'Ranking Geral: ACL do nucleo privado incorreta.';
  end if;
end $checks$;

notify pgrst,'reload schema';
commit;
