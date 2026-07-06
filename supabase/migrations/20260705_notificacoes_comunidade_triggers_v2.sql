-- 20260705_notificacoes_comunidade_triggers_v2.sql
-- Corrige triggers da comunidade removendo referências frágeis a colunas opcionais em profiles.
-- Rode depois de 20260705_notificacoes_comunidade_triggers.sql.

begin;

create or replace function public.obter_nome_usuario_notificacao(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := null;
  v_coluna text;
  v_predicados_usuario text[] := array[]::text[];
  v_expressoes_nome text[] := array[]::text[];
  v_sql text;
begin
  if p_user_id is null then
    return 'Usuário';
  end if;

  if to_regclass('public.profiles') is null then
    return 'Usuário';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_id'
  ) then
    v_predicados_usuario := array_append(v_predicados_usuario, 'user_id::text = $1::text');
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) then
    v_predicados_usuario := array_append(v_predicados_usuario, 'id::text = $1::text');
  end if;

  if array_length(v_predicados_usuario, 1) is null then
    return 'Usuário';
  end if;

  foreach v_coluna in array array[
    'nome',
    'nome_usuario',
    'username',
    'display_name',
    'apelido'
  ] loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = v_coluna
    ) then
      v_expressoes_nome := array_append(
        v_expressoes_nome,
        format('nullif(trim(%I::text), '''')', v_coluna)
      );
    end if;
  end loop;

  if array_length(v_expressoes_nome, 1) is null then
    return 'Usuário';
  end if;

  v_sql := format(
    'select coalesce(%s) from public.profiles where (%s) limit 1',
    array_to_string(v_expressoes_nome, ', '),
    array_to_string(v_predicados_usuario, ' or ')
  );

  execute v_sql into v_nome using p_user_id;

  return coalesce(nullif(trim(v_nome), ''), 'Usuário');
exception
  when others then
    return 'Usuário';
end;
$$;

revoke all on function public.obter_nome_usuario_notificacao(uuid) from public;
grant execute on function public.obter_nome_usuario_notificacao(uuid) to authenticated;

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
  if to_regprocedure('public.criar_notificacao_comunidade_interna(uuid, uuid, text, text, text, text, text)') is null then
    return new;
  end if;

  select id, autor_id
  into v_post
  from public.comunidade_posts
  where id = new.post_id
  limit 1;

  if not found or v_post.id is null then
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
exception
  when others then
    return new;
end;
$$;

revoke all on function public.notificar_curtida_post_comunidade() from public;

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
  if to_regprocedure('public.criar_notificacao_comunidade_interna(uuid, uuid, text, text, text, text, text)') is null then
    return new;
  end if;

  select id, autor_id
  into v_post
  from public.comunidade_posts
  where id = new.post_id
  limit 1;

  if not found or v_post.id is null then
    return new;
  end if;

  v_nome := nullif(trim(coalesce(to_jsonb(new) ->> 'autor_nome', '')), '');
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
exception
  when others then
    return new;
end;
$$;

revoke all on function public.notificar_comentario_post_comunidade() from public;

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
  if to_regprocedure('public.criar_notificacao_comunidade_interna(uuid, uuid, text, text, text, text, text)') is null then
    return new;
  end if;

  select id, post_id, autor_id
  into v_comentario
  from public.comunidade_comentarios
  where id = new.comentario_id
  limit 1;

  if not found or v_comentario.id is null then
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
exception
  when others then
    return new;
end;
$$;

revoke all on function public.notificar_curtida_comentario_comunidade() from public;

-- Garante que os triggers continuem apontando para as funções corrigidas.
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
