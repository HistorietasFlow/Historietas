-- 20260705_notificacoes_social_rpc.sql
-- RPC genérica para notificações sociais reutilizável em seguir, comunidade e próximas interações.

begin;

create or replace function public.criar_notificacao_social(
  p_user_id uuid,
  p_tipo text,
  p_titulo text default null,
  p_mensagem text default null,
  p_link text default null,
  p_notificacao_id text default null,
  p_obra_id uuid default null,
  p_capitulo_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid := p_user_id;
  v_tipo text := nullif(trim(coalesce(p_tipo, '')), '');
  v_titulo text := nullif(trim(coalesce(p_titulo, '')), '');
  v_mensagem text := nullif(trim(coalesce(p_mensagem, '')), '');
  v_link text := nullif(trim(coalesce(p_link, '')), '');
  v_notificacao_id text := nullif(trim(coalesce(p_notificacao_id, '')), '');
begin
  if v_ator_id is null or v_receptor_id is null or v_tipo is null then
    return 0;
  end if;

  if v_receptor_id = v_ator_id then
    return 0;
  end if;

  if v_tipo = 'seguir-usuario' then
    if not exists (
      select 1
      from public.seguindo_usuarios su
      where su.seguidor_id = v_ator_id
        and su.seguido_id = v_receptor_id
      limit 1
    ) then
      return 0;
    end if;
  end if;

  if v_notificacao_id is null then
    v_notificacao_id :=
      v_tipo || ':' || v_ator_id::text || ':' || v_receptor_id::text;
  end if;

  if exists (
    select 1
    from public.notificacoes n
    where n.user_id = v_receptor_id
      and n.notificacao_id = v_notificacao_id
    limit 1
  ) then
    return 0;
  end if;

  insert into public.notificacoes (
    user_id,
    obra_id,
    capitulo_id,
    titulo,
    mensagem,
    tipo,
    link,
    lida,
    notificacao_id,
    autor_id,
    criada_em,
    created_at,
    updated_at
  )
  values (
    v_receptor_id,
    p_obra_id,
    p_capitulo_id,
    coalesce(v_titulo, 'Nova notificação'),
    coalesce(v_mensagem, 'Você recebeu uma nova notificação.'),
    v_tipo,
    coalesce(v_link, '/notificacoes'),
    false,
    v_notificacao_id,
    v_ator_id,
    now(),
    now(),
    now()
  );

  return 1;
end;
$$;

grant execute on function public.criar_notificacao_social(
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid
) to authenticated;

commit;
