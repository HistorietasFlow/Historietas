begin;

create or replace function public.sanitizar_notificacao_moderacao()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $$
begin
  if new.tipo = 'moderacao-denuncia' then
    new.autor_id := null;
    new.autor_nome := '';
    new.autor_avatar := '';
  end if;

  return new;
end;
$$;

revoke all on function public.sanitizar_notificacao_moderacao()
  from public, anon, authenticated;

drop trigger if exists sanitizar_notificacao_moderacao_trigger
  on public.notificacoes;

create trigger sanitizar_notificacao_moderacao_trigger
before insert or update
on public.notificacoes
for each row
when (new.tipo = 'moderacao-denuncia')
execute function public.sanitizar_notificacao_moderacao();

update public.notificacoes
set
  autor_id = null,
  autor_nome = '',
  autor_avatar = ''
where tipo = 'moderacao-denuncia'
  and (
    autor_id is not null
    or autor_nome <> ''
    or autor_avatar <> ''
  );

comment on function public.sanitizar_notificacao_moderacao() is
  'Remove identidade do moderador das notificacoes institucionais de moderacao antes de grava-las.';

commit;
