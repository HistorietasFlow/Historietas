-- Corrige a permissão de edição da coluna avisos_conteudo em public.obras.
-- A página app/editar-obra/page.tsx atualiza essa coluna em toda edição,
-- mas a migration inicial de permissões não a incluiu entre as colunas editáveis.

begin;

do $$
begin
  if to_regclass('public.obras') is null then
    raise exception 'A tabela public.obras não existe.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'obras'
      and column_name = 'avisos_conteudo'
  ) then
    raise exception 'A coluna public.obras.avisos_conteudo não existe.';
  end if;
end
$$;

grant update (avisos_conteudo)
  on table public.obras
  to authenticated;

notify pgrst, 'reload schema';

commit;