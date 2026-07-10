-- 20260710000200_notificacao_curtida_obra.sql
-- Notifica o autor quando outro usuário curte diretamente uma obra.

begin;

create or replace function public.notificar_curtida_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obra record;
  v_nome_usuario text;
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

  v_nome_usuario := public.obter_nome_usuario_notificacao(new.user_id);
  v_slug := nullif(btrim(coalesce(v_obra.slug, '')), '');
  v_titulo_obra := nullif(btrim(coalesce(v_obra.titulo, '')), '');

  perform public.criar_notificacao_comunidade_interna(
    v_obra.user_id,
    new.user_id,
    'curtida-obra',
    'Nova curtida na sua obra',
    coalesce(v_nome_usuario, 'Usuário') ||
      ' curtiu "' ||
      left(coalesce(v_titulo_obra, 'sua obra'), 90) ||
      '".',
    '/obra/' || coalesce(v_slug, v_obra.id::text),
    'curtida-obra:' || new.obra_id::text || ':' || new.user_id::text
  );

  return new;
exception
  when others then
    raise warning
      'Não foi possível criar notificação da curtida da obra %: %',
      new.obra_id,
      sqlerrm;

    return new;
end;
$$;

drop trigger if exists obra_curtidas_notificar_autor
  on public.obra_curtidas;

create trigger obra_curtidas_notificar_autor
after insert on public.obra_curtidas
for each row
execute function public.notificar_curtida_obra();

revoke all on function public.notificar_curtida_obra() from public;
revoke all on function public.notificar_curtida_obra() from anon;
revoke all on function public.notificar_curtida_obra() from authenticated;

commit;