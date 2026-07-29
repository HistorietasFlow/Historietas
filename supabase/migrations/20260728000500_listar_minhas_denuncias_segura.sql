-- 20260728000500_listar_minhas_denuncias_segura.sql
-- Permite que cada usuário consulte somente o status das próprias denúncias,
-- sem expor observacao_admin, analisado_por, denunciante_id ou dados de terceiros.
--
-- Pré-requisitos:
--   20260728000200_comunidade_denuncias_validacoes.sql
--   20260728000300_criar_denuncia_rpc_segura.sql
--   20260728000400_comunidade_denuncias_somente_rpc.sql
--
-- Uso no frontend:
--
-- const { data, error } = await supabase.rpc("listar_minhas_denuncias", {
--   p_limite: 80,
-- });

begin;

do $$
begin
  if to_regclass('public.comunidade_denuncias') is null then
    raise exception
      'A tabela public.comunidade_denuncias precisa existir antes desta migration.';
  end if;
end
$$;

-- Garante que usuários comuns não leiam diretamente a tabela inteira.
-- O painel administrativo continua usando a policy de SELECT para admin/moderador.
drop policy if exists "comunidade_denuncias_select_proprias_ou_admin"
  on public.comunidade_denuncias;

drop policy if exists "comunidade_denuncias_select_proprias"
  on public.comunidade_denuncias;

drop policy if exists "comunidade_denuncias_select_proprio"
  on public.comunidade_denuncias;

create or replace function public.listar_minhas_denuncias(
  p_limite integer default 80
)
returns table (
  denuncia_id uuid,
  alvo_tipo text,
  alvo_id uuid,
  status text,
  analisado_em timestamptz,
  criado_em timestamptz,
  atualizado_em timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select
    denuncia.id as denuncia_id,
    denuncia.alvo_tipo,
    denuncia.alvo_id,
    denuncia.status,
    denuncia.analisado_em,
    denuncia.criado_em,
    denuncia.atualizado_em
  from public.comunidade_denuncias denuncia
  where auth.uid() is not null
    and denuncia.denunciante_id = auth.uid()
  order by denuncia.criado_em desc
  limit greatest(1, least(coalesce(p_limite, 80), 100));
$$;

comment on function public.listar_minhas_denuncias(integer) is
  'Retorna somente campos seguros e somente denúncias pertencentes ao usuário autenticado.';

-- Funções recebem EXECUTE de PUBLIC por padrão.
revoke all
  on function public.listar_minhas_denuncias(integer)
  from public;

revoke all
  on function public.listar_minhas_denuncias(integer)
  from anon;

revoke all
  on function public.listar_minhas_denuncias(integer)
  from authenticated;

grant execute
  on function public.listar_minhas_denuncias(integer)
  to authenticated;

commit;