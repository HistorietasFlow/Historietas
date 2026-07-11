-- 20260711000300_comunidade_comentarios_respostas.sql
-- Respostas agrupadas nos comentários da Comunidade.
-- Adiciona vínculo com o comentário principal e notifica o autor respondido.

begin;

alter table public.comunidade_comentarios
  add column if not exists comentario_pai_id uuid null;

do $$
begin
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
end;
$$;

create index if not exists comunidade_comentarios_comentario_pai_id_idx
  on public.comunidade_comentarios (comentario_pai_id, criado_em asc);

create or replace function public.validar_resposta_comentario_comunidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.comentario_pai_id = new.id then
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
    raise exception 'A resposta precisa pertencer à mesma publicação do comentário principal.';
  end if;

  return new;
end;
$$;

drop trigger if exists comunidade_comentarios_validar_resposta
  on public.comunidade_comentarios;

create trigger comunidade_comentarios_validar_resposta
before insert or update of comentario_pai_id, post_id
on public.comunidade_comentarios
for each row
execute function public.validar_resposta_comentario_comunidade();

create or replace function public.notificar_comentario_post_comunidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post record;
  v_comentario_pai record;
  v_nome text;
begin
  if to_regprocedure('public.criar_notificacao_comunidade_interna(uuid, uuid, text, text, text, text, text)') is null then
    return new;
  end if;

  select id, autor_id
  into v_post
  from public.comunidade_posts
  where id = new.post_id
  limit 1;

  if not found or v_post.id is null then
    return new;
  end if;

  v_nome := nullif(trim(coalesce(to_jsonb(new) ->> 'autor_nome', '')), '');
  v_nome := coalesce(v_nome, public.obter_nome_usuario_notificacao(new.autor_id));

  if new.comentario_pai_id is not null then
    select id, autor_id
    into v_comentario_pai
    from public.comunidade_comentarios
    where id = new.comentario_pai_id
      and post_id = new.post_id
    limit 1;

    if
      v_comentario_pai.id is not null
      and v_comentario_pai.autor_id is not null
      and v_comentario_pai.autor_id <> new.autor_id
    then
      perform public.criar_notificacao_comunidade_interna(
        v_comentario_pai.autor_id,
        new.autor_id,
        'comunidade-resposta-comentario',
        'Nova resposta ao seu comentário',
        v_nome || ' respondeu ao seu comentário na Comunidade.',
        '/comunidade?post=' || new.post_id::text,
        'comunidade-resposta-comentario:' || new.id::text
      );
    end if;

    return new;
  end if;

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.autor_id,
    'comunidade-comentario-post',
    'Novo comentário na Comunidade',
    v_nome || ' comentou na sua publicação.',
    '/comunidade?post=' || new.post_id::text,
    'comunidade-comentario-post:' || new.post_id::text || ':' || new.id::text
  );

  return new;
exception
  when others then
    return new;
end;
$$;

revoke all on function public.validar_resposta_comentario_comunidade() from public;
revoke all on function public.validar_resposta_comentario_comunidade() from anon;
revoke all on function public.validar_resposta_comentario_comunidade() from authenticated;

revoke all on function public.notificar_comentario_post_comunidade() from public;
revoke all on function public.notificar_comentario_post_comunidade() from anon;
revoke all on function public.notificar_comentario_post_comunidade() from authenticated;

commit;