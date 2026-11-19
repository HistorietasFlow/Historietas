-- Minuta para revisão. A instalação deixa a consulta indisponível.
begin;
set local lock_timeout = '5s';
set local search_path = pg_catalog;

do $pre$
begin
  if current_user <> 'postgres' then
    raise exception 'Esta migration deve ser executada pelo papel postgres.';
  end if;
  if not has_function_privilege(current_user, 'previa_interno.sessao_atual_ativa()', 'EXECUTE') then
    raise exception 'O proprietário precisa executar o validador de sessão existente.';
  end if;
end;
$pre$;

create schema qa5_sinais_interno authorization postgres;
revoke all on schema qa5_sinais_interno from public, anon, authenticated, service_role;

create function qa5_sinais_interno.autores_visiveis(p_autores uuid[])
returns table (user_id uuid)
language plpgsql stable security definer set search_path = ''
as $qa5$
declare
  v_leitor uuid := auth.uid();
begin
  if v_leitor is null
    or auth.role() is distinct from 'authenticated'
    or not coalesce(
      case when pg_catalog.jsonb_typeof((select auth.jwt() -> 'exp')) = 'number'
        then ((select auth.jwt() ->> 'exp'))::numeric > extract(epoch from pg_catalog.statement_timestamp())
        else false
      end, false)
    or not previa_interno.sessao_atual_ativa() then
    raise sqlstate 'PT401' using message = 'Sessão inválida.';
  end if;

  -- Consultar somente relações do leitor atual, em ambas as direções.
  -- Sem leitor no payload, sem políticas alteradas e sem devolver dados privados.
  return query
  with autores as (
    select distinct autor.id
    from pg_catalog.unnest(p_autores) as autor(id)
    where autor.id is not null
  ),
  bloqueados as (
    select bloqueio.bloqueado_id as id
    from public.usuarios_bloqueados as bloqueio
    where bloqueio.bloqueador_id = v_leitor
    union
    select bloqueio.bloqueador_id
    from public.usuarios_bloqueados as bloqueio
    where bloqueio.bloqueado_id = v_leitor
  )
  select autor.id
  from autores as autor
  left join public.preferencias_privacidade as privacidade on privacidade.user_id = autor.id
  left join public.seguindo_usuarios as leitor_segue
    on leitor_segue.seguidor_id = v_leitor and leitor_segue.seguido_id = autor.id
  left join public.seguindo_usuarios as autor_segue
    on autor_segue.seguidor_id = autor.id and autor_segue.seguido_id = v_leitor
  left join bloqueados on bloqueados.id = autor.id
  where autor.id = v_leitor
    or (
      bloqueados.id is null
      and (not coalesce(privacidade.perfil_privado, false) or leitor_segue.seguidor_id is not null)
      and case (case when privacidade.user_id is null then 'publico' else privacidade.visibilidade_obras end)
        when 'publico' then true
        when 'seguidores' then leitor_segue.seguidor_id is not null
        when 'seguindo' then autor_segue.seguidor_id is not null
        else false
      end
    );
end;
$qa5$;

revoke all on function qa5_sinais_interno.autores_visiveis(uuid[]) from public, anon, authenticated, service_role;

create function public.qa5_generos_interacoes_autorizadas()
returns text[]
language plpgsql stable security invoker set search_path = ''
as $qa5$
begin
  if current_user <> 'authenticated' then
    raise insufficient_privilege using message = 'Leitor autenticado necessário.';
  end if;

  if (select auth.uid()) is null
    or not coalesce(
      case when pg_catalog.jsonb_typeof((select auth.jwt() -> 'exp')) = 'number'
        then ((select auth.jwt() ->> 'exp'))::numeric > extract(epoch from pg_catalog.statement_timestamp())
        else false
      end, false)
    or not previa_interno.sessao_atual_ativa() then
    raise sqlstate 'PT401' using message = 'Sessão inválida.';
  end if;

  return (
    with leitor as materialized (select auth.uid() as id),
    interacoes as (
      select obra_id from public.favoritos where user_id = (select id from leitor)
      union
      select obra_id from public.seguindo_obras where user_id = (select id from leitor)
      union
      select obra_id from public.concluidas where user_id = (select id from leitor)
    ),
    obras_candidatas as materialized (
      select obra.user_id, pg_catalog.btrim(obra.genero) as genero
      from interacoes
      join public.obras as obra on obra.id = interacoes.obra_id
      where obra.publicado
        and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
        and pg_catalog.char_length(pg_catalog.btrim(obra.genero)) between 1 and 64
        and (
          nullif(pg_catalog.btrim(obra.arquivo_url), '') is not null
          or exists (
            select 1 from public.capitulos as capitulo
            where capitulo.obra_id = obra.id and capitulo.publicado
          )
        )
    ),
    autores_candidatos as (
      select pg_catalog.array_agg(distinct user_id) as ids
      from obras_candidatas
    ),
    autores_autorizados as materialized (
      select autor.user_id
      from autores_candidatos as candidatos
      cross join lateral qa5_sinais_interno.autores_visiveis(candidatos.ids) as autor
    ),
    contagens as (
      select min(obra.genero) as genero, count(*) as obras
      from obras_candidatas as obra
      join autores_autorizados as autor using (user_id)
      group by pg_catalog.translate(pg_catalog.lower(genero),
        'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')
    ),
    preferencias as (
      select genero, obras from contagens order by obras desc, genero collate pg_catalog."C" limit 3
    )
    select coalesce(array_agg(genero order by obras desc, genero collate pg_catalog."C"), '{}'::text[])
    from preferencias
  );
end;
$qa5$;

revoke all on function public.qa5_generos_interacoes_autorizadas() from public, anon, authenticated, service_role;

do $acl$
declare
  dono oid := 'postgres'::regrole;
  interno oid := 'qa5_sinais_interno'::regnamespace;
  auxiliar oid := 'qa5_sinais_interno.autores_visiveis(uuid[])'::regprocedure;
  publica oid := 'public.qa5_generos_interacoes_autorizadas()'::regprocedure;
begin
  if not exists (
    select 1 from pg_namespace where oid = interno and nspowner = dono
  ) or not exists (
    select 1 from pg_proc
    where oid = auxiliar and proowner = dono and prosecdef and proconfig = array['search_path=""']
  ) or not exists (
    select 1 from pg_proc
    where oid = publica and proowner = dono and not prosecdef and proconfig = array['search_path=""']
  ) then
    raise exception 'Proprietário ou contexto de execução inesperado nas recomendações.';
  end if;

  -- A instalação só admite o proprietário. Inclui beneficiários de privilégios padrão.
  if exists (
    select 1 from pg_namespace as n
    cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) as acl
    where n.oid = interno and acl.grantee <> dono
  ) or exists (
    select 1 from pg_proc as f
    cross join lateral aclexplode(coalesce(f.proacl, acldefault('f', f.proowner))) as acl
    where (f.pronamespace = interno or f.oid = publica) and acl.grantee <> dono
  ) or exists (
    select 1 from unnest(array['anon', 'authenticated', 'service_role', 'authenticator']) as papel(nome)
    where has_schema_privilege(papel.nome, interno, 'USAGE, CREATE')
      or has_function_privilege(papel.nome, auxiliar, 'EXECUTE')
      or has_function_privilege(papel.nome, publica, 'EXECUTE')
  ) then
    raise exception 'Privilégios inesperados na instalação das recomendações.';
  end if;
end;
$acl$;

notify pgrst, 'reload schema';
commit;
