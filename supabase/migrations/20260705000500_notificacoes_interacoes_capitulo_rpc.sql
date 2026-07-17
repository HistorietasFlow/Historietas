-- 20260705_notificacoes_interacoes_capitulo_rpc.sql
-- Notificações reais de interações em capítulos.
-- Corrigido:
-- - valida a ação diretamente nas tabelas de interação;
-- - ignora título, mensagem e link enviados pelo cliente;
-- - deriva receptor, conteúdo e identificador no servidor;
-- - impede notificação para o próprio autor;
-- - evita duplicidade concorrente com advisory lock;
-- - mantém compatibilidade com estruturas antigas de notificacoes;
-- - evita consultar metadata quando a coluna não existe;
-- - deduplica por ator e comentário quando notificacao_id não está disponível.

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
set search_path = public, pg_temp
as $$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid;
  v_obra_id uuid;
  v_obra_slug text := '';
  v_capitulo_titulo text := '';
  v_capitulo_ordem integer;
  v_tipo text := nullif(trim(coalesce(p_tipo, '')), '');
  v_titulo text;
  v_mensagem text;
  v_link text;
  v_nome_ator text := 'Usuário';

  v_notificacao_chave text;
  v_notificacao_valor text;
  v_notificacao_id_tipo text := '';

  v_tem_notificacao_id boolean := false;
  v_tem_autor_id boolean := false;
  v_tem_link boolean := false;
  v_tem_href boolean := false;
  v_tem_metadata boolean := false;
  v_metadata_tipo text := '';
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
  -- Mantém a assinatura antiga por compatibilidade, mas estes valores
  -- não são confiáveis e não são utilizados.
  perform p_titulo, p_mensagem, p_link;

  if v_ator_id is null
    or p_capitulo_id is null
    or v_tipo is null
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
    c.obra_id,
    coalesce(o.user_id, c.user_id),
    coalesce(o.slug, ''),
    coalesce(c.titulo, ''),
    c.ordem
  into
    v_obra_id,
    v_receptor_id,
    v_obra_slug,
    v_capitulo_titulo,
    v_capitulo_ordem
  from public.capitulos c
  join public.obras o on o.id = c.obra_id
  where c.id = p_capitulo_id
    and coalesce(c.publicado, false) = true
    and coalesce(o.publicado, false) = true
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
      from public.curtidas_capitulos cc
      where cc.capitulo_id = p_capitulo_id
        and cc.user_id = v_ator_id
    ) then
      return 0;
    end if;
  elsif v_tipo = 'comentario-capitulo' then
    if p_comentario_id is null
      or to_regclass('public.comentarios_capitulos') is null
    then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comentarios_capitulos cc
      where cc.id = p_comentario_id
        and cc.capitulo_id = p_capitulo_id
        and cc.user_id = v_ator_id
    ) then
      return 0;
    end if;
  elsif v_tipo = 'curtida-comentario-capitulo' then
    if p_comentario_id is null
      or to_regclass('public.comentarios_capitulos') is null
      or to_regclass('public.comentarios_capitulos_curtidas') is null
    then
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

    if not exists (
      select 1
      from public.comentarios_capitulos_curtidas ccc
      where ccc.comentario_id = p_comentario_id
        and ccc.usuario_id = v_ator_id
    ) then
      return 0;
    end if;
  end if;

  if v_receptor_id = v_ator_id then
    return 0;
  end if;

  -- Usa o helper do projeto quando ele existir, sem depender da estrutura
  -- variável da tabela profiles.
  if to_regprocedure('public.obter_nome_usuario_notificacao(uuid)') is not null then
    begin
      execute
        'select nullif(trim(public.obter_nome_usuario_notificacao($1)), '''')'
      into v_nome_ator
      using v_ator_id;
    exception
      when others then
        v_nome_ator := 'Usuário';
    end;
  end if;

  v_nome_ator := coalesce(nullif(trim(v_nome_ator), ''), 'Usuário');

  v_link :=
    case
      when nullif(trim(v_obra_slug), '') is not null
        and v_capitulo_ordem is not null
        and v_capitulo_ordem > 0
      then
        '/obra/' || v_obra_slug || '/capitulo/' || v_capitulo_ordem::text
      when nullif(trim(v_obra_slug), '') is not null
      then
        '/obra/' || v_obra_slug
      else
        '/notificacoes'
    end;

  if v_tipo = 'curtida-capitulo' then
    v_titulo := 'Curtiram seu capítulo';
    v_mensagem :=
      v_nome_ator || ' curtiu' ||
      case
        when nullif(trim(v_capitulo_titulo), '') is not null
        then ' "' || left(trim(v_capitulo_titulo), 120) || '".'
        else ' um capítulo seu.'
      end;
    v_notificacao_chave :=
      'curtida-capitulo:' ||
      p_capitulo_id::text || ':' ||
      v_ator_id::text;
  elsif v_tipo = 'comentario-capitulo' then
    v_titulo := 'Novo comentário no capítulo';
    v_mensagem :=
      v_nome_ator || ' comentou' ||
      case
        when nullif(trim(v_capitulo_titulo), '') is not null
        then ' em "' || left(trim(v_capitulo_titulo), 120) || '".'
        else ' em um capítulo seu.'
      end;
    v_notificacao_chave :=
      'comentario-capitulo:' || p_comentario_id::text;
  else
    v_titulo := 'Curtiram seu comentário';
    v_mensagem :=
      v_nome_ator || ' curtiu seu comentário em um capítulo.';
    v_notificacao_chave :=
      'curtida-comentario-capitulo:' ||
      p_comentario_id::text || ':' ||
      v_ator_id::text;
  end if;

  -- Serializa por evento para impedir duas inserções concorrentes.
  perform pg_advisory_xact_lock(hashtextextended(v_notificacao_chave, 0));

  select
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'notificacao_id'
    ),
    coalesce((
      select c.udt_name
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'notificacoes'
        and c.column_name = 'notificacao_id'
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
      select c.udt_name
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'notificacoes'
        and c.column_name = 'metadata'
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
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and tipo = $2
           and capitulo_id::text = $3::text
           and metadata ->> ''ator_id'' = $4::text
           and (
             $5::uuid is null
             or metadata ->> ''comentario_id'' = $5::text
           )
       )'
    into v_ja_existe
    using
      v_receptor_id,
      v_tipo,
      p_capitulo_id,
      v_ator_id,
      p_comentario_id;
  elsif v_tem_autor_id and v_tipo = 'curtida-capitulo' then
    -- Em estruturas legadas sem notificacao_id/metadata, autor_id ainda
    -- permite deduplicar curtidas no capítulo por ator.
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and tipo = $2
           and capitulo_id::text = $3::text
           and autor_id::text = $4::text
       )'
    into v_ja_existe
    using v_receptor_id, v_tipo, p_capitulo_id, v_ator_id;
  else
    -- Sem uma coluna capaz de persistir a chave completa do evento, não há
    -- deduplicação segura. O advisory lock ainda bloqueia inserções simultâneas.
    v_ja_existe := false;
  end if;

  if v_ja_existe then
    return 0;
  end if;

  v_colunas :=
    array[
      'user_id',
      'obra_id',
      'capitulo_id',
      'titulo',
      'mensagem',
      'tipo',
      'lida'
    ];

  v_valores :=
    array[
      '$1',
      '$2',
      '$3',
      '$4',
      '$5',
      '$6',
      'false'
    ];

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
          ''notificacao_id'', $8
        )::json'
      );
    else
      v_valores := array_append(
        v_valores,
        'jsonb_build_object(
          ''origem'', ''criar_notificacao_interacao_capitulo'',
          ''ator_id'', $9::text,
          ''comentario_id'', $10::text,
          ''notificacao_id'', $8
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
    p_comentario_id;

  return 1;
exception
  when unique_violation then
    return 0;
  when others then
    return 0;
end;
$$;

revoke all on function public.criar_notificacao_interacao_capitulo(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) from public;

revoke all on function public.criar_notificacao_interacao_capitulo(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) from anon;

grant execute on function public.criar_notificacao_interacao_capitulo(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) to authenticated;

commit;