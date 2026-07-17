-- 20260705_notificacoes_comunidade_triggers.sql
-- Cria notificações automaticamente quando há interação na Comunidade.
-- Não depende do frontend chamar RPC.
-- As funções internas não possuem EXECUTE público e falhas de notificação
-- nunca cancelam a curtida ou o comentário que originou o evento.

begin;

-- ============================================================
-- HELPER: NOME PÚBLICO DO USUÁRIO
-- ============================================================

create or replace function public.historietas_nome_publico_usuario(
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
  v_colunas_nome text[];
  v_predicados_usuario text[];
  v_sql text;
begin
  if p_user_id is null
    or to_regclass('public.profiles') is null
  then
    return 'Usuário';
  end if;

  select array_agg(
    format(
      'nullif(btrim(%I::text), '''')',
      coluna.column_name
    )
    order by array_position(
      array[
        'nome',
        'nome_usuario',
        'username',
        'apelido',
        'display_name',
        'nome_exibicao'
      ]::text[],
      coluna.column_name
    )
  )
  into v_colunas_nome
  from information_schema.columns coluna
  where coluna.table_schema = 'public'
    and coluna.table_name = 'profiles'
    and coluna.column_name = any(
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
    v_predicados_usuario := array_append(
      v_predicados_usuario,
      'id::text = $1::text'
    );
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

  if array_length(v_colunas_nome, 1) is null
    or array_length(v_predicados_usuario, 1) is null
  then
    return 'Usuário';
  end if;

  v_sql := format(
    'select coalesce(%s, ''Usuário'')
       from public.profiles
      where (%s)
      limit 1',
    array_to_string(v_colunas_nome, ', '),
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
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user_id uuid := p_user_id;
  v_ator_id uuid := p_ator_id;
  v_tipo text :=
    left(
      lower(nullif(btrim(coalesce(p_tipo, '')), '')),
      80
    );
  v_titulo text :=
    left(
      regexp_replace(
        coalesce(
          nullif(btrim(p_titulo), ''),
          'Nova interação na Comunidade'
        ),
        E'[\n\r\t]+',
        ' ',
        'g'
      ),
      160
    );
  v_mensagem text :=
    left(
      regexp_replace(
        coalesce(
          nullif(btrim(p_mensagem), ''),
          'Você recebeu uma nova interação na Comunidade.'
        ),
        E'[\n\r\t]+',
        ' ',
        'g'
      ),
      600
    );
  v_link text :=
    nullif(btrim(coalesce(p_link, '')), '');
  v_notificacao_chave text :=
    left(
      nullif(btrim(coalesce(p_notificacao_id, '')), ''),
      300
    );
  v_notificacao_valor text;
  v_agora timestamptz := now();
  v_metadata jsonb;

  v_tem_user_id boolean := false;
  v_tem_titulo boolean := false;
  v_tem_mensagem boolean := false;
  v_tem_tipo boolean := false;
  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_link boolean := false;
  v_tem_href boolean := false;
  v_tem_lida boolean := false;
  v_tem_notificacao_id boolean := false;
  v_tem_autor_id boolean := false;
  v_tem_metadata boolean := false;
  v_tem_criada_em boolean := false;
  v_tem_criado_em boolean := false;
  v_tem_created_at boolean := false;
  v_tem_atualizado_em boolean := false;
  v_tem_updated_at boolean := false;

  v_tipo_notificacao_id text := '';
  v_tipo_metadata text := '';

  v_colunas text[] := array[]::text[];
  v_valores text[] := array[]::text[];
  v_sql text;
  v_sql_existe text;
  v_ja_existe boolean := false;
begin
  if v_user_id is null
    or v_ator_id is null
    or v_user_id = v_ator_id
    or v_tipo is null
    or v_notificacao_chave is null
    or to_regclass('public.notificacoes') is null
  then
    return;
  end if;

  -- Links de notificação devem permanecer internos ao site.
  if v_link is null
    or left(v_link, 1) <> '/'
    or left(v_link, 2) = '//'
    or v_link like E'%\\%'
    or v_link ~ E'[\n\r\t]'
  then
    v_link := '/comunidade';
  end if;

  select
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'user_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'titulo'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'mensagem'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'tipo'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'obra_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'capitulo_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'link'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'href'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'lida'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'notificacao_id'
    ),
    coalesce((
      select coluna.udt_name
      from information_schema.columns coluna
      where coluna.table_schema = 'public'
        and coluna.table_name = 'notificacoes'
        and coluna.column_name = 'notificacao_id'
      limit 1
    ), ''),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'autor_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'metadata'
    ),
    coalesce((
      select coluna.udt_name
      from information_schema.columns coluna
      where coluna.table_schema = 'public'
        and coluna.table_name = 'notificacoes'
        and coluna.column_name = 'metadata'
      limit 1
    ), ''),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criada_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criado_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'created_at'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'atualizado_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'updated_at'
    )
  into
    v_tem_user_id,
    v_tem_titulo,
    v_tem_mensagem,
    v_tem_tipo,
    v_tem_obra_id,
    v_tem_capitulo_id,
    v_tem_link,
    v_tem_href,
    v_tem_lida,
    v_tem_notificacao_id,
    v_tipo_notificacao_id,
    v_tem_autor_id,
    v_tem_metadata,
    v_tipo_metadata,
    v_tem_criada_em,
    v_tem_criado_em,
    v_tem_created_at,
    v_tem_atualizado_em,
    v_tem_updated_at;

  if not (
    v_tem_user_id
    and v_tem_titulo
    and v_tem_mensagem
    and v_tem_tipo
  ) then
    return;
  end if;

  if v_tem_notificacao_id
    and v_tipo_notificacao_id not in (
      'uuid',
      'text',
      'varchar',
      'bpchar'
    )
  then
    v_tem_notificacao_id := false;
  end if;

  if v_tem_metadata
    and v_tipo_metadata not in (
      'json',
      'jsonb',
      'text',
      'varchar',
      'bpchar'
    )
  then
    v_tem_metadata := false;
  end if;

  if v_tem_notificacao_id
    and v_tipo_notificacao_id = 'uuid'
  then
    v_notificacao_valor :=
      substr(md5(v_notificacao_chave), 1, 8) || '-' ||
      substr(md5(v_notificacao_chave), 9, 4) || '-' ||
      substr(md5(v_notificacao_chave), 13, 4) || '-' ||
      substr(md5(v_notificacao_chave), 17, 4) || '-' ||
      substr(md5(v_notificacao_chave), 21, 12);
  else
    v_notificacao_valor := v_notificacao_chave;
  end if;

  v_metadata := jsonb_build_object(
    'origem', 'notificacoes_comunidade_triggers',
    'ator_id', v_ator_id,
    'notificacao_id', v_notificacao_chave,
    'tipo', v_tipo
  );

  -- Serializa chamadas do mesmo evento e destinatário.
  perform pg_advisory_xact_lock(
    hashtextextended(
      v_user_id::text || ':' || v_notificacao_chave,
      0
    )
  );

  if v_tem_notificacao_id then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and notificacao_id::text = $2
         limit 1
       )'
    into v_ja_existe
    using v_user_id, v_notificacao_valor;
  elsif v_tem_metadata
    and v_tipo_metadata in ('json', 'jsonb')
  then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and metadata::jsonb ->> ''notificacao_id'' = $2
         limit 1
       )'
    into v_ja_existe
    using v_user_id, v_notificacao_chave;
  else
    v_sql_existe :=
      'select exists (' ||
      'select 1 from public.notificacoes ' ||
      'where user_id::text = $1::text ' ||
      'and tipo::text = $2';

    if v_tem_autor_id then
      v_sql_existe :=
        v_sql_existe ||
        ' and autor_id::text = $3::text';
    end if;

    if v_tem_link then
      v_sql_existe :=
        v_sql_existe ||
        ' and link::text = $4';
    elsif v_tem_href then
      v_sql_existe :=
        v_sql_existe ||
        ' and href::text = $4';
    end if;

    v_sql_existe := v_sql_existe || ' limit 1)';

    execute v_sql_existe
    into v_ja_existe
    using v_user_id, v_tipo, v_ator_id, v_link;
  end if;

  if v_ja_existe then
    return;
  end if;

  v_colunas := array[
    'user_id',
    'titulo',
    'mensagem',
    'tipo'
  ];

  v_valores := array[
    '$1',
    '$2',
    '$3',
    '$4'
  ];

  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, 'null');
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, 'null');
  end if;

  if v_tem_link then
    v_colunas := array_append(v_colunas, 'link');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_href then
    v_colunas := array_append(v_colunas, 'href');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_lida then
    v_colunas := array_append(v_colunas, 'lida');
    v_valores := array_append(v_valores, 'false');
  end if;

  if v_tem_notificacao_id then
    v_colunas := array_append(v_colunas, 'notificacao_id');

    if v_tipo_notificacao_id = 'uuid' then
      v_valores := array_append(v_valores, '$6::uuid');
    else
      v_valores := array_append(v_valores, '$6');
    end if;
  end if;

  if v_tem_autor_id then
    v_colunas := array_append(v_colunas, 'autor_id');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_metadata then
    v_colunas := array_append(v_colunas, 'metadata');

    if v_tipo_metadata = 'json' then
      v_valores := array_append(
        v_valores,
        '$9::jsonb::json'
      );
    elsif v_tipo_metadata = 'jsonb' then
      v_valores := array_append(
        v_valores,
        '$9::jsonb'
      );
    else
      v_valores := array_append(
        v_valores,
        '$9::text'
      );
    end if;
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  if v_tem_created_at then
    v_colunas := array_append(v_colunas, 'created_at');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  if v_tem_updated_at then
    v_colunas := array_append(v_colunas, 'updated_at');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  v_sql := format(
    'insert into public.notificacoes (%s) values (%s)',
    array_to_string(
      array(
        select format('%I', coluna)
        from unnest(v_colunas) as coluna
      ),
      ', '
    ),
    array_to_string(v_valores, ', ')
  );

  execute v_sql
  using
    v_user_id,
    v_titulo,
    v_mensagem,
    v_tipo,
    v_link,
    v_notificacao_valor,
    v_ator_id,
    v_agora,
    v_metadata;
exception
  when unique_violation then
    return;
  when others then
    raise warning
      'Falha ao criar notificação da Comunidade: %',
      sqlerrm;

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
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_post record;
  v_nome text;
begin
  if new.post_id is null or new.usuario_id is null then
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
    public.historietas_nome_publico_usuario(new.usuario_id);

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
      public.historietas_nome_publico_usuario(new.autor_id);
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
    public.historietas_nome_publico_usuario(new.usuario_id);

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
  on function public.historietas_nome_publico_usuario(uuid)
  from public, anon, authenticated;

revoke all
  on function public.criar_notificacao_comunidade_interna(
    uuid,
    uuid,
    text,
    text,
    text,
    text,
    text
  )
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