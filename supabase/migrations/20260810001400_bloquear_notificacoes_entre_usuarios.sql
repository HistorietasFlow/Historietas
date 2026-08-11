begin;

create or replace function public.bloquear_notificacao_entre_usuarios()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
begin
  -- Notificacoes sem ator identificado nao representam interacao direta.
  if new.user_id is null
    or new.autor_id is null
    or new.user_id = new.autor_id
  then
    return new;
  end if;

  -- Comunicacoes oficiais da moderacao nao podem ser ocultadas por bloqueio.
  if coalesce(new.tipo, '') = 'moderacao-denuncia' then
    return new;
  end if;

  if exists (
    select 1
    from public.usuarios_bloqueados bloqueio
    where (
      bloqueio.bloqueador_id = new.user_id
      and bloqueio.bloqueado_id = new.autor_id
    )
    or (
      bloqueio.bloqueador_id = new.autor_id
      and bloqueio.bloqueado_id = new.user_id
    )
  ) then
    return null;
  end if;

  return new;
end;
$$;

revoke all on function public.bloquear_notificacao_entre_usuarios() from public;
revoke all on function public.bloquear_notificacao_entre_usuarios() from anon;
revoke all on function public.bloquear_notificacao_entre_usuarios() from authenticated;

drop trigger if exists bloquear_notificacao_entre_usuarios_trigger
  on public.notificacoes;

create trigger bloquear_notificacao_entre_usuarios_trigger
before insert or update of user_id, autor_id, tipo
on public.notificacoes
for each row
execute function public.bloquear_notificacao_entre_usuarios();

commit;
