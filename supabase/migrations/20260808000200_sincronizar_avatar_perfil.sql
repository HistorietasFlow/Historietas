-- Mantém cópias denormalizadas do perfil sincronizadas com public.profiles.
-- public.profiles continua sendo a fonte principal.
-- Nome é sincronizado nas tabelas que armazenam autor_nome/autor.
-- Avatar é sincronizado em notificacoes.autor_avatar.

create or replace function public.sincronizar_nome_perfil_denormalizado()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.nome is not distinct from old.nome
     and new.avatar_url is not distinct from old.avatar_url then
    return new;
  end if;

  if new.nome is distinct from old.nome then
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
  end if;

  if new.avatar_url is distinct from old.avatar_url then
    update public.notificacoes
       set autor_avatar = new.avatar_url
     where autor_id = new.user_id
       and autor_avatar is distinct from new.avatar_url;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_profiles_sincronizar_nome_denormalizado
on public.profiles;

create trigger trigger_profiles_sincronizar_nome_denormalizado
after update of nome, avatar_url on public.profiles
for each row
execute function public.sincronizar_nome_perfil_denormalizado();

-- Corrige notificações já existentes para refletirem o perfil atual.

update public.notificacoes n
   set autor_nome = p.nome,
       autor_avatar = p.avatar_url
  from public.profiles p
 where n.autor_id = p.user_id
   and (
     n.autor_nome is distinct from p.nome
     or n.autor_avatar is distinct from p.avatar_url
   );