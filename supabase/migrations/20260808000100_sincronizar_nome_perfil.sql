-- Mantém cópias denormalizadas do nome do autor sincronizadas com profiles.nome.
-- profiles.nome é a fonte principal.
-- Não altera seguindo_autores porque essa tabela legada não possui autor_id.

create or replace function public.sincronizar_nome_perfil_denormalizado()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.nome is not distinct from old.nome then
    return new;
  end if;

  update public.obras
     set autor = new.nome
   where user_id = new.user_id
     and autor is distinct from new.nome;

  update public.comunidade_posts
     set autor_nome = new.nome
   where autor_id = new.user_id
     and autor_nome is distinct from new.nome;

  update public.comunidade_comentarios
     set autor_nome = new.nome
   where autor_id = new.user_id
     and autor_nome is distinct from new.nome;

  update public.obra_comentarios
     set autor_nome = new.nome
   where autor_id = new.user_id
     and autor_nome is distinct from new.nome;

  update public.notificacoes
     set autor_nome = new.nome
   where autor_id = new.user_id
     and autor_nome is distinct from new.nome;

  return new;
end;
$$;

drop trigger if exists trigger_profiles_sincronizar_nome_denormalizado
on public.profiles;

create trigger trigger_profiles_sincronizar_nome_denormalizado
after update of nome on public.profiles
for each row
execute function public.sincronizar_nome_perfil_denormalizado();

-- Corrige dados já existentes que estejam com nome antigo.

update public.obras o
   set autor = p.nome
  from public.profiles p
 where o.user_id = p.user_id
   and o.autor is distinct from p.nome;

update public.comunidade_posts x
   set autor_nome = p.nome
  from public.profiles p
 where x.autor_id = p.user_id
   and x.autor_nome is distinct from p.nome;

update public.comunidade_comentarios x
   set autor_nome = p.nome
  from public.profiles p
 where x.autor_id = p.user_id
   and x.autor_nome is distinct from p.nome;

update public.obra_comentarios x
   set autor_nome = p.nome
  from public.profiles p
 where x.autor_id = p.user_id
   and x.autor_nome is distinct from p.nome;

update public.notificacoes x
   set autor_nome = p.nome
  from public.profiles p
 where x.autor_id = p.user_id
   and x.autor_nome is distinct from p.nome;