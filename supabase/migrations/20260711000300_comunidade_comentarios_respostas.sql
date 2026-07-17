-- 20260711000300_comunidade_comentarios_respostas.sql
-- Respostas agrupadas nos comentários da Comunidade.
-- Adiciona vínculo com o comentário principal e notifica o autor respondido.

begin;

do $$
begin
  if to_regclass('public.comunidade_comentarios') is null then
    return;
  end if;

  alter table public.comunidade_comentarios
    add column if not exists comentario_pai_id uuid null;

  -- Remove vínculos antigos inválidos antes de criar a chave estrangeira.
  update public.comunidade_comentarios resposta
  set comentario_pai_id = null
  where resposta.comentario_pai_id is not null
    and (
      resposta.comentario_pai_id = resposta.id
      or not exists (
        select 1
        from public.comunidade_comentarios pai
        where pai.id = resposta.comentario_pai_id
          and pai.post_id = resposta.post_id
      )
    );

  if not exists (
    select 1
    from pg_constraint
    where conname = 'comunidade_comentarios_comentario_pai_id_fkey'
      and conrelid = 'public.comunidade_comentarios'::regclass
  ) then
    alter table public.comunidade_comentarios
      add constraint comunidade_comentarios_comentario_pai_id_fkey
      foreign key (comentario_pai_id)
      references public.comunidade_comentarios(id)
      on delete cascade;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comunidade_comentarios'
      and column_name = 'criado_em'
  ) then
    create index if not exists
      comunidade_comentarios_comentario_pai_id_idx
      on public.comunidade_comentarios (
        comentario_pai_id,
        criado_em asc
      );
  else
    create index if not exists
      comunidade_comentarios_comentario_pai_id_idx
      on public.comunidade_comentarios (comentario_pai_id);
  end if;
end
$$;

create or replace function public.validar_resposta_comentario_comunidade()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_post_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.id is not null and new.comentario_pai_id = new.id then
    raise exception 'Um comentário não pode responder a ele mesmo.';
  end if;

  select comentario.post_id
  into v_post_pai_id
  from public.comunidade_comentarios comentario
  where comentario.id = new.comentario_pai_id
  limit 1;

  if v_post_pai_id is null then
    raise exception 'Comentário principal não encontrado.';
  end if;

  if v_post_pai_id <> new.post_id then
    raise exception
      'A resposta precisa pertencer à mesma publicação do comentário principal.';
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.comunidade_comentarios') is null then
    return;
  end if;

  drop trigger if exists comunidade_comentarios_validar_resposta
    on public.comunidade_comentarios;

  create trigger comunidade_comentarios_validar_resposta
  before insert or update of comentario_pai_id, post_id
  on public.comunidade_comentarios
  for each row
  execute function public.validar_resposta_comentario_comunidade();
end
$$;

create or replace function public.notificar_comentario_post_comunidade()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_post record;
  v_comentario_pai record;
  v_nome text := 'Usuário';
begin
  if new.id is null
    or new.post_id is null
    or new.autor_id is null
  then
    return new;
  end if;

  if to_regclass('public.comunidade_posts') is null
    or to_regclass('public.comunidade_comentarios') is null
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

  if v_post.id is null or v_post.autor_id is null then
    return new;
  end if;

  v_nome :=
    nullif(
      btrim(coalesce(to_jsonb(new) ->> 'autor_nome', '')),
      ''
    );

  if v_nome is null
    and to_regprocedure(
      'public.obter_nome_usuario_notificacao(uuid)'
    ) is not null
  then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome
      using new.autor_id;
    exception
      when others then
        v_nome := null;
    end;
  end if;

  v_nome := left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );

  if new.comentario_pai_id is not null then
    select comentario.id, comentario.autor_id
    into v_comentario_pai
    from public.comunidade_comentarios comentario
    where comentario.id = new.comentario_pai_id
      and comentario.post_id = new.post_id
    limit 1;

    if v_comentario_pai.id is null
      or v_comentario_pai.autor_id is null
      or v_comentario_pai.autor_id = new.autor_id
    then
      return new;
    end if;

    perform public.criar_notificacao_comunidade_interna(
      v_comentario_pai.autor_id,
      new.autor_id,
      'comunidade-resposta-comentario',
      'Nova resposta ao seu comentário',
      v_nome || ' respondeu ao seu comentário na Comunidade.',
      '/comunidade?post=' || new.post_id::text,
      'comunidade-resposta-comentario:' || new.id::text
    );

    return new;
  end if;

  if v_post.autor_id = new.autor_id then
    return new;
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
      'Não foi possível criar notificação do comentário da Comunidade %: %',
      new.id,
      sqlerrm;

    return new;
end;
$$;

-- Garante que a função atualizada seja usada sem criar um segundo trigger.
do $$
begin
  if to_regclass('public.comunidade_comentarios') is null then
    return;
  end if;

  drop trigger if exists trg_notificar_comentario_post_comunidade
    on public.comunidade_comentarios;

  create trigger trg_notificar_comentario_post_comunidade
  after insert on public.comunidade_comentarios
  for each row
  execute function public.notificar_comentario_post_comunidade();
end
$$;

revoke all
  on function public.validar_resposta_comentario_comunidade()
  from public, anon, authenticated;

revoke all
  on function public.notificar_comentario_post_comunidade()
  from public, anon, authenticated;

commit;