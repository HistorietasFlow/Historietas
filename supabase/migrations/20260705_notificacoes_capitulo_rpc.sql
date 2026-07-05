-- 20260705_notificacoes_capitulo_rpc.sql
-- Cria notificações reais de capítulo pelo banco, sem depender de insert client-side bloqueado por RLS.

begin;

create or replace function public.criar_notificacoes_capitulo(
  p_obra_id uuid,
  p_capitulo_id uuid,
  p_titulo text,
  p_mensagem text,
  p_href text,
  p_tipo text default 'novo-capitulo',
  p_criado_em timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_autor_id uuid;
  v_obra record;
  v_capitulo record;
  v_receptor_id uuid;
  v_total integer := 0;
begin
  v_autor_id := auth.uid();

  if v_autor_id is null then
    return 0;
  end if;

  select id, user_id, titulo, autor, publicado
    into v_obra
  from public.obras
  where id = p_obra_id
  limit 1;

  if not found then
    return 0;
  end if;

  if v_obra.user_id <> v_autor_id then
    return 0;
  end if;

  if coalesce(v_obra.publicado, false) = false then
    return 0;
  end if;

  select id, obra_id, titulo, publicado
    into v_capitulo
  from public.capitulos
  where id = p_capitulo_id
    and obra_id = p_obra_id
  limit 1;

  if not found then
    return 0;
  end if;

  if coalesce(v_capitulo.publicado, true) = false then
    return 0;
  end if;

  insert into public.notificacoes (
    user_id,
    tipo,
    titulo,
    mensagem,
    obra_id,
    capitulo_id,
    href,
    link,
    lida,
    metadata,
    criada_em,
    criado_em,
    atualizado_em
  )
  select distinct
    receptores.receptor_id,
    coalesce(nullif(p_tipo, ''), 'novo-capitulo'),
    coalesce(nullif(p_titulo, ''), 'Atualização de capítulo'),
    coalesce(nullif(p_mensagem, ''), 'Um capítulo recebeu uma atualização.'),
    p_obra_id,
    p_capitulo_id,
    coalesce(nullif(p_href, ''), '/notificacoes'),
    coalesce(nullif(p_href, ''), '/notificacoes'),
    false,
    jsonb_build_object(
      'obra_titulo', coalesce(v_obra.titulo, ''),
      'autor', coalesce(v_obra.autor, ''),
      'capitulo_titulo', coalesce(v_capitulo.titulo, ''),
      'origem', 'criar_notificacoes_capitulo'
    ),
    coalesce(p_criado_em, now()),
    coalesce(p_criado_em, now()),
    coalesce(p_criado_em, now())
  from (
    select so.user_id::uuid as receptor_id
    from public.seguindo_obras so
    where so.obra_id = p_obra_id

    union

    select f.user_id::uuid as receptor_id
    from public.favoritos f
    where f.obra_id = p_obra_id

    union

    select su.seguidor_id::uuid as receptor_id
    from public.seguindo_usuarios su
    where su.seguido_id = v_autor_id
  ) receptores
  where receptores.receptor_id is not null
    and receptores.receptor_id <> v_autor_id;

  get diagnostics v_total = row_count;

  return v_total;
end;
$$;

grant execute on function public.criar_notificacoes_capitulo(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) to authenticated;

commit;