-- 20260711000200_comentarios_obras_respostas.sql
-- Respostas agrupadas nos comentários das obras.
-- Adiciona vínculo com comentário principal e notifica o autor do comentário respondido.

begin;

alter table public.comentarios_obras
  add column if not exists comentario_pai_id uuid null;

do $$
begin
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
end;
$$;

create index if not exists comentarios_obras_comentario_pai_id_idx
  on public.comentarios_obras (comentario_pai_id, criado_em asc);

create or replace function public.validar_resposta_comentario_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obra_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.comentario_pai_id = new.id then
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
    raise exception 'A resposta precisa pertencer à mesma obra do comentário principal.';
  end if;

  return new;
end;
$$;

drop trigger if exists comentarios_obras_validar_resposta
  on public.comentarios_obras;

create trigger comentarios_obras_validar_resposta
before insert or update of comentario_pai_id, obra_id
on public.comentarios_obras
for each row
execute function public.validar_resposta_comentario_obra();

create or replace function public.notificar_comentario_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obra record;
  v_comentario_pai record;
  v_nome_comentarista text;
  v_slug text;
  v_titulo_obra text;
begin
  select
    o.id,
    o.user_id,
    o.titulo,
    o.slug,
    o.publicado
  into v_obra
  from public.obras o
  where o.id = new.obra_id
  limit 1;

  if v_obra.id is null or coalesce(v_obra.publicado, false) = false then
    return new;
  end if;

  v_nome_comentarista :=
    public.obter_nome_usuario_notificacao(new.user_id);

  v_slug := nullif(btrim(coalesce(v_obra.slug, '')), '');
  v_titulo_obra := nullif(btrim(coalesce(v_obra.titulo, '')), '');

  if new.comentario_pai_id is not null then
    select
      comentario.id,
      comentario.user_id
    into v_comentario_pai
    from public.comentarios_obras comentario
    where comentario.id = new.comentario_pai_id
    limit 1;

    if
      v_comentario_pai.id is not null
      and v_comentario_pai.user_id is not null
      and v_comentario_pai.user_id <> new.user_id
    then
      perform public.criar_notificacao_comunidade_interna(
        v_comentario_pai.user_id,
        new.user_id,
        'comentario-obra',
        'Nova resposta ao seu comentário',
        coalesce(v_nome_comentarista, 'Usuário') ||
          ' respondeu ao seu comentário em "' ||
          left(coalesce(v_titulo_obra, 'uma obra'), 90) ||
          '".',
        '/obra/' || coalesce(v_slug, v_obra.id::text),
        'resposta-comentario-obra:' || new.id::text
      );
    end if;

    return new;
  end if;

  if v_obra.user_id is null or v_obra.user_id = new.user_id then
    return new;
  end if;

  perform public.criar_notificacao_comunidade_interna(
    v_obra.user_id,
    new.user_id,
    'comentario-obra',
    'Novo comentário na sua obra',
    coalesce(v_nome_comentarista, 'Usuário') ||
      ' comentou em "' ||
      left(coalesce(v_titulo_obra, 'sua obra'), 90) ||
      '".',
    '/obra/' || coalesce(v_slug, v_obra.id::text),
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

revoke all on function public.validar_resposta_comentario_obra() from public;
revoke all on function public.validar_resposta_comentario_obra() from anon;
revoke all on function public.validar_resposta_comentario_obra() from authenticated;

revoke all on function public.notificar_comentario_obra() from public;
revoke all on function public.notificar_comentario_obra() from anon;
revoke all on function public.notificar_comentario_obra() from authenticated;

commit;