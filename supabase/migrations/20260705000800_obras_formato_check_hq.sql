-- 20260705_obras_formato_check_hq.sql
-- Permite o formato "HQ" na tabela public.obras.
-- Mantém qualquer formato textual entre 2 e 40 caracteres.

begin;

do $$
begin
  if to_regclass('public.obras') is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'obras'
      and column_name = 'formato'
  ) then
    return;
  end if;

  -- Normaliza espaços externos e remove valores vazios ou inválidos antes
  -- de recriar a constraint.
  update public.obras
  set formato = nullif(btrim(formato), '')
  where formato is distinct from nullif(btrim(formato), '');

  update public.obras
  set formato = null
  where formato is not null
    and char_length(formato) not between 2 and 40;

  alter table public.obras
    drop constraint if exists obras_formato_check;

  alter table public.obras
    add constraint obras_formato_check
    check (
      formato is null
      or char_length(btrim(formato)) between 2 and 40
    );
end
$$;

commit;