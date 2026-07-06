-- 20260705_notificacoes_capitulo_rpc.sql
-- Cria notificações reais de capítulo pelo banco, sem depender de insert client-side bloqueado por RLS.
-- Versão auditada/corrigida:
-- - restringe EXECUTE somente a authenticated;
-- - exige obra e capítulo publicados;
-- - evita duplicar notificações do mesmo capítulo;
-- - não quebra se algumas colunas opcionais de notificacoes não existirem.

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
set search_path = public
as $$
declare
  v_autor_id uuid := auth.uid();
  v_obra record;
  v_capitulo record;
  v_total integer := 0;

  v_tipo text := coalesce(nullif(p_tipo, ''), 'novo-capitulo');
  v_titulo text := coalesce(nullif(p_titulo, ''), 'Atualização de capítulo');
  v_mensagem text := coalesce(nullif(p_mensagem, ''), 'Um capítulo recebeu uma atualização.');
  v_href text := coalesce(nullif(p_href, ''), '/notificacoes');
  v_criado_em timestamptz := coalesce(p_criado_em, now());
  v_metadata jsonb;

  v_colunas text[] := array['user_id', 'tipo', 'titulo', 'mensagem'];
  v_valores text[] := array['receptores.receptor_id', '$2', '$3', '$4'];
  v_receptores_partes text[] := array[]::text[];
  v_receptores_sql text;
  v_where_duplicada text := 'and n.user_id = receptores.receptor_id and n.tipo = $2';
  v_sql text;

  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_href boolean := false;
  v_tem_link boolean := false;
  v_tem_lida boolean := false;
  v_tem_metadata boolean := false;
  v_tem_criada_em boolean := false;
  v_tem_criado_em boolean := false;
  v_tem_atualizado_em boolean := false;
begin
  if v_autor_id is null then
    return 0;
  end if;

  if to_regclass('public.notificacoes') is null then
    return 0;
  end if;

  -- Colunas obrigatórias da tabela notificacoes.
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name in ('user_id', 'tipo', 'titulo', 'mensagem')
    group by table_schema, table_name
    having count(*) = 4
  ) then
    return 0;
  end if;

  select id, user_id, titulo, autor, publicado
    into v_obra
  from public.obras
  where id = p_obra_id
  limit 1;

  if not found then
    return 0;
  end if;

  if v_obra.user_id is distinct from v_autor_id then
    return 0;
  end if;

  if coalesce(v_obra.publicado, false) = false then
    return 0;
  end if;

  select id, obra_id, titulo, publicado
    into v_capitulo
  from public.capitulos
  where id = p_capitulo_id
    and obra_id = p_obra_id
  limit 1;

  if not found then
    return 0;
  end if;

  if coalesce(v_capitulo.publicado, false) = false then
    return 0;
  end if;

  v_metadata := jsonb_build_object(
    'obra_titulo', coalesce(v_obra.titulo, ''),
    'autor', coalesce(v_obra.autor, ''),
    'capitulo_titulo', coalesce(v_capitulo.titulo, ''),
    'origem', 'criar_notificacoes_capitulo'
  );

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
      and column_name = 'href'
  ) into v_tem_href;

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
      and column_name = 'lida'
  ) into v_tem_lida;

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
      and column_name = 'atualizado_em'
  ) into v_tem_atualizado_em;

  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, '$5');
    v_where_duplicada := v_where_duplicada || ' and n.obra_id = $5';
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, '$6');
    v_where_duplicada := v_where_duplicada || ' and n.capitulo_id = $6';
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

  if v_tem_metadata then
    v_colunas := array_append(v_colunas, 'metadata');
    v_valores := array_append(v_valores, '$8::jsonb');
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
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
      'select so.user_id::uuid as receptor_id from public.seguindo_obras so where so.obra_id = $5'
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
      'select f.user_id::uuid as receptor_id from public.favoritos f where f.obra_id = $5'
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
      'select su.seguidor_id::uuid as receptor_id from public.seguindo_usuarios su where su.seguido_id = $1'
    );
  end if;

  if array_length(v_receptores_partes, 1) is null then
    return 0;
  end if;

  v_receptores_sql := array_to_string(v_receptores_partes, ' union ');

  v_sql := format(
    'insert into public.notificacoes (%s)
     select distinct %s
     from (%s) receptores
     where receptores.receptor_id is not null
       and receptores.receptor_id <> $1
       and not exists (
         select 1
         from public.notificacoes n
         where 1 = 1
           %s
       )',
    array_to_string(v_colunas, ', '),
    array_to_string(v_valores, ', '),
    v_receptores_sql,
    v_where_duplicada
  );

  execute v_sql
    using v_autor_id, v_tipo, v_titulo, v_mensagem, p_obra_id, p_capitulo_id, v_href, v_metadata, v_criado_em;

  get diagnostics v_total = row_count;

  return v_total;
end;
$$;

revoke all on function public.criar_notificacoes_capitulo(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) from public;

grant execute on function public.criar_notificacoes_capitulo(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) to authenticated;

commit;
