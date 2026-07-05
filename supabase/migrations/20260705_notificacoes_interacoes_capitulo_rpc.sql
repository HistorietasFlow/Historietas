-- 20260705_notificacoes_interacoes_capitulo_rpc.sql
-- Cria notificações reais para curtida/comentário de capítulo usando SECURITY DEFINER.
-- Resolve o bloqueio de RLS quando um leitor precisa notificar o autor ou outro usuário.

begin;

create or replace function public.criar_notificacao_interacao_capitulo(
  p_capitulo_id uuid,
  p_comentario_id uuid,
  p_tipo text,
  p_titulo text,
  p_mensagem text,
  p_link text
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid;
  v_obra_id uuid;
  v_notificacao_id text;
  v_tipo text := nullif(trim(coalesce(p_tipo, '')), '');
  v_titulo text := nullif(trim(coalesce(p_titulo, '')), '');
  v_mensagem text := nullif(trim(coalesce(p_mensagem, '')), '');
  v_link text := nullif(trim(coalesce(p_link, '')), '');
begin
  if v_ator_id is null or p_capitulo_id is null or v_tipo is null then
    return 0;
  end if;

  select
    c.obra_id,
    coalesce(o.user_id, c.user_id)
  into
    v_obra_id,
    v_receptor_id
  from public.capitulos c
  left join public.obras o on o.id = c.obra_id
  where c.id = p_capitulo_id
  limit 1;

  if v_obra_id is null or v_receptor_id is null then
    return 0;
  end if;

  if v_tipo = 'curtida-comentario-capitulo' then
    if p_comentario_id is null then
      return 0;
    end if;

    select cc.user_id
    into v_receptor_id
    from public.comentarios_capitulos cc
    where cc.id = p_comentario_id
      and cc.capitulo_id = p_capitulo_id
    limit 1;

    if v_receptor_id is null then
      return 0;
    end if;
  end if;

  if v_receptor_id = v_ator_id then
    return 0;
  end if;

  v_notificacao_id :=
    case
      when v_tipo = 'curtida-capitulo' then
        'curtida-capitulo:' || p_capitulo_id::text || ':' || v_ator_id::text
      when v_tipo = 'comentario-capitulo' and p_comentario_id is not null then
        'comentario-capitulo:' || p_comentario_id::text
      when v_tipo = 'curtida-comentario-capitulo' and p_comentario_id is not null then
        'curtida-comentario-capitulo:' || p_comentario_id::text || ':' || v_ator_id::text
      else
        v_tipo || ':' || p_capitulo_id::text || ':' || v_ator_id::text || ':' || extract(epoch from now())::text
    end;

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
    v_obra_id,
    p_capitulo_id,
    coalesce(v_titulo, 'Nova interação no capítulo'),
    coalesce(v_mensagem, 'Você recebeu uma nova interação em um capítulo.'),
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

grant execute on function public.criar_notificacao_interacao_capitulo(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) to authenticated;

commit;
