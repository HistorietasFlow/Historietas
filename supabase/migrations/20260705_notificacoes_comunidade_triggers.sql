-- 20260705_notificacoes_comunidade_triggers.sql
-- Cria notificações reais automaticamente quando houver interação na Comunidade.
-- Não depende do front-end chamar RPC.

begin;

create or replace function public.criar_notificacao_comunidade_interna(
  p_user_id uuid,
  p_ator_id uuid,
  p_tipo text,
  p_titulo text,
  p_mensagem text,
  p_link text,
  p_notificacao_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := p_user_id;
  v_ator_id uuid := p_ator_id;
  v_tipo text := nullif(trim(coalesce(p_tipo, '')), '');
  v_titulo text := nullif(trim(coalesce(p_titulo, '')), '');
  v_mensagem text := nullif(trim(coalesce(p_mensagem, '')), '');
  v_link text := nullif(trim(coalesce(p_link, '')), '');
  v_notificacao_id text := nullif(trim(coalesce(p_notificacao_id, '')), '');
begin
  if v_user_id is null
    or v_ator_id is null
    or v_user_id = v_ator_id
    or v_tipo is null
    or v_notificacao_id is null
  then
    return;
  end if;

  delete from public.notificacoes
  where user_id = v_user_id
    and notificacao_id = v_notificacao_id;

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
    v_user_id,
    null,
    null,
    coalesce(v_titulo, 'Nova interação na Comunidade'),
    coalesce(v_mensagem, 'Você recebeu uma nova interação na Comunidade.'),
    v_tipo,
    coalesce(v_link, '/comunidade'),
    false,
    v_notificacao_id,
    v_ator_id,
    now(),
    now(),
    now()
  );
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

  select coalesce(
    nullif(trim(p.nome), ''),
    nullif(trim(p.nome_usuario), ''),
    nullif(trim(p.username), ''),
    'Usuário'
  )
  into v_nome
  from public.profiles p
  where p.user_id = new.usuario_id or p.id = new.usuario_id
  limit 1;

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.usuario_id,
    'comunidade-curtida-post',
    'Nova curtida na Comunidade',
    coalesce(v_nome, 'Usuário') || ' curtiu sua publicação.',
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

  if v_nome is null then
    select coalesce(
      nullif(trim(p.nome), ''),
      nullif(trim(p.nome_usuario), ''),
      nullif(trim(p.username), ''),
      'Usuário'
    )
    into v_nome
    from public.profiles p
    where p.user_id = new.autor_id or p.id = new.autor_id
    limit 1;
  end if;

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.autor_id,
    'comunidade-comentario-post',
    'Novo comentário na Comunidade',
    coalesce(v_nome, 'Usuário') || ' comentou na sua publicação.',
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

  select coalesce(
    nullif(trim(p.nome), ''),
    nullif(trim(p.nome_usuario), ''),
    nullif(trim(p.username), ''),
    'Usuário'
  )
  into v_nome
  from public.profiles p
  where p.user_id = new.usuario_id or p.id = new.usuario_id
  limit 1;

  perform public.criar_notificacao_comunidade_interna(
    v_comentario.autor_id,
    new.usuario_id,
    'comunidade-curtida-comentario',
    'Nova curtida no seu comentário',
    coalesce(v_nome, 'Usuário') || ' curtiu seu comentário na Comunidade.',
    '/comunidade?post=' || v_comentario.post_id::text,
    'comunidade-curtida-comentario:' || new.comentario_id::text || ':' || new.usuario_id::text
  );

  return new;
end;
$$;

drop trigger if exists trg_notificar_curtida_post_comunidade on public.comunidade_curtidas;
create trigger trg_notificar_curtida_post_comunidade
after insert on public.comunidade_curtidas
for each row
execute function public.notificar_curtida_post_comunidade();

drop trigger if exists trg_notificar_comentario_post_comunidade on public.comunidade_comentarios;
create trigger trg_notificar_comentario_post_comunidade
after insert on public.comunidade_comentarios
for each row
execute function public.notificar_comentario_post_comunidade();

drop trigger if exists trg_notificar_curtida_comentario_comunidade on public.comunidade_comentario_curtidas;
create trigger trg_notificar_curtida_comentario_comunidade
after insert on public.comunidade_comentario_curtidas
for each row
execute function public.notificar_curtida_comentario_comunidade();

commit;
