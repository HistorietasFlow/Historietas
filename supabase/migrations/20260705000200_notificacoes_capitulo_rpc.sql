-- 20260705_notificacoes_capitulo_rpc.sql
-- Cria notificações de novo capítulo pelo banco.
-- O cliente mantém a assinatura antiga, mas título, mensagem, link e data
-- são ignorados e recriados no servidor.
-- Cada destinatário recebe uma chave própria para evitar colisões.

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
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_autor_id uuid := auth.uid();
  v_obra record;
  v_capitulo record;
  v_total integer := 0;

  v_tipo_entrada text :=
    lower(nullif(btrim(coalesce(p_tipo, '')), ''));
  v_tipo text := 'novo-capitulo';
  v_titulo text := 'Novo capítulo publicado';
  v_mensagem text;
  v_href text;
  v_criado_em timestamptz;
  v_notificacao_base text;
  v_metadata jsonb;

  v_colunas text[] :=
    array['user_id', 'tipo', 'titulo', 'mensagem'];
  v_valores text[] :=
    array[
      'preparados.receptor_id',
      '$2',
      '$3',
      '$4'
    ];

  v_receptores_partes text[] := array[]::text[];
  v_receptores_sql text;
  v_where_duplicada text :=
    'n.user_id::text = preparados.receptor_id::text ' ||
    'and n.tipo::text = $2';
  v_notificacao_expressao text;
  v_sql text;

  v_tem_user_id boolean := false;
  v_tem_tipo boolean := false;
  v_tem_titulo boolean := false;
  v_tem_mensagem boolean := false;
  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_href boolean := false;
  v_tem_link boolean := false;
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
begin
  -- Mantém a assinatura usada pelo frontend, mas não confia nestes valores.
  perform p_titulo, p_mensagem, p_href, p_criado_em;

  if v_autor_id is null
    or p_obra_id is null
    or p_capitulo_id is null
    or v_tipo_entrada is distinct from 'novo-capitulo'
    or to_regclass('public.obras') is null
    or to_regclass('public.capitulos') is null
    or to_regclass('public.notificacoes') is null
  then
    return 0;
  end if;

  select
    obra.id,
    obra.user_id,
    obra.titulo,
    obra.autor,
    obra.slug,
    obra.publicado
  into v_obra
  from public.obras obra
  where obra.id = p_obra_id
  limit 1;

  if v_obra.id is null
    or v_obra.user_id is distinct from v_autor_id
    or coalesce(v_obra.publicado, false) = false
  then
    return 0;
  end if;

  select
    capitulo.id,
    capitulo.obra_id,
    capitulo.user_id,
    capitulo.titulo,
    capitulo.ordem,
    capitulo.publicado,
    capitulo.criado_em,
    capitulo.atualizado_em
  into v_capitulo
  from public.capitulos capitulo
  where capitulo.id = p_capitulo_id
    and capitulo.obra_id = p_obra_id
  limit 1;

  if v_capitulo.id is null
    or coalesce(v_capitulo.publicado, false) = false
    or (
      v_capitulo.user_id is not null
      and v_capitulo.user_id is distinct from v_autor_id
    )
  then
    return 0;
  end if;

  v_mensagem := left(
    coalesce(
      nullif(
        regexp_replace(
          btrim(coalesce(v_capitulo.titulo, '')),
          E'[\n\r\t]+',
          ' ',
          'g'
        ),
        ''
      ),
      'Um novo capítulo'
    ) ||
    ' foi adicionado em "' ||
    left(
      coalesce(
        nullif(
          regexp_replace(
            btrim(coalesce(v_obra.titulo, '')),
            E'[\n\r\t]+',
            ' ',
            'g'
          ),
          ''
        ),
        'uma obra'
      ),
      120
    ) ||
    '".',
    500
  );

  v_href :=
    case
      when nullif(btrim(coalesce(v_obra.slug, '')), '') is not null
        and v_capitulo.ordem is not null
        and v_capitulo.ordem > 0
      then
        '/obra/' ||
        btrim(v_obra.slug) ||
        '/capitulo/' ||
        v_capitulo.ordem::text
      when nullif(btrim(coalesce(v_obra.slug, '')), '') is not null
      then
        '/obra/' || btrim(v_obra.slug)
      else
        '/notificacoes'
    end;

  v_criado_em :=
    coalesce(v_capitulo.criado_em, now());

  v_notificacao_base :=
    'novo-capitulo:' || p_capitulo_id::text;

  v_metadata := jsonb_build_object(
    'origem', 'criar_notificacoes_capitulo',
    'obra_id', p_obra_id,
    'obra_titulo', coalesce(v_obra.titulo, ''),
    'autor_id', v_autor_id,
    'autor', coalesce(v_obra.autor, ''),
    'capitulo_id', p_capitulo_id,
    'capitulo_titulo', coalesce(v_capitulo.titulo, ''),
    'numero_capitulo', v_capitulo.ordem,
    'notificacao_base', v_notificacao_base
  );

  -- Serializa chamadas do mesmo capítulo para evitar duplicidade concorrente.
  perform pg_advisory_xact_lock(
    hashtextextended(v_notificacao_base, 0)
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
        and column_name = 'tipo'
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
        and column_name = 'href'
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
    v_tem_tipo,
    v_tem_titulo,
    v_tem_mensagem,
    v_tem_obra_id,
    v_tem_capitulo_id,
    v_tem_href,
    v_tem_link,
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
    and v_tem_tipo
    and v_tem_titulo
    and v_tem_mensagem
  ) then
    return 0;
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

  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, '$6');
  end if;

  if v_tem_href then
    v_colunas := array_append(v_colunas, 'href');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_link then
    v_colunas := array_append(v_colunas, 'link');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_lida then
    v_colunas := array_append(v_colunas, 'lida');
    v_valores := array_append(v_valores, 'false');
  end if;

  if v_tem_notificacao_id then
    v_notificacao_expressao :=
      case
        when v_tipo_notificacao_id = 'uuid'
        then
          '(' ||
          'substr(md5(preparados.notificacao_chave), 1, 8) || ''-'' || ' ||
          'substr(md5(preparados.notificacao_chave), 9, 4) || ''-'' || ' ||
          'substr(md5(preparados.notificacao_chave), 13, 4) || ''-'' || ' ||
          'substr(md5(preparados.notificacao_chave), 17, 4) || ''-'' || ' ||
          'substr(md5(preparados.notificacao_chave), 21, 12)' ||
          ')::uuid'
        else
          'preparados.notificacao_chave'
      end;

    v_colunas := array_append(v_colunas, 'notificacao_id');
    v_valores := array_append(
      v_valores,
      v_notificacao_expressao
    );

    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.notificacao_id::text = (' ||
      v_notificacao_expressao ||
      ')::text';
  elsif v_tem_capitulo_id then
    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.capitulo_id::text = $6::text';
  elsif v_tem_obra_id then
    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.obra_id::text = $5::text';
  elsif v_tem_href then
    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.href::text = $7';
  elsif v_tem_link then
    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.link::text = $7';
  end if;

  if v_tem_autor_id then
    v_colunas := array_append(v_colunas, 'autor_id');
    v_valores := array_append(v_valores, '$1');
  end if;

  if v_tem_metadata then
    v_colunas := array_append(v_colunas, 'metadata');

    if v_tipo_metadata = 'json' then
      v_valores := array_append(
        v_valores,
        'jsonb_set(
          $8::jsonb,
          ''{notificacao_id}'',
          to_jsonb(preparados.notificacao_chave),
          true
        )::json'
      );
    elsif v_tipo_metadata = 'jsonb' then
      v_valores := array_append(
        v_valores,
        'jsonb_set(
          $8::jsonb,
          ''{notificacao_id}'',
          to_jsonb(preparados.notificacao_chave),
          true
        )'
      );
    else
      v_valores := array_append(
        v_valores,
        'jsonb_set(
          $8::jsonb,
          ''{notificacao_id}'',
          to_jsonb(preparados.notificacao_chave),
          true
        )::text'
      );
    end if;
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_created_at then
    v_colunas := array_append(v_colunas, 'created_at');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_updated_at then
    v_colunas := array_append(v_colunas, 'updated_at');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if to_regclass('public.seguindo_obras') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'seguindo_obras'
        and column_name in ('obra_id', 'user_id')
      group by table_schema, table_name
      having count(*) = 2
    )
  then
    v_receptores_partes := array_append(
      v_receptores_partes,
      'select seguidor.user_id::uuid as receptor_id
       from public.seguindo_obras seguidor
       where seguidor.obra_id = $5'
    );
  end if;

  if to_regclass('public.favoritos') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'favoritos'
        and column_name in ('obra_id', 'user_id')
      group by table_schema, table_name
      having count(*) = 2
    )
  then
    v_receptores_partes := array_append(
      v_receptores_partes,
      'select favorito.user_id::uuid as receptor_id
       from public.favoritos favorito
       where favorito.obra_id = $5'
    );
  end if;

  if to_regclass('public.seguindo_usuarios') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'seguindo_usuarios'
        and column_name in ('seguidor_id', 'seguido_id')
      group by table_schema, table_name
      having count(*) = 2
    )
  then
    v_receptores_partes := array_append(
      v_receptores_partes,
      'select relacao.seguidor_id::uuid as receptor_id
       from public.seguindo_usuarios relacao
       where relacao.seguido_id = $1'
    );
  end if;

  if array_length(v_receptores_partes, 1) is null then
    return 0;
  end if;

  v_receptores_sql :=
    array_to_string(v_receptores_partes, ' union ');

  v_sql := format(
    'with receptores as (
       select distinct origem.receptor_id
       from (%s) origem
       where origem.receptor_id is not null
         and origem.receptor_id <> $1
     ),
     preparados as (
       select
         receptor_id,
         $10 || '':'' || receptor_id::text as notificacao_chave
       from receptores
     )
     insert into public.notificacoes (%s)
     select %s
     from preparados
     where not exists (
       select 1
       from public.notificacoes n
       where %s
     )
     on conflict do nothing',
    v_receptores_sql,
    array_to_string(
      array(
        select format('%I', coluna)
        from unnest(v_colunas) as coluna
      ),
      ', '
    ),
    array_to_string(v_valores, ', '),
    v_where_duplicada
  );

  execute v_sql
  using
    v_autor_id,
    v_tipo,
    v_titulo,
    v_mensagem,
    p_obra_id,
    p_capitulo_id,
    v_href,
    v_metadata,
    v_criado_em,
    v_notificacao_base;

  get diagnostics v_total = row_count;

  return v_total;
exception
  when others then
    raise warning
      'Não foi possível criar notificações do capítulo %: %',
      p_capitulo_id,
      sqlerrm;

    return 0;
end;
$$;

revoke all
  on function public.criar_notificacoes_capitulo(
    uuid,
    uuid,
    text,
    text,
    text,
    text,
    timestamptz
  )
  from public, anon, authenticated;

grant execute
  on function public.criar_notificacoes_capitulo(
    uuid,
    uuid,
    text,
    text,
    text,
    text,
    timestamptz
  )
  to authenticated;

commit;