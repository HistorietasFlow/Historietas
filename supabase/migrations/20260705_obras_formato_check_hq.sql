-- 20260705_obras_formato_check_hq.sql
-- Permite formato "HQ" na tabela obras.

begin;

alter table public.obras
drop constraint if exists obras_formato_check;

alter table public.obras
add constraint obras_formato_check
check (
  formato is null
  or (
    length(btrim(formato)) >= 2
    and length(btrim(formato)) <= 40
  )
);

commit;
