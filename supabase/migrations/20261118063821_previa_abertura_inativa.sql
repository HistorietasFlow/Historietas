-- Minuta para revisão. A instalação deixa a prévia desativada.
begin;
set local lock_timeout = '5s';
set local search_path = pg_catalog;

do $pre$
begin
  if current_user <> 'postgres' then
    raise exception 'A proposta deve ser criada pelo papel postgres.';
  end if;
  if has_any_column_privilege('anon', 'auth.sessions', 'SELECT')
     or has_any_column_privilege('authenticated', 'auth.sessions', 'SELECT') then
    raise exception 'Revisar o acesso direto preexistente a auth.sessions.';
  end if;
  if not has_schema_privilege(current_user, 'auth', 'USAGE')
     or not has_table_privilege(current_user, 'auth.sessions', 'SELECT') then
    raise exception 'O proprietário não dispõe da leitura de Auth necessária.';
  end if;
end
$pre$;

-- Schema dedicado. A criação falha em caso de colisão com objeto preexistente.
create schema previa_interno authorization postgres;
revoke all on schema previa_interno from public, anon, authenticated, service_role;
grant usage on schema previa_interno to authenticated;

create function previa_interno.sessao_atual_ativa()
returns boolean
language sql stable security definer
set search_path = ''
return exists (
  select 1
  from auth.sessions as sessao
  where sessao.id = case
    when pg_catalog.pg_input_is_valid((select auth.jwt() ->> 'session_id'), 'pg_catalog.uuid')
    then ((select auth.jwt() ->> 'session_id'))::pg_catalog.uuid
  end
    and sessao.user_id = (select auth.uid())
    and (sessao.not_after is null or sessao.not_after > pg_catalog.statement_timestamp())
);
revoke all on function previa_interno.sessao_atual_ativa()
  from public, anon, authenticated, service_role;
grant execute on function previa_interno.sessao_atual_ativa() to authenticated;

create function previa_interno.abertura_obra(p_slug text)
returns table(trecho text)
language plpgsql stable security invoker
set search_path = ''
as $previa$
declare
  headers jsonb := pg_catalog.current_setting('request.headers', true)::jsonb;
begin
  if current_user = 'authenticated' then
    if (select auth.uid()) is null
       or coalesce(((select auth.jwt()) ->> 'exp')::numeric, 0)
          <= extract(epoch from pg_catalog.statement_timestamp())
       or not previa_interno.sessao_atual_ativa() then
      raise sqlstate 'PT401' using message = 'Sessão inválida.';
    end if;
  elsif current_user = 'anon' then
    if headers ? 'authorization' and
       coalesce(headers ->> 'authorization', '') !~* '^Bearer[[:space:]]+[^[:space:]]+$' then
      raise sqlstate 'PT401' using message = 'Sessão inválida.';
    end if;
  else
    raise insufficient_privilege using message = 'Papel não habilitado para leitura.';
  end if;

  return query
  select pg_catalog.left(capitulo.texto, 600)
  from public.obras as obra
  cross join lateral (
    select c.texto, c.tipo_conteudo
    from public.capitulos as c
    where c.ordem = 1
      and c.obra_id = obra.id
      and c.user_id = obra.user_id
      and c.publicado is true
    order by c.id
    limit 1
  ) as capitulo
  where obra.slug = p_slug
    and obra.publicado is true
    and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
    and public.usuario_pode_ver_perfil(obra.user_id)
    and (public.carregar_permissoes_abas_perfil(obra.user_id) ->> 'obras') = 'true'
    and capitulo.tipo_conteudo = 'texto'
    and pg_catalog.btrim(pg_catalog.left(capitulo.texto, 600)) <> '';
end;
$previa$;

revoke all on function previa_interno.abertura_obra(text)
  from public, anon, authenticated, service_role;

-- Recusa privilégios inesperados inclusive de outros papéis em ACLs por padrão.
do $acl$
declare
  owner_oid oid := 'postgres'::regrole;
  reader_oid oid := 'authenticated'::regrole;
begin
  if exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where p.pronamespace = 'previa_interno'::regnamespace
      and (p.proowner <> owner_oid or (a.grantee <> owner_oid and not (
        p.oid = 'previa_interno.sessao_atual_ativa()'::regprocedure
        and a.grantee = reader_oid and a.privilege_type = 'EXECUTE' and not a.is_grantable
      )))
  ) or exists (
    select 1
    from pg_namespace n
    cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
    where n.oid = 'previa_interno'::regnamespace and a.grantee <> owner_oid
      and not (a.grantee = reader_oid and a.privilege_type = 'USAGE' and not a.is_grantable)
  ) then
    raise exception 'Permissões inesperadas no schema ou nas funções da prévia.';
  end if;
end
$acl$;
commit;
