-- 20260705_notificacoes_social_rpc.sql
-- RPC genérica para notificações sociais reutilizável em seguir e comunidade.
-- Versão corrigida:
-- - restringe EXECUTE somente a authenticated;
-- - valida tipos permitidos;
-- - valida seguir-usuario em seguindo_usuarios;
-- - valida curtida/comentário da comunidade nas tabelas reais;
-- - valida ator_id embutido no notificacao_id das curtidas;
-- - impede usuário autenticado de criar notificação falsa para qualquer pessoa;
-- - evita duplicidade usando notificacao_id quando existir;
-- - não quebra se algumas colunas opcionais de notificacoes não existirem.

begin;

create or replace function public.criar_notificacao_social(
  p_user_id uuid,
  p_tipo text,
  p_titulo text default null,
  p_mensagem text default null,
  p_link text default null,
  p_notificacao_id text default null,
  p_obra_id uuid default null,
  p_capitulo_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid := p_user_id;
  v_tipo text := nullif(trim(coalesce(p_tipo, '')), '');
  v_titulo text := nullif(trim(coalesce(p_titulo, '')), '');
  v_mensagem text := nullif(trim(coalesce(p_mensagem, '')), '');
  v_link text := nullif(trim(coalesce(p_link, '')), '');
  v_notificacao_id text := nullif(trim(coalesce(p_notificacao_id, '')), '');

  v_post_id uuid := null;
  v_comentario_id uuid := null;
  v_parte_2 text := '';
  v_parte_3 text := '';

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

  v_colunas text[] := array['user_id', 'titulo', 'mensagem', 'tipo'];
  v_valores text[] := array['$1', '$2', '$3', '$4'];
  v_sql text;
  v_sql_existe text;
  v_ja_existe boolean := false;
begin
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

  if v_notificacao_id is null then
    v_notificacao_id :=
      v_tipo || ':' || v_ator_id::text || ':' || v_receptor_id::text ||
      coalesce(':' || p_obra_id::text, '') ||
      coalesce(':' || p_capitulo_id::text, '');
  end if;

  v_parte_2 := split_part(v_notificacao_id, ':', 2);
  v_parte_3 := split_part(v_notificacao_id, ':', 3);

  -- Seguir usuário: só cria se o vínculo existir.
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
  end if;

  -- Curtida em post da comunidade:
  -- notificacao_id esperado: comunidade-curtida-post:{postId}:{atorId}
  if v_tipo = 'comunidade-curtida-post' then
    if to_regclass('public.comunidade_posts') is null
      or to_regclass('public.comunidade_curtidas') is null
      or v_parte_2 !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or v_parte_3 !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then
      return 0;
    end if;

    if v_parte_3::uuid <> v_ator_id then
      return 0;
    end if;

    v_post_id := v_parte_2::uuid;

    select cp.autor_id
    into v_receptor_id
    from public.comunidade_posts cp
    where cp.id = v_post_id
    limit 1;

    if v_receptor_id is null or v_receptor_id <> p_user_id then
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
  end if;

  -- Comentário em post da comunidade:
  -- notificacao_id esperado: comunidade-comentario-post:{postId}:{comentarioId}
  if v_tipo = 'comunidade-comentario-post' then
    if to_regclass('public.comunidade_posts') is null
      or to_regclass('public.comunidade_comentarios') is null
      or v_parte_2 !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or v_parte_3 !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then
      return 0;
    end if;

    v_post_id := v_parte_2::uuid;
    v_comentario_id := v_parte_3::uuid;

    select cp.autor_id
    into v_receptor_id
    from public.comunidade_posts cp
    join public.comunidade_comentarios ccoment
      on ccoment.post_id = cp.id
    where cp.id = v_post_id
      and ccoment.id = v_comentario_id
      and ccoment.autor_id = v_ator_id
    limit 1;

    if v_receptor_id is null or v_receptor_id <> p_user_id then
      return 0;
    end if;
  end if;

  -- Curtida em comentário da comunidade:
  -- notificacao_id esperado: comunidade-curtida-comentario:{comentarioId}:{atorId}
  if v_tipo = 'comunidade-curtida-comentario' then
    if to_regclass('public.comunidade_comentarios') is null
      or to_regclass('public.comunidade_comentario_curtidas') is null
      or v_parte_2 !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or v_parte_3 !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then
      return 0;
    end if;

    if v_parte_3::uuid <> v_ator_id then
      return 0;
    end if;

    v_comentario_id := v_parte_2::uuid;

    select ccoment.autor_id
    into v_receptor_id
    from public.comunidade_comentarios ccoment
    where ccoment.id = v_comentario_id
    limit 1;

    if v_receptor_id is null or v_receptor_id <> p_user_id then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comunidade_comentario_curtidas ccc
      where ccc.comentario_id = v_comentario_id
        and ccc.usuario_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;
  end if;

  if v_receptor_id is null or v_receptor_id = v_ator_id then
    return 0;
  end if;

  v_titulo := coalesce(v_titulo, 'Nova notificação');
  v_mensagem := coalesce(v_mensagem, 'Você recebeu uma nova notificação.');
  v_link := coalesce(v_link, '/notificacoes');

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
    execute 'select exists (select 1 from public.notificacoes where user_id = $1 and notificacao_id = $2 limit 1)'
    into v_ja_existe
    using v_receptor_id, v_notificacao_id;
  else
    v_sql_existe := 'select exists (select 1 from public.notificacoes where user_id = $1 and tipo = $2';

    if v_tem_autor_id then
      v_sql_existe := v_sql_existe || ' and autor_id = $3';
    end if;

    if v_tem_obra_id then
      v_sql_existe := v_sql_existe || ' and obra_id is not distinct from $4';
    end if;

    if v_tem_capitulo_id then
      v_sql_existe := v_sql_existe || ' and capitulo_id is not distinct from $5';
    end if;

    v_sql_existe := v_sql_existe || ' limit 1)';

    execute v_sql_existe
    into v_ja_existe
    using v_receptor_id, v_tipo, v_ator_id, p_obra_id, p_capitulo_id;
  end if;

  if v_ja_existe then
    return 0;
  end if;

  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, '$6');
  end if;

  if v_tem_link then
    v_colunas := array_append(v_colunas, 'link');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_href then
    v_colunas := array_append(v_colunas, 'href');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_lida then
    v_colunas := array_append(v_colunas, 'lida');
    v_valores := array_append(v_valores, 'false');
  end if;

  if v_tem_notificacao_id then
    v_colunas := array_append(v_colunas, 'notificacao_id');
    v_valores := array_append(v_valores, '$8');
  end if;

  if v_tem_autor_id then
    v_colunas := array_append(v_colunas, 'autor_id');
    v_valores := array_append(v_valores, '$9');
  end if;

  if v_tem_metadata then
    v_colunas := array_append(v_colunas, 'metadata');
    v_valores := array_append(
      v_valores,
      'jsonb_build_object(''origem'', ''criar_notificacao_social'', ''ator_id'', $9::text, ''notificacao_id'', $8)'
    );
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
    array_to_string(v_colunas, ', '),
    array_to_string(v_valores, ', ')
  );

  execute v_sql
  using
    v_receptor_id,
    v_titulo,
    v_mensagem,
    v_tipo,
    p_obra_id,
    p_capitulo_id,
    v_link,
    v_notificacao_id,
    v_ator_id;

  return 1;
exception
  when others then
    return 0;
end;
$$;

revoke all on function public.criar_notificacao_social(
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid
) from public;

revoke all on function public.criar_notificacao_social(
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid
) from anon;

grant execute on function public.criar_notificacao_social(
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid
) to authenticated;

commit;