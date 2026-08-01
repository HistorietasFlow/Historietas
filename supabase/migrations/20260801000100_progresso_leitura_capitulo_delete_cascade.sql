-- 20260801000100_progresso_leitura_capitulo_delete_cascade.sql
-- Mantém o histórico de migrações alinhado com a correção aplicada no banco.
-- progresso_leitura exige capitulo_id preenchido; por isso ON DELETE SET NULL
-- era incompatível com a exclusão de capítulos. Os registros dependentes devem
-- ser removidos junto com o capítulo.

begin;

do $$
begin
  if to_regclass('public.progresso_leitura') is null then
    raise exception 'A tabela public.progresso_leitura não existe.';
  end if;

  if to_regclass('public.capitulos') is null then
    raise exception 'A tabela public.capitulos não existe.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'progresso_leitura'
      and column_name = 'capitulo_id'
  ) then
    raise exception 'A coluna public.progresso_leitura.capitulo_id não existe.';
  end if;
end
$$;

alter table public.progresso_leitura
  drop constraint if exists progresso_leitura_capitulo_id_fkey;

alter table public.progresso_leitura
  add constraint progresso_leitura_capitulo_id_fkey
  foreign key (capitulo_id)
  references public.capitulos(id)
  on delete cascade;

commit;
