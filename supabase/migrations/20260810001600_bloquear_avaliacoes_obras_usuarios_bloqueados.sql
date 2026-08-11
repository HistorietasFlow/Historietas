begin;

create or replace function public.bloquear_autoavaliacao_obra()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
declare
  v_autor_id uuid;
begin
  select obra.user_id
  into v_autor_id
  from public.obras obra
  where obra.id = new.obra_id
  limit 1;

  if v_autor_id is null then
    raise exception 'A obra informada nao existe.'
      using errcode = '23503';
  end if;

  if new.user_id = v_autor_id then
    raise exception 'O autor nao pode avaliar a propria obra.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.usuarios_bloqueados bloqueio
    where (
      bloqueio.bloqueador_id = new.user_id
      and bloqueio.bloqueado_id = v_autor_id
    )
    or (
      bloqueio.bloqueador_id = v_autor_id
      and bloqueio.bloqueado_id = new.user_id
    )
  ) then
    raise exception 'Usuarios bloqueados nao podem avaliar obras entre si.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.bloquear_autoavaliacao_obra() from public;
revoke all on function public.bloquear_autoavaliacao_obra() from anon;
revoke all on function public.bloquear_autoavaliacao_obra() from authenticated;

drop trigger if exists impedir_autoavaliacao_obra
  on public.obra_avaliacoes;

create trigger impedir_autoavaliacao_obra
before insert or update
on public.obra_avaliacoes
for each row
execute function public.bloquear_autoavaliacao_obra();

commit;
