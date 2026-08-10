begin;

create or replace function public.definir_fixacao_comunidade_post()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
begin
  if new.fixado is distinct from old.fixado
    or new.fixado_em is distinct from old.fixado_em
    or new.fixado_por is distinct from old.fixado_por
  then
    if auth.uid() is null
      or not public.comunidade_usuario_e_admin()
    then
      raise exception 'Somente administradores podem alterar a fixacao de posts.';
    end if;

    if coalesce(new.fixado, false) = true then
      if old.fixado is distinct from true then
        new.fixado_em := now();
        new.fixado_por := auth.uid();
      else
        new.fixado_em := old.fixado_em;
        new.fixado_por := old.fixado_por;
      end if;
    else
      new.fixado_em := null;
      new.fixado_por := null;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.definir_fixacao_comunidade_post() from public;
revoke all on function public.definir_fixacao_comunidade_post() from anon;
revoke all on function public.definir_fixacao_comunidade_post() from authenticated;

drop trigger if exists comunidade_posts_definir_fixacao
  on public.comunidade_posts;

create trigger comunidade_posts_definir_fixacao
before update of fixado, fixado_em, fixado_por
on public.comunidade_posts
for each row
execute function public.definir_fixacao_comunidade_post();

commit;
