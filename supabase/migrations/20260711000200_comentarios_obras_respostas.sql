-- 20260711000200_comentarios_obras_respostas.sql
-- Respostas agrupadas nos comentários das obras.
-- Adiciona vínculo com o comentário principal e notifica o autor respondido.

begin;

do $$
begin
  if to_regclass('public.comentarios_obras') is null then
    return;
  end if;

  alter table public.comentarios_obras
    add column if not exists comentario_pai_id uuid null;

  -- Corrige vínculos antigos inválidos antes de criar a chave estrangeira.
  update public.comentarios_obras resposta
  set comentario_pai_id = null
  where resposta.comentario_pai_id is not null
    and (
      resposta.comentario_pai_id = resposta.id
      or not exists (
        select 1
        from public.comentarios_obras pai
        where pai.id = resposta.comentario_pai_id
          and pai.obra_id = resposta.obra_id
      )
    );

  if not exists (
    select 1
    from pg_constraint
    where conname = 'comentarios_obras_comentario_pai_id_fkey'
      and conrelid = 'public.comentarios_obras'::regclass
  ) then
    alter table public.comentarios_obras
      add constraint comentarios_obras_comentario_pai_id_fkey
      foreign key (comentario_pai_id)
      references public.comentarios_obras(id)
      on delete cascade;
  end if;

  create index if not exists comentarios_obras_comentario_pai_id_idx
    on public.comentarios_obras (comentario_pai_id, criado_em asc);
end
$$;

create or replace function public.validar_resposta_comentario_obra()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_obra_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.id is not null and new.comentario_pai_id = new.id then
    raise exception 'Um comentário não pode responder a ele mesmo.';
  end if;

  select comentario.obra_id
  into v_obra_pai_id
  from public.comentarios_obras comentario
  where comentario.id = new.comentario_pai_id
  limit 1;

  if v_obra_pai_id is null then
    raise exception 'Comentário principal não encontrado.';
  end if;

  if v_obra_pai_id <> new.obra_id then
    raise exception
      'A resposta precisa pertencer à mesma obra do comentário principal.';
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.comentarios_obras') is null then
    return;
  end if;

  drop trigger if exists comentarios_obras_validar_resposta
    on public.comentarios_obras;

  create trigger comentarios_obras_validar_resposta
  before insert or update of comentario_pai_id, obra_id
  on public.comentarios_obras
  for each row
  execute function public.validar_resposta_comentario_obra();
end
$$;

create or replace function public.notificar_comentario_obra()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_obra record;
  v_comentario_pai record;
  v_nome_comentarista text := 'Usuário';
  v_slug text;
  v_titulo_obra text;
  v_href text;
begin
  if new.id is null
    or new.obra_id is null
    or new.user_id is null
  then
    return new;
  end if;

  select
    obra.id,
    obra.user_id,
    obra.titulo,
    obra.slug,
    obra.publicado
  into v_obra
  from public.obras obra
  where obra.id = new.obra_id
  limit 1;

  if v_obra.id is null
    or coalesce(v_obra.publicado, false) = false
  then
    return new;
  end if;

  if to_regprocedure(
    'public.obter_nome_usuario_notificacao(uuid)'
  ) is not null then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome_comentarista
      using new.user_id;
    exception
      when others then
        v_nome_comentarista := 'Usuário';
    end;
  end if;

  v_nome_comentarista := left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome_comentarista), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );

  v_slug := nullif(btrim(coalesce(v_obra.slug, '')), '');
  v_titulo_obra := nullif(btrim(coalesce(v_obra.titulo, '')), '');
  v_href :=
    '/obra/' ||
    coalesce(v_slug, v_obra.id::text);

  if new.comentario_pai_id is not null then
    select
      comentario.id,
      comentario.user_id
    into v_comentario_pai
    from public.comentarios_obras comentario
    where comentario.id = new.comentario_pai_id
      and comentario.obra_id = new.obra_id
    limit 1;

    if v_comentario_pai.id is null
      or v_comentario_pai.user_id is null
      or v_comentario_pai.user_id = new.user_id
    then
      return new;
    end if;

    if to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is null then
      return new;
    end if;

    perform public.criar_notificacao_comunidade_interna(
      v_comentario_pai.user_id,
      new.user_id,
      'comentario-obra',
      'Nova resposta ao seu comentário',
      v_nome_comentarista ||
        ' respondeu ao seu comentário em "' ||
        left(coalesce(v_titulo_obra, 'uma obra'), 90) ||
        '".',
      v_href,
      'resposta-comentario-obra:' || new.id::text
    );

    return new;
  end if;

  if v_obra.user_id is null
    or v_obra.user_id = new.user_id
  then
    return new;
  end if;

  if to_regprocedure(
    'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
  ) is null then
    return new;
  end if;

  perform public.criar_notificacao_comunidade_interna(
    v_obra.user_id,
    new.user_id,
    'comentario-obra',
    'Novo comentário na sua obra',
    v_nome_comentarista ||
      ' comentou em "' ||
      left(coalesce(v_titulo_obra, 'sua obra'), 90) ||
      '".',
    v_href,
    'comentario-obra:' || new.id::text
  );

  return new;
exception
  when others then
    raise warning
      'Não foi possível criar notificação do comentário da obra %: %',
      new.obra_id,
      sqlerrm;

    return new;
end;
$$;

do $$
begin
  if to_regclass('public.comentarios_obras') is null then
    return;
  end if;

  drop trigger if exists comentarios_obras_notificar_autor
    on public.comentarios_obras;

  create trigger comentarios_obras_notificar_autor
  after insert on public.comentarios_obras
  for each row
  execute function public.notificar_comentario_obra();
end
$$;

revoke all
  on function public.validar_resposta_comentario_obra()
  from public, anon, authenticated;

revoke all
  on function public.notificar_comentario_obra()
  from public, anon, authenticated;

commit;