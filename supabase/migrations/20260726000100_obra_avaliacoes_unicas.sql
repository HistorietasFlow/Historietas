-- Mantém somente a avaliação mais recente de cada usuário por obra.
-- Depois cria a restrição necessária para impedir novas duplicidades.

with avaliacoes_ordenadas as (
  select
    ctid,
    row_number() over (
      partition by obra_id, user_id
      order by
        coalesce(atualizado_em, criado_em) desc nulls last,
        ctid desc
    ) as ordem
  from public.obra_avaliacoes
)
delete from public.obra_avaliacoes avaliacao
using avaliacoes_ordenadas duplicada
where avaliacao.ctid = duplicada.ctid
  and duplicada.ordem > 1;

create unique index if not exists obra_avaliacoes_obra_user_unique
  on public.obra_avaliacoes (obra_id, user_id);