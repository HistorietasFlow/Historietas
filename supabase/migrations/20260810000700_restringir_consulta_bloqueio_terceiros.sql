-- Evita que um usuario autenticado consulte relacoes de bloqueio
-- entre duas contas terceiras usando a RPC diretamente.
-- Consultas envolvendo o proprio usuario continuam funcionando.
-- Administradores e moderadores mantem acesso para fins de moderacao.

create or replace function public.usuarios_possuem_bloqueio(
  p_usuario_a uuid,
  p_usuario_b uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
  select
    p_usuario_a is not null
    and p_usuario_b is not null
    and p_usuario_a <> p_usuario_b
    and (
      auth.uid() = p_usuario_a
      or auth.uid() = p_usuario_b
      or coalesce(public.usuario_e_admin(), false)
    )
    and exists (
      select 1
      from public.usuarios_bloqueados bloqueio
      where (
        bloqueio.bloqueador_id = p_usuario_a
        and bloqueio.bloqueado_id = p_usuario_b
      )
      or (
        bloqueio.bloqueador_id = p_usuario_b
        and bloqueio.bloqueado_id = p_usuario_a
      )
    );
$$;

revoke all on function public.usuarios_possuem_bloqueio(uuid, uuid)
  from public;

grant execute on function public.usuarios_possuem_bloqueio(uuid, uuid)
  to authenticated;

comment on function public.usuarios_possuem_bloqueio(uuid, uuid) is
  'Retorna se existe bloqueio entre o usuario autenticado e outro usuario; administradores e moderadores tambem podem consultar pares de terceiros.';