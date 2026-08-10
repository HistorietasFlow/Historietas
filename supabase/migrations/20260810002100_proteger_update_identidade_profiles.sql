begin;

create or replace function public.proteger_identidade_profiles()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'Os identificadores id e user_id do perfil nao podem ser alterados.'
    using errcode = '42501';
end;
$$;

drop trigger if exists profiles_proteger_identidade_update on public.profiles;

create trigger profiles_proteger_identidade_update
before update of id, user_id
on public.profiles
for each row
when (
  old.id is distinct from new.id
  or old.user_id is distinct from new.user_id
)
execute function public.proteger_identidade_profiles();

revoke all on function public.proteger_identidade_profiles() from public;
revoke all on function public.proteger_identidade_profiles() from anon;
revoke all on function public.proteger_identidade_profiles() from authenticated;

commit;