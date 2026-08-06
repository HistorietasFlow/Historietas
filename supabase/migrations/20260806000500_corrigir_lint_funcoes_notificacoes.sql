-- Corrige falsos positivos do db lint nas funções de notificações.
-- Mantém a compatibilidade com schemas antigos sem referenciar, em SQL estático,
-- colunas opcionais ausentes no schema atual.

begin;

CREATE OR REPLACE FUNCTION "public"."criar_notificacao_comunidade_interna"("p_user_id" "uuid", "p_ator_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text", "p_notificacao_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
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
    v_sql_existe :=
      'select exists (' ||
      'select 1 from public.notificacoes ' ||
      'where user_id::text = $1::text ' ||
      'and ' || quote_ident('metadata') ||
      '::jsonb ->> ''notificacao_id'' = $2 ' ||
      'limit 1)';

    execute v_sql_existe
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
$_$;

CREATE OR REPLACE FUNCTION "public"."criar_notificacao_interacao_capitulo"("p_capitulo_id" "uuid", "p_comentario_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid;
  v_obra_id uuid;
  v_obra_slug text := '';
  v_capitulo_titulo text := '';
  v_capitulo_ordem integer;
  v_comentario_pai_id uuid;
  v_eh_resposta boolean := false;

  v_tipo text := nullif(btrim(coalesce(p_tipo, '')), '');
  v_titulo text;
  v_mensagem text;
  v_link text;
  v_nome_ator text := 'Usuário';

  v_notificacao_chave text;
  v_notificacao_valor text;
  v_notificacao_id_tipo text := '';
  v_metadata_tipo text := '';

  v_tem_user_id boolean := false;
  v_tem_titulo boolean := false;
  v_tem_mensagem boolean := false;
  v_tem_tipo boolean := false;
  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_lida boolean := false;
  v_tem_notificacao_id boolean := false;
  v_tem_autor_id boolean := false;
  v_tem_link boolean := false;
  v_tem_href boolean := false;
  v_tem_metadata boolean := false;
  v_tem_criada_em boolean := false;
  v_tem_criado_em boolean := false;
  v_tem_created_at boolean := false;
  v_tem_atualizado_em boolean := false;
  v_tem_updated_at boolean := false;

  v_colunas text[] := array[]::text[];
  v_valores text[] := array[]::text[];
  v_sql text;
  v_ja_existe boolean := false;
begin
  -- Mantém a assinatura usada pelo frontend, mas não confia no conteúdo
  -- enviado pelo cliente.
  perform p_titulo, p_mensagem, p_link;

  if v_ator_id is null
    or p_capitulo_id is null
    or v_tipo is null
    or to_regclass('public.capitulos') is null
    or to_regclass('public.obras') is null
    or to_regclass('public.notificacoes') is null
  then
    return 0;
  end if;

  if v_tipo not in (
    'curtida-capitulo',
    'comentario-capitulo',
    'curtida-comentario-capitulo'
  ) then
    return 0;
  end if;

  select
    capitulo.obra_id,
    coalesce(obra.user_id, capitulo.user_id),
    coalesce(obra.slug, ''),
    coalesce(capitulo.titulo, ''),
    capitulo.ordem
  into
    v_obra_id,
    v_receptor_id,
    v_obra_slug,
    v_capitulo_titulo,
    v_capitulo_ordem
  from public.capitulos capitulo
  join public.obras obra
    on obra.id = capitulo.obra_id
  where capitulo.id = p_capitulo_id
    and coalesce(capitulo.publicado, false) = true
    and coalesce(obra.publicado, false) = true
  limit 1;

  if v_obra_id is null or v_receptor_id is null then
    return 0;
  end if;

  if v_tipo = 'curtida-capitulo' then
    if to_regclass('public.curtidas_capitulos') is null then
      return 0;
    end if;

    if not exists (
      select 1
      from public.curtidas_capitulos curtida
      where curtida.capitulo_id = p_capitulo_id
        and curtida.user_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;
  elsif v_tipo = 'comentario-capitulo' then
    if p_comentario_id is null
      or to_regclass('public.comentarios_capitulos') is null
    then
      return 0;
    end if;

    select comentario.comentario_pai_id
    into v_comentario_pai_id
    from public.comentarios_capitulos comentario
    where comentario.id = p_comentario_id
      and comentario.capitulo_id = p_capitulo_id
      and comentario.user_id = v_ator_id
    limit 1;

    if not found then
      return 0;
    end if;

    if v_comentario_pai_id is not null then
      select comentario_pai.user_id
      into v_receptor_id
      from public.comentarios_capitulos comentario_pai
      where comentario_pai.id = v_comentario_pai_id
        and comentario_pai.capitulo_id = p_capitulo_id
      limit 1;

      if v_receptor_id is null then
        return 0;
      end if;

      v_eh_resposta := true;
    end if;
  else
    if p_comentario_id is null
      or to_regclass('public.comentarios_capitulos') is null
      or to_regclass('public.comentarios_capitulos_curtidas') is null
    then
      return 0;
    end if;

    select comentario.user_id
    into v_receptor_id
    from public.comentarios_capitulos comentario
    where comentario.id = p_comentario_id
      and comentario.capitulo_id = p_capitulo_id
    limit 1;

    if v_receptor_id is null then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comentarios_capitulos_curtidas curtida
      where curtida.comentario_id = p_comentario_id
        and curtida.usuario_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;
  end if;

  if v_receptor_id = v_ator_id then
    return 0;
  end if;

  if to_regprocedure(
    'public.obter_nome_usuario_notificacao(uuid)'
  ) is not null then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome_ator
      using v_ator_id;
    exception
      when others then
        v_nome_ator := 'Usuário';
    end;
  end if;

  v_nome_ator := left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome_ator), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );

  v_link :=
    case
      when nullif(btrim(v_obra_slug), '') is not null
        and v_capitulo_ordem is not null
        and v_capitulo_ordem > 0
      then
        '/obra/' ||
        v_obra_slug ||
        '/capitulo/' ||
        v_capitulo_ordem::text
      when nullif(btrim(v_obra_slug), '') is not null
      then
        '/obra/' || v_obra_slug
      else
        '/notificacoes'
    end;

  if v_tipo = 'curtida-capitulo' then
    v_titulo := 'Curtiram seu capítulo';
    v_mensagem :=
      v_nome_ator ||
      ' curtiu' ||
      case
        when nullif(btrim(v_capitulo_titulo), '') is not null
        then
          ' "' ||
          left(btrim(v_capitulo_titulo), 120) ||
          '".'
        else
          ' um capítulo seu.'
      end;

    v_notificacao_chave :=
      'curtida-capitulo:' ||
      p_capitulo_id::text ||
      ':' ||
      v_ator_id::text;
  elsif v_tipo = 'comentario-capitulo' and v_eh_resposta then
    v_titulo := 'Nova resposta ao seu comentário';
    v_mensagem :=
      v_nome_ator ||
      ' respondeu ao seu comentário' ||
      case
        when nullif(btrim(v_capitulo_titulo), '') is not null
        then
          ' em "' ||
          left(btrim(v_capitulo_titulo), 120) ||
          '".'
        else
          ' em um capítulo.'
      end;

    v_notificacao_chave :=
      'resposta-comentario-capitulo:' ||
      p_comentario_id::text;
  elsif v_tipo = 'comentario-capitulo' then
    v_titulo := 'Novo comentário no capítulo';
    v_mensagem :=
      v_nome_ator ||
      ' comentou' ||
      case
        when nullif(btrim(v_capitulo_titulo), '') is not null
        then
          ' em "' ||
          left(btrim(v_capitulo_titulo), 120) ||
          '".'
        else
          ' em um capítulo seu.'
      end;

    v_notificacao_chave :=
      'comentario-capitulo:' ||
      p_comentario_id::text;
  else
    v_titulo := 'Curtiram seu comentário';
    v_mensagem :=
      v_nome_ator ||
      ' curtiu seu comentário em um capítulo.';

    v_notificacao_chave :=
      'curtida-comentario-capitulo:' ||
      p_comentario_id::text ||
      ':' ||
      v_ator_id::text;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_receptor_id::text || ':' || v_notificacao_chave,
      0
    )
  );

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
    v_tem_lida,
    v_tem_notificacao_id,
    v_notificacao_id_tipo,
    v_tem_autor_id,
    v_tem_link,
    v_tem_href,
    v_tem_metadata,
    v_metadata_tipo,
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
    return 0;
  end if;

  if v_tem_notificacao_id and v_notificacao_id_tipo = 'uuid' then
    v_notificacao_valor :=
      substr(md5(v_notificacao_chave), 1, 8) || '-' ||
      substr(md5(v_notificacao_chave), 9, 4) || '-' ||
      substr(md5(v_notificacao_chave), 13, 4) || '-' ||
      substr(md5(v_notificacao_chave), 17, 4) || '-' ||
      substr(md5(v_notificacao_chave), 21, 12);
  else
    v_notificacao_valor := v_notificacao_chave;
  end if;

  if v_tem_notificacao_id then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and notificacao_id::text = $2
       )'
    into v_ja_existe
    using v_receptor_id, v_notificacao_valor;
  elsif v_tem_metadata and v_metadata_tipo in ('json', 'jsonb') then
    v_sql :=
      'select exists (' ||
      'select 1 from public.notificacoes ' ||
      'where user_id::text = $1::text ' ||
      'and ' || quote_ident('metadata') ||
      '::jsonb ->> ''notificacao_id'' = $2)';

    execute v_sql
    into v_ja_existe
    using v_receptor_id, v_notificacao_chave;
  elsif v_tem_autor_id and v_tem_capitulo_id
    and v_tipo = 'curtida-capitulo'
  then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and tipo::text = $2
           and capitulo_id::text = $3::text
           and autor_id::text = $4::text
       )'
    into v_ja_existe
    using
      v_receptor_id,
      v_tipo,
      p_capitulo_id,
      v_ator_id;
  end if;

  if v_ja_existe then
    return 0;
  end if;

  v_colunas := array[
    'user_id',
    'titulo',
    'mensagem',
    'tipo'
  ];

  v_valores := array[
    '$1',
    '$4',
    '$5',
    '$6'
  ];

  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, '$2');
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, '$3');
  end if;

  if v_tem_lida then
    v_colunas := array_append(v_colunas, 'lida');
    v_valores := array_append(v_valores, 'false');
  end if;

  if v_tem_link then
    v_colunas := array_append(v_colunas, 'link');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_href then
    v_colunas := array_append(v_colunas, 'href');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_notificacao_id then
    v_colunas := array_append(v_colunas, 'notificacao_id');

    if v_notificacao_id_tipo = 'uuid' then
      v_valores := array_append(v_valores, '$8::uuid');
    else
      v_valores := array_append(v_valores, '$8');
    end if;
  end if;

  if v_tem_autor_id then
    v_colunas := array_append(v_colunas, 'autor_id');
    v_valores := array_append(v_valores, '$9');
  end if;

  if v_tem_metadata and v_metadata_tipo in ('json', 'jsonb') then
    v_colunas := array_append(v_colunas, 'metadata');

    if v_metadata_tipo = 'json' then
      v_valores := array_append(
        v_valores,
        'jsonb_build_object(
          ''origem'', ''criar_notificacao_interacao_capitulo'',
          ''ator_id'', $9::text,
          ''comentario_id'', $10::text,
          ''comentario_pai_id'', $11::text,
          ''resposta'', $12,
          ''notificacao_id'', $13
        )::json'
      );
    else
      v_valores := array_append(
        v_valores,
        'jsonb_build_object(
          ''origem'', ''criar_notificacao_interacao_capitulo'',
          ''ator_id'', $9::text,
          ''comentario_id'', $10::text,
          ''comentario_pai_id'', $11::text,
          ''resposta'', $12,
          ''notificacao_id'', $13
        )'
      );
    end if;
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_created_at then
    v_colunas := array_append(v_colunas, 'created_at');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_updated_at then
    v_colunas := array_append(v_colunas, 'updated_at');
    v_valores := array_append(v_valores, 'now()');
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
    v_receptor_id,
    v_obra_id,
    p_capitulo_id,
    v_titulo,
    v_mensagem,
    v_tipo,
    v_link,
    v_notificacao_valor,
    v_ator_id,
    p_comentario_id,
    v_comentario_pai_id,
    v_eh_resposta,
    v_notificacao_chave;

  return 1;
exception
  when unique_violation then
    return 0;
  when others then
    return 0;
end;
$_$;

CREATE OR REPLACE FUNCTION "public"."criar_notificacao_social"("p_user_id" "uuid", "p_tipo" "text", "p_titulo" "text" DEFAULT NULL::"text", "p_mensagem" "text" DEFAULT NULL::"text", "p_link" "text" DEFAULT NULL::"text", "p_notificacao_id" "text" DEFAULT NULL::"text", "p_obra_id" "uuid" DEFAULT NULL::"uuid", "p_capitulo_id" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid := p_user_id;
  v_tipo text := nullif(trim(coalesce(p_tipo, '')), '');

  -- Entrada usada apenas para identificar a interação real da Comunidade.
  -- Nunca é persistida como notificacao_id.
  v_notificacao_id_entrada text :=
    nullif(trim(coalesce(p_notificacao_id, '')), '');

  -- Conteúdo final sempre criado no servidor.
  v_titulo text := null;
  v_mensagem text := null;
  v_link text := null;
  v_notificacao_id text := null;
  v_nome_ator text := 'Usuário';

  v_post_id uuid := null;
  v_comentario_id uuid := null;
  v_partes text[];

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

  v_tipo_notificacao_id text := null;
  v_tipo_metadata text := null;
  v_metadata jsonb;

  v_colunas text[] := array['user_id', 'titulo', 'mensagem', 'tipo'];
  v_valores text[] := array['$1', '$2', '$3', '$4'];
  v_sql text;
  v_sql_existe text;
  v_ja_existe boolean := false;
begin
  -- Mantém a assinatura antiga para não quebrar o frontend, mas estes
  -- parâmetros não são confiáveis e não participam do conteúdo salvo.
  perform p_titulo;
  perform p_mensagem;
  perform p_link;
  perform p_obra_id;
  perform p_capitulo_id;

  if v_ator_id is null
    or v_receptor_id is null
    or v_tipo is null
    or v_receptor_id = v_ator_id
    or to_regclass('public.notificacoes') is null
  then
    return 0;
  end if;

  if v_tipo not in (
    'seguir-usuario',
    'comunidade-curtida-post',
    'comunidade-comentario-post',
    'comunidade-curtida-comentario'
  ) then
    return 0;
  end if;

  -- Colunas obrigatórias da tabela notificacoes.
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name in ('user_id', 'titulo', 'mensagem', 'tipo')
    group by table_schema, table_name
    having count(*) = 4
  ) then
    return 0;
  end if;

  -- Nome público do ator. A função auxiliar é chamada dinamicamente para
  -- esta migration continuar segura mesmo em bancos antigos.
  if to_regprocedure(
    'public.obter_nome_usuario_notificacao(uuid)'
  ) is not null then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome_ator
      using v_ator_id;
    exception
      when others then
        v_nome_ator := 'Usuário';
    end;
  end if;

  v_nome_ator := left(
    regexp_replace(
      coalesce(nullif(trim(v_nome_ator), ''), 'Usuário'),
      E'[\\n\\r\\t]+',
      ' ',
      'g'
    ),
    80
  );

  -- ==========================================================
  -- SEGUIR USUÁRIO
  -- ==========================================================
  if v_tipo = 'seguir-usuario' then
    if to_regclass('public.seguindo_usuarios') is null then
      return 0;
    end if;

    if not exists (
      select 1
      from public.seguindo_usuarios su
      where su.seguidor_id = v_ator_id
        and su.seguido_id = v_receptor_id
      limit 1
    ) then
      return 0;
    end if;

    v_notificacao_id :=
      'seguir-usuario:' ||
      v_ator_id::text ||
      ':' ||
      v_receptor_id::text;

    v_titulo := 'Novo seguidor';
    v_mensagem := v_nome_ator || ' começou a seguir você.';
    v_link :=
      '/perfil-autor?autorId=' ||
      v_ator_id::text ||
      '&userId=' ||
      v_ator_id::text;
  end if;

  -- ==========================================================
  -- CURTIDA EM POST DA COMUNIDADE
  -- Entrada antiga esperada:
  -- comunidade-curtida-post:{postId}:{atorId}
  -- ==========================================================
  if v_tipo = 'comunidade-curtida-post' then
    if to_regclass('public.comunidade_posts') is null
      or to_regclass('public.comunidade_curtidas') is null
      or v_notificacao_id_entrada is null
    then
      return 0;
    end if;

    v_partes := regexp_match(
      v_notificacao_id_entrada,
      '^comunidade-curtida-post:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$'
    );

    if v_partes is null
      or array_length(v_partes, 1) <> 2
      or v_partes[2]::uuid <> v_ator_id
    then
      return 0;
    end if;

    v_post_id := v_partes[1]::uuid;

    select cp.autor_id
    into v_receptor_id
    from public.comunidade_posts cp
    where cp.id = v_post_id
    limit 1;

    if v_receptor_id is null
      or v_receptor_id <> p_user_id
      or v_receptor_id = v_ator_id
    then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comunidade_curtidas cc
      where cc.post_id = v_post_id
        and cc.usuario_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;

    v_notificacao_id :=
      'comunidade-curtida-post:' ||
      v_post_id::text ||
      ':' ||
      v_ator_id::text;

    v_titulo := 'Nova curtida na Comunidade';
    v_mensagem := v_nome_ator || ' curtiu sua publicação.';
    v_link := '/comunidade?post=' || v_post_id::text;
  end if;

  -- ==========================================================
  -- COMENTÁRIO EM POST DA COMUNIDADE
  -- Entrada antiga esperada:
  -- comunidade-comentario-post:{postId}:{comentarioId}
  -- ==========================================================
  if v_tipo = 'comunidade-comentario-post' then
    if to_regclass('public.comunidade_posts') is null
      or to_regclass('public.comunidade_comentarios') is null
      or v_notificacao_id_entrada is null
    then
      return 0;
    end if;

    v_partes := regexp_match(
      v_notificacao_id_entrada,
      '^comunidade-comentario-post:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$'
    );

    if v_partes is null or array_length(v_partes, 1) <> 2 then
      return 0;
    end if;

    v_post_id := v_partes[1]::uuid;
    v_comentario_id := v_partes[2]::uuid;

    select cp.autor_id
    into v_receptor_id
    from public.comunidade_posts cp
    join public.comunidade_comentarios comentario
      on comentario.post_id = cp.id
    where cp.id = v_post_id
      and comentario.id = v_comentario_id
      and comentario.autor_id = v_ator_id
    limit 1;

    if v_receptor_id is null
      or v_receptor_id <> p_user_id
      or v_receptor_id = v_ator_id
    then
      return 0;
    end if;

    v_notificacao_id :=
      'comunidade-comentario-post:' ||
      v_post_id::text ||
      ':' ||
      v_comentario_id::text;

    v_titulo := 'Novo comentário na Comunidade';
    v_mensagem := v_nome_ator || ' comentou na sua publicação.';
    v_link := '/comunidade?post=' || v_post_id::text;
  end if;

  -- ==========================================================
  -- CURTIDA EM COMENTÁRIO DA COMUNIDADE
  -- Entrada antiga esperada:
  -- comunidade-curtida-comentario:{comentarioId}:{atorId}
  -- ==========================================================
  if v_tipo = 'comunidade-curtida-comentario' then
    if to_regclass('public.comunidade_comentarios') is null
      or to_regclass('public.comunidade_comentario_curtidas') is null
      or v_notificacao_id_entrada is null
    then
      return 0;
    end if;

    v_partes := regexp_match(
      v_notificacao_id_entrada,
      '^comunidade-curtida-comentario:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$'
    );

    if v_partes is null
      or array_length(v_partes, 1) <> 2
      or v_partes[2]::uuid <> v_ator_id
    then
      return 0;
    end if;

    v_comentario_id := v_partes[1]::uuid;

    select comentario.autor_id, comentario.post_id
    into v_receptor_id, v_post_id
    from public.comunidade_comentarios comentario
    where comentario.id = v_comentario_id
    limit 1;

    if v_receptor_id is null
      or v_receptor_id <> p_user_id
      or v_receptor_id = v_ator_id
      or v_post_id is null
    then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comunidade_comentario_curtidas curtida
      where curtida.comentario_id = v_comentario_id
        and curtida.usuario_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;

    v_notificacao_id :=
      'comunidade-curtida-comentario:' ||
      v_comentario_id::text ||
      ':' ||
      v_ator_id::text;

    v_titulo := 'Nova curtida no seu comentário';
    v_mensagem :=
      v_nome_ator ||
      ' curtiu seu comentário na Comunidade.';
    v_link := '/comunidade?post=' || v_post_id::text;
  end if;

  if v_receptor_id is null
    or v_receptor_id = v_ator_id
    or v_notificacao_id is null
    or v_titulo is null
    or v_mensagem is null
    or v_link is null
  then
    return 0;
  end if;

  -- Detecta as colunas opcionais existentes.
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'obra_id'
  ) into v_tem_obra_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'capitulo_id'
  ) into v_tem_capitulo_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'link'
  ) into v_tem_link;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'href'
  ) into v_tem_href;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'lida'
  ) into v_tem_lida;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
  ) into v_tem_notificacao_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'autor_id'
  ) into v_tem_autor_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'metadata'
  ) into v_tem_metadata;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'criada_em'
  ) into v_tem_criada_em;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'criado_em'
  ) into v_tem_criado_em;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'created_at'
  ) into v_tem_created_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'atualizado_em'
  ) into v_tem_atualizado_em;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'updated_at'
  ) into v_tem_updated_at;

  if v_tem_notificacao_id then
    select udt_name
    into v_tipo_notificacao_id
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
    limit 1;
  end if;

  if v_tem_metadata then
    select udt_name
    into v_tipo_metadata
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'metadata'
    limit 1;
  end if;

  if v_tem_metadata
    and v_tipo_metadata not in ('json', 'jsonb', 'text', 'varchar', 'bpchar')
  then
    v_tem_metadata := false;
  end if;

  v_metadata := jsonb_build_object(
    'origem', 'criar_notificacao_social',
    'ator_id', v_ator_id,
    'notificacao_id', v_notificacao_id,
    'tipo', v_tipo
  );

  -- Serializa chamadas do mesmo evento para impedir duplicidade em corrida.
  perform pg_advisory_xact_lock(
    hashtextextended(
      v_receptor_id::text || ':' || v_notificacao_id,
      0
    )
  );

  if v_tem_notificacao_id then
    if v_tipo_notificacao_id = 'uuid' then
      execute '
        select exists (
          select 1
          from public.notificacoes
          where user_id::text = $1::text
            and notificacao_id::text = (
              substr(md5($2), 1, 8) || ''-'' ||
              substr(md5($2), 9, 4) || ''-'' ||
              substr(md5($2), 13, 4) || ''-'' ||
              substr(md5($2), 17, 4) || ''-'' ||
              substr(md5($2), 21, 12)
            )::uuid::text
          limit 1
        )
      '
      into v_ja_existe
      using v_receptor_id, v_notificacao_id;
    else
      execute '
        select exists (
          select 1
          from public.notificacoes
          where user_id::text = $1::text
            and notificacao_id::text = $2
          limit 1
        )
      '
      into v_ja_existe
      using v_receptor_id, v_notificacao_id;
    end if;
  elsif v_tem_metadata then
    if v_tipo_metadata in ('json', 'jsonb') then
      v_sql_existe :=
        'select exists (' ||
        'select 1 from public.notificacoes ' ||
        'where user_id::text = $1::text ' ||
        'and ' || quote_ident('metadata') ||
        '::jsonb ->> ''notificacao_id'' = $2 ' ||
        'limit 1)';

      execute v_sql_existe
      into v_ja_existe
      using v_receptor_id, v_notificacao_id;
    else
      v_sql_existe :=
        'select exists (' ||
        'select 1 from public.notificacoes ' ||
        'where user_id::text = $1::text ' ||
        'and ' || quote_ident('metadata') ||
        '::text = $2 ' ||
        'limit 1)';

      execute v_sql_existe
      into v_ja_existe
      using v_receptor_id, v_metadata::text;
    end if;
  else
    v_sql_existe :=
      'select exists (' ||
      'select 1 from public.notificacoes ' ||
      'where user_id::text = $1::text and tipo = $2';

    if v_tem_autor_id then
      v_sql_existe := v_sql_existe || ' and autor_id::text = $3::text';
    end if;

    if v_tem_link then
      v_sql_existe := v_sql_existe || ' and link::text = $4';
    elsif v_tem_href then
      v_sql_existe := v_sql_existe || ' and href::text = $4';
    end if;

    v_sql_existe := v_sql_existe || ' limit 1)';

    execute v_sql_existe
    into v_ja_existe
    using v_receptor_id, v_tipo, v_ator_id, v_link;
  end if;

  if v_ja_existe then
    return 0;
  end if;

  -- Notificações sociais nunca recebem obra_id/capitulo_id do cliente.
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
      v_valores := array_append(
        v_valores,
        '(substr(md5($6), 1, 8) || ''-'' || ' ||
        'substr(md5($6), 9, 4) || ''-'' || ' ||
        'substr(md5($6), 13, 4) || ''-'' || ' ||
        'substr(md5($6), 17, 4) || ''-'' || ' ||
        'substr(md5($6), 21, 12))::uuid'
      );
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
      v_valores := array_append(v_valores, '$8::jsonb::json');
    elsif v_tipo_metadata = 'jsonb' then
      v_valores := array_append(v_valores, '$8::jsonb');
    else
      v_valores := array_append(v_valores, '$8::text');
    end if;
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_created_at then
    v_colunas := array_append(v_colunas, 'created_at');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_updated_at then
    v_colunas := array_append(v_colunas, 'updated_at');
    v_valores := array_append(v_valores, 'now()');
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
    v_receptor_id,
    v_titulo,
    v_mensagem,
    v_tipo,
    v_link,
    v_notificacao_id,
    v_ator_id,
    v_metadata;

  return 1;
exception
  when others then
    return 0;
end;
$_$;

commit;
