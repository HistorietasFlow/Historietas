-- 20260710000100_notificacao_comentario_obra.sql
-- Notifica o autor quando outro usuário comenta diretamente em uma obra.

begin;

create or replace function public.notificar_comentario_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obra record;
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

  if v_obra.id is null then
    return new;
  end if;

  if coalesce(v_obra.publicado, false) = false then
    return new;
  end if;

  if v_obra.user_id is null or v_obra.user_id = new.user_id then
    return new;
  end if;

  v_nome_comentarista :=
    public.obter_nome_usuario_notificacao(new.user_id);

  v_slug := nullif(btrim(coalesce(v_obra.slug, '')), '');
  v_titulo_obra := nullif(btrim(coalesce(v_obra.titulo, '')), '');

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

drop trigger if exists comentarios_obras_notificar_autor
  on public.comentarios_obras;

create trigger comentarios_obras_notificar_autor
after insert on public.comentarios_obras
for each row
execute function public.notificar_comentario_obra();

revoke all on function public.notificar_comentario_obra() from public;
revoke all on function public.notificar_comentario_obra() from anon;
revoke all on function public.notificar_comentario_obra() from authenticated;

commit;