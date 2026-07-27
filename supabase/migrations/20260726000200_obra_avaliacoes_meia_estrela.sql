begin;

-- Remove validações antigas da coluna nota, caso tenham sido criadas
-- apenas para números inteiros.
do $$
declare
  restricao record;
begin
  for restricao in
    select conname
    from pg_constraint
    where conrelid = 'public.obra_avaliacoes'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%nota%'
  loop
    execute format(
      'alter table public.obra_avaliacoes drop constraint %I',
      restricao.conname
    );
  end loop;
end
$$;

-- Permite notas como 2.5, 3.5 e 4.5.
alter table public.obra_avaliacoes
  alter column nota type numeric(2,1)
  using nota::numeric(2,1);

-- Aceita somente notas de 0.5 até 5.0, em intervalos de meia estrela.
alter table public.obra_avaliacoes
  add constraint obra_avaliacoes_nota_meia_estrela_check
  check (
    nota >= 0.5
    and nota <= 5.0
    and nota * 2 = trunc(nota * 2)
  );

-- Mantém somente o registro mais recente de cada usuário por obra.
with avaliacoes_ordenadas as (
  select
    ctid,
    row_number() over (
      partition by obra_id, user_id
      order by criado_em desc nulls last, ctid desc
    ) as ordem
  from public.obra_avaliacoes
)
delete from public.obra_avaliacoes avaliacao
using avaliacoes_ordenadas duplicada
where avaliacao.ctid = duplicada.ctid
  and duplicada.ordem > 1;

-- Impede avaliações duplicadas para a mesma obra e usuário.
create unique index if not exists obra_avaliacoes_obra_user_unique
  on public.obra_avaliacoes (obra_id, user_id);

commit;