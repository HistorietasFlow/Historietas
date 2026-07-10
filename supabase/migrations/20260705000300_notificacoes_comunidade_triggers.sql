-- 20260705_notificacoes_comunidade_triggers.sql
-- Cria notificações reais automaticamente quando houver interação na Comunidade.
-- Não depende do front-end chamar RPC.
-- Versão corrigida:
-- - evita quebrar se public.notificacoes tiver colunas opcionais diferentes;
-- - evita quebrar por colunas opcionais ausentes em profiles;
-- - mantém funções internas sem execução pública;
-- - não deixa falha de notificação derrubar curtida/comentário.

begin;

-- ============================================================
-- HELPER: NOME PÚBLICO DO USUÁRIO
-- ============================================================

create or replace function public.historietas_nome_publico_usuario(
  p_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := null;
  v_colunas_nome text[] := array[]::text[];
  v_predicados_usuario text[] := array[]::text[];
  v_sql text;
begin
  if p_user_id is null then
    return 'Usuário';
  end if;

  if to_regclass('public.profiles') is null then
    return 'Usuário';
  end if;

  select array_agg(
    format('nullif(trim(%I::text), '''')', c.column_name)
    order by array_position(
      array[
        'nome',
        'nome_usuario',
        'username',
        'apelido',
        'display_name',
        'nome_exibicao'
      ]::text[],
      c.column_name
    )
  )
  into v_colunas_nome
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'profiles'
    and c.column_name = any(
      array[
        'nome',
        'nome_usuario',
        'username',
        'apelido',
        'display_name',
        'nome_exibicao'
      ]::text[]
    );

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) then
    v_predicados_usuario := array_append(v_predicados_usuario, 'id::text = $1::text');
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

  if array_length(v_colunas_nome, 1) is null
    or array_length(v_predicados_usuario, 1) is null
  then
    return 'Usuário';
  end if;

  v_sql := format(
    'select coalesce(%s, ''Usuário'') from public.profiles where (%s) limit 1',
    array_to_string(v_colunas_nome, ', '),
    array_to_string(v_predicados_usuario, ' or ')
  );

  execute v_sql into v_nome using p_user_id;

  return coalesce(nullif(trim(v_nome), ''), 'Usuário');
exception
  when others then
    return 'Usuário';
end;
$$;

-- ============================================================
-- HELPER INTERNO: CRIAR NOTIFICAÇÃO
-- ============================================================

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

  v_tem_user_id boolean := false;
  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_titulo boolean := false;
  v_tem_mensagem boolean := false;
  v_tem_tipo boolean := false;
  v_tem_link boolean := false;
  v_tem_href boolean := false;
  v_tem_lida boolean := false;
  v_tem_notificacao_id boolean := false;
  v_tem_autor_id boolean := false;
  v_tem_criada_em boolean := false;
  v_tem_criado_em boolean := false;
  v_tem_created_at boolean := false;
  v_tem_atualizado_em boolean := false;
  v_tem_updated_at boolean := false;
  v_tem_metadata boolean := false;

  v_tipo_notificacao_id text := null;
  v_tipo_metadata text := null;

  v_cols text[] := array[]::text[];
  v_vals text[] := array[]::text[];

  v_agora timestamptz := now();
  v_metadata jsonb;
  v_sql text;
begin
  if v_user_id is null
    or v_ator_id is null
    or v_user_id = v_ator_id
    or v_tipo is null
    or v_notificacao_id is null
  then
    return;
  end if;

  if to_regclass('public.notificacoes') is null then
    return;
  end if;

  v_titulo := coalesce(v_titulo, 'Nova interação na Comunidade');
  v_mensagem := coalesce(v_mensagem, 'Você recebeu uma nova interação na Comunidade.');
  v_link := coalesce(v_link, '/comunidade');

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'user_id'
  ) into v_tem_user_id;

  if v_tem_user_id = false then
    return;
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'obra_id'
  ) into v_tem_obra_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'capitulo_id'
  ) into v_tem_capitulo_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'titulo'
  ) into v_tem_titulo;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'mensagem'
  ) into v_tem_mensagem;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'tipo'
  ) into v_tem_tipo;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'link'
  ) into v_tem_link;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'href'
  ) into v_tem_href;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'lida'
  ) into v_tem_lida;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
  ) into v_tem_notificacao_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'autor_id'
  ) into v_tem_autor_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'criada_em'
  ) into v_tem_criada_em;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'criado_em'
  ) into v_tem_criado_em;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'created_at'
  ) into v_tem_created_at;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'atualizado_em'
  ) into v_tem_atualizado_em;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'updated_at'
  ) into v_tem_updated_at;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'metadata'
  ) into v_tem_metadata;

  if v_tem_notificacao_id then
    select data_type
      into v_tipo_notificacao_id
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
    limit 1;
  end if;

  if v_tem_metadata then
    select data_type
      into v_tipo_metadata
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'metadata'
    limit 1;
  end if;

  v_metadata := jsonb_build_object(
    'notificacao_id', v_notificacao_id,
    'ator_id', v_ator_id,
    'origem', 'notificacoes_comunidade_triggers'
  );

  -- Remove notificação antiga do mesmo evento para evitar duplicidade.
  if v_tem_notificacao_id then
    if v_tipo_notificacao_id = 'uuid' then
      execute '
        delete from public.notificacoes
        where user_id = $1
          and notificacao_id = (
            substr(md5($2), 1, 8) || ''-'' ||
            substr(md5($2), 9, 4) || ''-'' ||
            substr(md5($2), 13, 4) || ''-'' ||
            substr(md5($2), 17, 4) || ''-'' ||
            substr(md5($2), 21, 12)
          )::uuid
      '
      using v_user_id, v_notificacao_id;
    else
      execute '
        delete from public.notificacoes
        where user_id = $1
          and notificacao_id::text = $2
      '
      using v_user_id, v_notificacao_id;
    end if;
  elsif v_tem_metadata then
    execute '
      delete from public.notificacoes
      where user_id = $1
        and metadata ->> ''notificacao_id'' = $2
    '
    using v_user_id, v_notificacao_id;
  end if;

  v_cols := array_append(v_cols, 'user_id');
  v_vals := array_append(v_vals, '$1');

  if v_tem_obra_id then
    v_cols := array_append(v_cols, 'obra_id');
    v_vals := array_append(v_vals, 'null');
  end if;

  if v_tem_capitulo_id then
    v_cols := array_append(v_cols, 'capitulo_id');
    v_vals := array_append(v_vals, 'null');
  end if;

  if v_tem_titulo then
    v_cols := array_append(v_cols, 'titulo');
    v_vals := array_append(v_vals, '$2');
  end if;

  if v_tem_mensagem then
    v_cols := array_append(v_cols, 'mensagem');
    v_vals := array_append(v_vals, '$3');
  end if;

  if v_tem_tipo then
    v_cols := array_append(v_cols, 'tipo');
    v_vals := array_append(v_vals, '$4');
  end if;

  if v_tem_link then
    v_cols := array_append(v_cols, 'link');
    v_vals := array_append(v_vals, '$5');
  end if;

  if v_tem_href then
    v_cols := array_append(v_cols, 'href');
    v_vals := array_append(v_vals, '$5');
  end if;

  if v_tem_lida then
    v_cols := array_append(v_cols, 'lida');
    v_vals := array_append(v_vals, 'false');
  end if;

  if v_tem_notificacao_id then
    v_cols := array_append(v_cols, 'notificacao_id');

    if v_tipo_notificacao_id = 'uuid' then
      v_vals := array_append(
        v_vals,
        '(substr(md5($6), 1, 8) || ''-'' || substr(md5($6), 9, 4) || ''-'' || substr(md5($6), 13, 4) || ''-'' || substr(md5($6), 17, 4) || ''-'' || substr(md5($6), 21, 12))::uuid'
      );
    else
      v_vals := array_append(v_vals, '$6');
    end if;
  end if;

  if v_tem_autor_id then
    v_cols := array_append(v_cols, 'autor_id');
    v_vals := array_append(v_vals, '$7');
  end if;

  if v_tem_criada_em then
    v_cols := array_append(v_cols, 'criada_em');
    v_vals := array_append(v_vals, '$8');
  end if;

  if v_tem_criado_em then
    v_cols := array_append(v_cols, 'criado_em');
    v_vals := array_append(v_vals, '$8');
  end if;

  if v_tem_created_at then
    v_cols := array_append(v_cols, 'created_at');
    v_vals := array_append(v_vals, '$8');
  end if;

  if v_tem_atualizado_em then
    v_cols := array_append(v_cols, 'atualizado_em');
    v_vals := array_append(v_vals, '$8');
  end if;

  if v_tem_updated_at then
    v_cols := array_append(v_cols, 'updated_at');
    v_vals := array_append(v_vals, '$8');
  end if;

  if v_tem_metadata then
    v_cols := array_append(v_cols, 'metadata');

    if v_tipo_metadata = 'json' then
      v_vals := array_append(v_vals, '$9::jsonb::json');
    else
      v_vals := array_append(v_vals, '$9::jsonb');
    end if;
  end if;

  v_sql := format(
    'insert into public.notificacoes (%s) values (%s)',
    array_to_string(v_cols, ', '),
    array_to_string(v_vals, ', ')
  );

  execute v_sql
  using
    v_user_id,
    v_titulo,
    v_mensagem,
    v_tipo,
    v_link,
    v_notificacao_id,
    v_ator_id,
    v_agora,
    v_metadata;
exception
  when others then
    raise notice 'Falha ao criar notificação da comunidade: %', sqlerrm;
    return;
end;
$$;

-- ============================================================
-- TRIGGER: CURTIDA EM POST
-- ============================================================

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

  v_nome := public.historietas_nome_publico_usuario(new.usuario_id);

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
exception
  when others then
    raise notice 'Falha no trigger notificar_curtida_post_comunidade: %', sqlerrm;
    return new;
end;
$$;

-- ============================================================
-- TRIGGER: COMENTÁRIO EM POST
-- ============================================================

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

  v_nome := nullif(trim(coalesce(to_jsonb(new) ->> 'autor_nome', '')), '');

  if v_nome is null then
    v_nome := public.historietas_nome_publico_usuario(new.autor_id);
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
exception
  when others then
    raise notice 'Falha no trigger notificar_comentario_post_comunidade: %', sqlerrm;
    return new;
end;
$$;

-- ============================================================
-- TRIGGER: CURTIDA EM COMENTÁRIO
-- ============================================================

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

  v_nome := public.historietas_nome_publico_usuario(new.usuario_id);

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
exception
  when others then
    raise notice 'Falha no trigger notificar_curtida_comentario_comunidade: %', sqlerrm;
    return new;
end;
$$;

-- ============================================================
-- INSTALAÇÃO DOS TRIGGERS
-- ============================================================

do $$
begin
  if to_regclass('public.comunidade_curtidas') is not null
    and to_regclass('public.comunidade_posts') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'comunidade_curtidas'
        and column_name in ('post_id', 'usuario_id')
      group by table_schema, table_name
      having count(*) = 2
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'comunidade_posts'
        and column_name in ('id', 'autor_id')
      group by table_schema, table_name
      having count(*) = 2
    )
  then
    drop trigger if exists trg_notificar_curtida_post_comunidade on public.comunidade_curtidas;

    create trigger trg_notificar_curtida_post_comunidade
    after insert on public.comunidade_curtidas
    for each row
    execute function public.notificar_curtida_post_comunidade();
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_comentarios') is not null
    and to_regclass('public.comunidade_posts') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'comunidade_comentarios'
        and column_name in ('id', 'post_id', 'autor_id')
      group by table_schema, table_name
      having count(*) = 3
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'comunidade_posts'
        and column_name in ('id', 'autor_id')
      group by table_schema, table_name
      having count(*) = 2
    )
  then
    drop trigger if exists trg_notificar_comentario_post_comunidade on public.comunidade_comentarios;

    create trigger trg_notificar_comentario_post_comunidade
    after insert on public.comunidade_comentarios
    for each row
    execute function public.notificar_comentario_post_comunidade();
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_comentario_curtidas') is not null
    and to_regclass('public.comunidade_comentarios') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'comunidade_comentario_curtidas'
        and column_name in ('comentario_id', 'usuario_id')
      group by table_schema, table_name
      having count(*) = 2
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'comunidade_comentarios'
        and column_name in ('id', 'post_id', 'autor_id')
      group by table_schema, table_name
      having count(*) = 3
    )
  then
    drop trigger if exists trg_notificar_curtida_comentario_comunidade on public.comunidade_comentario_curtidas;

    create trigger trg_notificar_curtida_comentario_comunidade
    after insert on public.comunidade_comentario_curtidas
    for each row
    execute function public.notificar_curtida_comentario_comunidade();
  end if;
end $$;

-- ============================================================
-- PERMISSÕES
-- ============================================================

revoke all on function public.historietas_nome_publico_usuario(uuid) from public;
revoke all on function public.historietas_nome_publico_usuario(uuid) from anon;
revoke all on function public.historietas_nome_publico_usuario(uuid) from authenticated;

revoke all on function public.criar_notificacao_comunidade_interna(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text
) from public;

revoke all on function public.criar_notificacao_comunidade_interna(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text
) from anon;

revoke all on function public.criar_notificacao_comunidade_interna(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text
) from authenticated;

revoke all on function public.notificar_curtida_post_comunidade() from public;
revoke all on function public.notificar_curtida_post_comunidade() from anon;
revoke all on function public.notificar_curtida_post_comunidade() from authenticated;

revoke all on function public.notificar_comentario_post_comunidade() from public;
revoke all on function public.notificar_comentario_post_comunidade() from anon;
revoke all on function public.notificar_comentario_post_comunidade() from authenticated;

revoke all on function public.notificar_curtida_comentario_comunidade() from public;
revoke all on function public.notificar_curtida_comentario_comunidade() from anon;
revoke all on function public.notificar_curtida_comentario_comunidade() from authenticated;

commit;