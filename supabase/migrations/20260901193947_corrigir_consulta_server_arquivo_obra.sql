-- Corrige a consulta server-only usada para emitir URLs temporárias de arquivos.
-- service_role continua sem SELECT direto em public.obras: a API recebe somente
-- os cinco campos necessários e apenas quando informa o UUID exato da obra.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if to_regnamespace('historietas_privado') is null
     or not has_schema_privilege(
       'service_role',
       'historietas_privado',
       'usage'
     ) then
    raise exception
      'Precondição falhou: o schema privado não está disponível para service_role.';
  end if;
end;
$$;

create or replace function historietas_privado.obter_arquivo_obra_para_assinatura(
  p_obra_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  publicado boolean,
  classificacao_indicativa text,
  arquivo_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    obra.id,
    obra.user_id,
    obra.publicado,
    obra.classificacao_indicativa,
    obra.arquivo_url
  from public.obras as obra
  where obra.id = p_obra_id
  limit 1;
$$;

revoke all on function historietas_privado.obter_arquivo_obra_para_assinatura(uuid)
from public, anon, authenticated, service_role;

grant execute on function historietas_privado.obter_arquivo_obra_para_assinatura(uuid)
to service_role;

comment on function historietas_privado.obter_arquivo_obra_para_assinatura(uuid)
is 'Núcleo privado de menor privilégio para consultar os dados necessários à assinatura de um arquivo de obra.';

create or replace function public.obter_arquivo_obra_para_assinatura(
  p_obra_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  publicado boolean,
  classificacao_indicativa text,
  arquivo_url text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from historietas_privado.obter_arquivo_obra_para_assinatura(p_obra_id);
$$;

revoke all on function public.obter_arquivo_obra_para_assinatura(uuid)
from public, anon, authenticated, service_role;

grant execute on function public.obter_arquivo_obra_para_assinatura(uuid)
to service_role;

comment on function public.obter_arquivo_obra_para_assinatura(uuid)
is 'Wrapper server-only para autorizar e assinar um arquivo de obra. Executável somente por service_role.';

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'historietas_privado'
      and procedure.proname = 'obter_arquivo_obra_para_assinatura'
      and procedure.prosecdef
      and procedure.provolatile = 's'
      and procedure.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception
      'O núcleo privado da consulta de arquivos não ficou protegido corretamente.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'obter_arquivo_obra_para_assinatura'
      and not procedure.prosecdef
      and procedure.provolatile = 's'
      and procedure.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception
      'O wrapper público da consulta de arquivos não ficou seguro.';
  end if;

  if has_function_privilege(
    'anon',
    'historietas_privado.obter_arquivo_obra_para_assinatura(uuid)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'historietas_privado.obter_arquivo_obra_para_assinatura(uuid)',
    'execute'
  ) or not has_function_privilege(
    'service_role',
    'historietas_privado.obter_arquivo_obra_para_assinatura(uuid)',
    'execute'
  ) or has_function_privilege(
    'anon',
    'public.obter_arquivo_obra_para_assinatura(uuid)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.obter_arquivo_obra_para_assinatura(uuid)',
    'execute'
  ) or not has_function_privilege(
    'service_role',
    'public.obter_arquivo_obra_para_assinatura(uuid)',
    'execute'
  ) then
    raise exception
      'As permissões da RPC administrativa de arquivos estão incorretas.';
  end if;

  if has_table_privilege(
    'service_role',
    'public.obras',
    'select'
  ) then
    raise exception 'service_role recebeu SELECT direto indevido em public.obras.';
  end if;
end;
$$;

commit;
