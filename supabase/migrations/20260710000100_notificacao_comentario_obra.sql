-- 20260710000100_notificacao_comentario_obra.sql
-- Notifica o autor quando outro usuário comenta diretamente em uma obra.
-- O receptor, o conteúdo e o link são derivados exclusivamente no servidor.

begin;

do $$
begin
  if to_regclass('public.obras') is null then
    raise exception
      'A tabela public.obras precisa existir antes desta migration.';
  end if;

  if to_regclass('public.comentarios_obras') is null then
    raise exception
      'A tabela public.comentarios_obras precisa existir antes desta migration.';
  end if;

  if to_regprocedure(
    'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
  ) is null then
    raise exception
      'A função public.criar_notificacao_comunidade_interna precisa existir antes desta migration.';
  end if;
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
    or v_obra.user_id is null
    or coalesce(v_obra.publicado, false) = false
    or v_obra.user_id = new.user_id
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
      coalesce(
        nullif(btrim(v_nome_comentarista), ''),
        'Usuário'
      ),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );

  v_slug := nullif(btrim(coalesce(v_obra.slug, '')), '');
  v_titulo_obra := nullif(
    btrim(coalesce(v_obra.titulo, '')),
    ''
  );
  v_href :=
    '/obra/' ||
    coalesce(v_slug, v_obra.id::text);

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

drop trigger if exists comentarios_obras_notificar_autor
  on public.comentarios_obras;

create trigger comentarios_obras_notificar_autor
after insert
on public.comentarios_obras
for each row
execute function public.notificar_comentario_obra();

revoke all
  on function public.notificar_comentario_obra()
  from public, anon, authenticated;

commit;