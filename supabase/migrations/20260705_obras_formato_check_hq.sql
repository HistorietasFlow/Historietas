-- 20260705_obras_formato_check_hq.sql
-- Permite formato "HQ" na tabela obras.
-- Versão auditada/corrigida:
-- - não quebra se a tabela public.obras não existir;
-- - limpa valores inválidos antes de recriar a constraint;
-- - permite qualquer formato textual entre 2 e 40 caracteres, incluindo "HQ".

begin;

do $$
begin
  if to_regclass('public.obras') is not null then
    -- Evita falha ao recriar a constraint caso existam valores antigos inválidos.
    update public.obras
    set formato = null
    where formato is not null
      and (
        length(btrim(formato)) < 2
        or length(btrim(formato)) > 40
      );

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
  end if;
end $$;

commit;