-- 20260711000400_comentarios_capitulos_respostas.sql
-- Respostas agrupadas nos comentários dos capítulos.
-- Adiciona vínculo com o comentário principal, valida o capítulo e direciona
-- a notificação da resposta para o autor do comentário respondido.
-- O conteúdo das notificações é sempre derivado no servidor.

begin;

do $$
begin
  if to_regclass('public.comentarios_capitulos') is null then
    return;
  end if;

  alter table public.comentarios_capitulos
    add column if not exists comentario_pai_id uuid null;

  -- Remove vínculos antigos inválidos antes de recriar a chave estrangeira.
  update public.comentarios_capitulos resposta
  set comentario_pai_id = null
  where resposta.comentario_pai_id is not null
    and (
      resposta.comentario_pai_id = resposta.id
      or not exists (
        select 1
        from public.comentarios_capitulos pai
        where pai.id = resposta.comentario_pai_id
          and pai.capitulo_id = resposta.capitulo_id
      )
    );

  alter table public.comentarios_capitulos
    drop constraint if exists comentarios_capitulos_comentario_pai_id_fkey;

  alter table public.comentarios_capitulos
    add constraint comentarios_capitulos_comentario_pai_id_fkey
    foreign key (comentario_pai_id)
    references public.comentarios_capitulos(id)
    on delete cascade;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comentarios_capitulos'
      and column_name = 'criado_em'
  ) then
    create index if not exists
      comentarios_capitulos_comentario_pai_id_idx
      on public.comentarios_capitulos (
        comentario_pai_id,
        criado_em asc
      );
  else
    create index if not exists
      comentarios_capitulos_comentario_pai_id_idx
      on public.comentarios_capitulos (comentario_pai_id);
  end if;
end
$$;

create or replace function public.validar_resposta_comentario_capitulo()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_capitulo_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.id is not null and new.comentario_pai_id = new.id then
    raise exception 'Um comentário não pode responder a ele mesmo.';
  end if;

  select comentario.capitulo_id
  into v_capitulo_pai_id
  from public.comentarios_capitulos comentario
  where comentario.id = new.comentario_pai_id
  limit 1;

  if v_capitulo_pai_id is null then
    raise exception 'Comentário principal não encontrado.';
  end if;

  if v_capitulo_pai_id <> new.capitulo_id then
    raise exception
      'A resposta precisa pertencer ao mesmo capítulo do comentário principal.';
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.comentarios_capitulos') is null then
    return;
  end if;

  drop trigger if exists comentarios_capitulos_validar_resposta
    on public.comentarios_capitulos;

  create trigger comentarios_capitulos_validar_resposta
  before insert or update of comentario_pai_id, capitulo_id
  on public.comentarios_capitulos
  for each row
  execute function public.validar_resposta_comentario_capitulo();
end
$$;

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
set search_path = pg_catalog, public, pg_temp
as $$
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
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and metadata::jsonb ->> ''notificacao_id'' = $2
       )'
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
$$;

revoke all
  on function public.validar_resposta_comentario_capitulo()
  from public, anon, authenticated;

revoke all
  on function public.criar_notificacao_interacao_capitulo(
    uuid,
    uuid,
    text,
    text,
    text,
    text
  )
  from public, anon, authenticated;

grant execute
  on function public.criar_notificacao_interacao_capitulo(
    uuid,
    uuid,
    text,
    text,
    text,
    text
  )
  to authenticated;

commit;