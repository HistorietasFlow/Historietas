-- 20260705_notificacoes_comunidade_triggers_v2.sql
-- Corrige os triggers da Comunidade sem depender de colunas opcionais
-- específicas em public.profiles.
-- Rode depois de 20260705_notificacoes_comunidade_triggers.sql.
-- As funções são internas e falhas de notificação não cancelam a interação.

begin;

-- ============================================================
-- HELPER: NOME PÚBLICO DO USUÁRIO
-- ============================================================

create or replace function public.obter_nome_usuario_notificacao(
  p_user_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_nome text;
  v_coluna text;
  v_predicados_usuario text[] := array[]::text[];
  v_expressoes_nome text[] := array[]::text[];
  v_sql text;
begin
  if p_user_id is null
    or to_regclass('public.profiles') is null
  then
    return 'Usuário';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_id'
  ) then
    v_predicados_usuario := array_append(
      v_predicados_usuario,
      'user_id::text = $1::text'
    );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) then
    v_predicados_usuario := array_append(
      v_predicados_usuario,
      'id::text = $1::text'
    );
  end if;

  if array_length(v_predicados_usuario, 1) is null then
    return 'Usuário';
  end if;

  foreach v_coluna in array array[
    'nome',
    'nome_usuario',
    'username',
    'display_name',
    'nome_exibicao',
    'apelido'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = v_coluna
    ) then
      v_expressoes_nome := array_append(
        v_expressoes_nome,
        format(
          'nullif(btrim(%I::text), '''')',
          v_coluna
        )
      );
    end if;
  end loop;

  if array_length(v_expressoes_nome, 1) is null then
    return 'Usuário';
  end if;

  v_sql := format(
    'select coalesce(%s, ''Usuário'')
       from public.profiles
      where (%s)
      limit 1',
    array_to_string(v_expressoes_nome, ', '),
    array_to_string(v_predicados_usuario, ' or ')
  );

  execute v_sql
  into v_nome
  using p_user_id;

  return left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );
exception
  when others then
    return 'Usuário';
end;
$$;

-- ============================================================
-- TRIGGER: CURTIDA EM POST
-- ============================================================

create or replace function public.notificar_curtida_post_comunidade()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_post record;
  v_nome text;
begin
  if new.post_id is null
    or new.usuario_id is null
    or to_regclass('public.comunidade_posts') is null
    or to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is null
  then
    return new;
  end if;

  select post.id, post.autor_id
  into v_post
  from public.comunidade_posts post
  where post.id = new.post_id
  limit 1;

  if v_post.id is null
    or v_post.autor_id is null
    or v_post.autor_id = new.usuario_id
  then
    return new;
  end if;

  v_nome :=
    public.obter_nome_usuario_notificacao(new.usuario_id);

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.usuario_id,
    'comunidade-curtida-post',
    'Nova curtida na Comunidade',
    v_nome || ' curtiu sua publicação.',
    '/comunidade?post=' || new.post_id::text,
    'comunidade-curtida-post:' ||
      new.post_id::text ||
      ':' ||
      new.usuario_id::text
  );

  return new;
exception
  when others then
    raise warning
      'Falha no trigger notificar_curtida_post_comunidade: %',
      sqlerrm;

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
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_post record;
  v_nome text;
begin
  if new.id is null
    or new.post_id is null
    or new.autor_id is null
    or to_regclass('public.comunidade_posts') is null
    or to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is null
  then
    return new;
  end if;

  select post.id, post.autor_id
  into v_post
  from public.comunidade_posts post
  where post.id = new.post_id
  limit 1;

  if v_post.id is null
    or v_post.autor_id is null
    or v_post.autor_id = new.autor_id
  then
    return new;
  end if;

  v_nome :=
    nullif(
      btrim(coalesce(to_jsonb(new) ->> 'autor_nome', '')),
      ''
    );

  if v_nome is null then
    v_nome :=
      public.obter_nome_usuario_notificacao(new.autor_id);
  else
    v_nome := left(
      regexp_replace(v_nome, E'[\n\r\t]+', ' ', 'g'),
      80
    );
  end if;

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.autor_id,
    'comunidade-comentario-post',
    'Novo comentário na Comunidade',
    v_nome || ' comentou na sua publicação.',
    '/comunidade?post=' || new.post_id::text,
    'comunidade-comentario-post:' ||
      new.post_id::text ||
      ':' ||
      new.id::text
  );

  return new;
exception
  when others then
    raise warning
      'Falha no trigger notificar_comentario_post_comunidade: %',
      sqlerrm;

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
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_comentario record;
  v_nome text;
begin
  if new.comentario_id is null
    or new.usuario_id is null
    or to_regclass('public.comunidade_comentarios') is null
    or to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is null
  then
    return new;
  end if;

  select
    comentario.id,
    comentario.post_id,
    comentario.autor_id
  into v_comentario
  from public.comunidade_comentarios comentario
  where comentario.id = new.comentario_id
  limit 1;

  if v_comentario.id is null
    or v_comentario.post_id is null
    or v_comentario.autor_id is null
    or v_comentario.autor_id = new.usuario_id
  then
    return new;
  end if;

  v_nome :=
    public.obter_nome_usuario_notificacao(new.usuario_id);

  perform public.criar_notificacao_comunidade_interna(
    v_comentario.autor_id,
    new.usuario_id,
    'comunidade-curtida-comentario',
    'Nova curtida no seu comentário',
    v_nome || ' curtiu seu comentário na Comunidade.',
    '/comunidade?post=' || v_comentario.post_id::text,
    'comunidade-curtida-comentario:' ||
      new.comentario_id::text ||
      ':' ||
      new.usuario_id::text
  );

  return new;
exception
  when others then
    raise warning
      'Falha no trigger notificar_curtida_comentario_comunidade: %',
      sqlerrm;

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
    drop trigger if exists
      trg_notificar_curtida_post_comunidade
      on public.comunidade_curtidas;

    create trigger trg_notificar_curtida_post_comunidade
    after insert
    on public.comunidade_curtidas
    for each row
    execute function public.notificar_curtida_post_comunidade();
  end if;
end
$$;

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
    drop trigger if exists
      trg_notificar_comentario_post_comunidade
      on public.comunidade_comentarios;

    create trigger trg_notificar_comentario_post_comunidade
    after insert
    on public.comunidade_comentarios
    for each row
    execute function public.notificar_comentario_post_comunidade();
  end if;
end
$$;

do $$
begin
  if to_regclass(
    'public.comunidade_comentario_curtidas'
  ) is not null
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
    drop trigger if exists
      trg_notificar_curtida_comentario_comunidade
      on public.comunidade_comentario_curtidas;

    create trigger trg_notificar_curtida_comentario_comunidade
    after insert
    on public.comunidade_comentario_curtidas
    for each row
    execute function
      public.notificar_curtida_comentario_comunidade();
  end if;
end
$$;

-- ============================================================
-- PERMISSÕES
-- ============================================================

revoke all
  on function public.obter_nome_usuario_notificacao(uuid)
  from public, anon, authenticated;

revoke all
  on function public.notificar_curtida_post_comunidade()
  from public, anon, authenticated;

revoke all
  on function public.notificar_comentario_post_comunidade()
  from public, anon, authenticated;

revoke all
  on function public.notificar_curtida_comentario_comunidade()
  from public, anon, authenticated;

commit;