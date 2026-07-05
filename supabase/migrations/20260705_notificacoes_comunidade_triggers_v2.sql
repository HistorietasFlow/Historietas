-- 20260705_notificacoes_comunidade_triggers_v2.sql
-- Corrige triggers da comunidade removendo referências a colunas inexistentes em profiles
-- como nome_usuario/username.

begin;

create or replace function public.obter_nome_usuario_notificacao(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := '';
begin
  select nullif(trim(coalesce(p.nome, '')), '')
  into v_nome
  from public.profiles p
  where p.user_id = p_user_id or p.id = p_user_id
  limit 1;

  return coalesce(v_nome, 'Usuário');
exception
  when undefined_column then
    return 'Usuário';
  when others then
    return 'Usuário';
end;
$$;

create or replace function public.notificar_curtida_post_comunidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post record;
  v_nome text;
begin
  select id, autor_id
  into v_post
  from public.comunidade_posts
  where id = new.post_id
  limit 1;

  if v_post.id is null then
    return new;
  end if;

  v_nome := public.obter_nome_usuario_notificacao(new.usuario_id);

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.usuario_id,
    'comunidade-curtida-post',
    'Nova curtida na Comunidade',
    v_nome || ' curtiu sua publicação.',
    '/comunidade?post=' || new.post_id::text,
    'comunidade-curtida-post:' || new.post_id::text || ':' || new.usuario_id::text
  );

  return new;
end;
$$;

create or replace function public.notificar_comentario_post_comunidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post record;
  v_nome text;
begin
  select id, autor_id
  into v_post
  from public.comunidade_posts
  where id = new.post_id
  limit 1;

  if v_post.id is null then
    return new;
  end if;

  v_nome := nullif(trim(coalesce(new.autor_nome, '')), '');
  v_nome := coalesce(v_nome, public.obter_nome_usuario_notificacao(new.autor_id));

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.autor_id,
    'comunidade-comentario-post',
    'Novo comentário na Comunidade',
    v_nome || ' comentou na sua publicação.',
    '/comunidade?post=' || new.post_id::text,
    'comunidade-comentario-post:' || new.post_id::text || ':' || new.id::text
  );

  return new;
end;
$$;

create or replace function public.notificar_curtida_comentario_comunidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comentario record;
  v_nome text;
begin
  select id, post_id, autor_id
  into v_comentario
  from public.comunidade_comentarios
  where id = new.comentario_id
  limit 1;

  if v_comentario.id is null then
    return new;
  end if;

  v_nome := public.obter_nome_usuario_notificacao(new.usuario_id);

  perform public.criar_notificacao_comunidade_interna(
    v_comentario.autor_id,
    new.usuario_id,
    'comunidade-curtida-comentario',
    'Nova curtida no seu comentário',
    v_nome || ' curtiu seu comentário na Comunidade.',
    '/comunidade?post=' || v_comentario.post_id::text,
    'comunidade-curtida-comentario:' || new.comentario_id::text || ':' || new.usuario_id::text
  );

  return new;
end;
$$;

commit;
