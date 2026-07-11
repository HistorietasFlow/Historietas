-- 20260711000400_comentarios_capitulos_respostas.sql
-- Respostas agrupadas nos comentários dos capítulos.
-- Adiciona vínculo com o comentário principal, valida o capítulo e direciona
-- a notificação da resposta para o autor do comentário respondido.

begin;

alter table public.comentarios_capitulos
  add column if not exists comentario_pai_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comentarios_capitulos_comentario_pai_id_fkey'
      and conrelid = 'public.comentarios_capitulos'::regclass
  ) then
    alter table public.comentarios_capitulos
      add constraint comentarios_capitulos_comentario_pai_id_fkey
      foreign key (comentario_pai_id)
      references public.comentarios_capitulos(id)
      on delete cascade;
  end if;
end;
$$;

create index if not exists comentarios_capitulos_comentario_pai_id_idx
  on public.comentarios_capitulos (comentario_pai_id, criado_em asc);

create or replace function public.validar_resposta_comentario_capitulo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capitulo_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.comentario_pai_id = new.id then
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
    raise exception 'A resposta precisa pertencer ao mesmo capítulo do comentário principal.';
  end if;

  return new;
end;
$$;

drop trigger if exists comentarios_capitulos_validar_resposta
  on public.comentarios_capitulos;

create trigger comentarios_capitulos_validar_resposta
before insert or update of comentario_pai_id, capitulo_id
on public.comentarios_capitulos
for each row
execute function public.validar_resposta_comentario_capitulo();

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
set search_path = public
as $$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid;
  v_obra_id uuid;
  v_comentario_pai_id uuid;
  v_eh_resposta boolean := false;
  v_notificacao_id text;
  v_tipo text := nullif(trim(coalesce(p_tipo, '')), '');
  v_titulo text := nullif(trim(coalesce(p_titulo, '')), '');
  v_mensagem text := nullif(trim(coalesce(p_mensagem, '')), '');
  v_link text := nullif(trim(coalesce(p_link, '')), '');

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
    coalesce(o.user_id, c.user_id)
  into
    v_obra_id,
    v_receptor_id
  from public.capitulos c
  left join public.obras o on o.id = c.obra_id
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
      limit 1
    ) then
      return 0;
    end if;
  end if;

  if v_tipo = 'comentario-capitulo' then
    if p_comentario_id is null then
      return 0;
    end if;

    select cc.comentario_pai_id
    into v_comentario_pai_id
    from public.comentarios_capitulos cc
    where cc.id = p_comentario_id
      and cc.capitulo_id = p_capitulo_id
      and cc.user_id = v_ator_id
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
      v_titulo := 'Nova resposta ao seu comentário';
    end if;
  end if;

  if v_tipo = 'curtida-comentario-capitulo' then
    if p_comentario_id is null then
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

    if to_regclass('public.comentarios_capitulos_curtidas') is null then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comentarios_capitulos_curtidas ccc
      where ccc.comentario_id = p_comentario_id
        and ccc.usuario_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;
  end if;

  if v_receptor_id = v_ator_id then
    return 0;
  end if;

  v_notificacao_id :=
    case
      when v_tipo = 'curtida-capitulo' then
        'curtida-capitulo:' || p_capitulo_id::text || ':' || v_ator_id::text
      when v_tipo = 'comentario-capitulo'
        and v_eh_resposta
        and p_comentario_id is not null
      then
        'resposta-comentario-capitulo:' || p_comentario_id::text
      when v_tipo = 'comentario-capitulo' and p_comentario_id is not null then
        'comentario-capitulo:' || p_comentario_id::text
      when v_tipo = 'curtida-comentario-capitulo' and p_comentario_id is not null then
        'curtida-comentario-capitulo:' || p_comentario_id::text || ':' || v_ator_id::text
      else
        v_tipo || ':' || p_capitulo_id::text || ':' || v_ator_id::text
    end;

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
    execute 'select exists (select 1 from public.notificacoes where user_id = $1 and tipo = $2 and capitulo_id = $3 limit 1)'
    into v_ja_existe
    using v_receptor_id, v_tipo, p_capitulo_id;
  end if;

  if v_ja_existe then
    return 0;
  end if;

  v_colunas := array[
    'user_id',
    'obra_id',
    'capitulo_id',
    'titulo',
    'mensagem',
    'tipo',
    'lida'
  ];
  v_valores := array['$1', '$2', '$3', '$4', '$5', '$6', 'false'];

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
      'jsonb_build_object(' ||
        '''origem'', ''criar_notificacao_interacao_capitulo'', ' ||
        '''ator_id'', $9::text, ' ||
        '''notificacao_id'', $8, ' ||
        '''comentario_pai_id'', $10::text, ' ||
        '''resposta'', $11' ||
      ')'
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
    v_obra_id,
    p_capitulo_id,
    coalesce(v_titulo, 'Nova interação no capítulo'),
    coalesce(v_mensagem, 'Você recebeu uma nova interação em um capítulo.'),
    v_tipo,
    coalesce(v_link, '/notificacoes'),
    v_notificacao_id,
    v_ator_id,
    v_comentario_pai_id,
    v_eh_resposta;

  return 1;
exception
  when others then
    return 0;
end;
$$;

revoke all on function public.validar_resposta_comentario_capitulo()
  from public;
revoke all on function public.validar_resposta_comentario_capitulo()
  from anon;
revoke all on function public.validar_resposta_comentario_capitulo()
  from authenticated;

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