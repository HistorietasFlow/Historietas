begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';

-- Ranking Geral (Etapa 2). Nenhuma tabela, indice, policy ou RPC legada muda.
-- Um unico conjunto de avaliacoes: RLS sob role anon; "parcial" pode ser publico.
-- O cursor carrega apenas a identidade da ultima obra e a assinatura da
-- classificacao. Uma mudanca de nota, elegibilidade ou visibilidade o invalida.
create function public.listar_ranking_geral(
  p_apos_obra uuid default null,
  p_assinatura text default null,
  p_limite integer default 20
)
returns table (
  estado text,
  obra_id uuid,
  posicao bigint,
  nota_media numeric,
  total_avaliacoes bigint,
  pontuacao numeric,
  assinatura text,
  tem_mais boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $func$
#variable_conflict use_column
declare
  v_limite integer;
begin
  -- Nunca permitir que um contexto autenticado inclua registros pessoais.
  -- O consumidor server-only faz a chamada usando uma sessao anonima.
  if current_user <> 'anon' then
    raise exception using errcode = '42501',
      message = 'O Ranking Geral exige contexto anonimo.';
  end if;

  if p_limite is null or p_limite not between 1 and 50 then
    raise exception using errcode = '22023', message = 'Limite do Ranking Geral invalido.';
  end if;
  v_limite := p_limite;

  if (p_apos_obra is null) <> (p_assinatura is null) or
     (p_assinatura is not null and p_assinatura !~ '^[0-9a-f]{32}$') then
    raise exception using errcode = '22023', message = 'Cursor do Ranking Geral invalido.';
  end if;

  return query
  with
  obras_publicas as materialized (
    select obra.id, obra.user_id
    from public.obras as obra
    where obra.publicado is true
      and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
      and (
        coalesce(nullif(btrim(obra.arquivo_url), ''), '') <> ''
        or exists (
          select 1
          from public.capitulos as capitulo
          where capitulo.obra_id = obra.id
            and capitulo.publicado is true
        )
      )
  ),
  votos_publicos as materialized (
    select
      avaliacao.obra_id,
      count(*)::bigint as total,
      sum(avaliacao.nota)::numeric as soma
    from public.obra_avaliacoes as avaliacao
    join obras_publicas as obra on obra.id = avaliacao.obra_id
    where avaliacao.user_id <> obra.user_id
    group by avaliacao.obra_id
  ),
  calculadas as materialized (
    select
      votos.obra_id,
      votos.total as total_avaliacoes,
      votos.soma,
      (votos.soma / votos.total)::numeric as nota_media,
      ((votos.soma + 30::numeric) / (votos.total + 10)::numeric) as pontuacao
    from votos_publicos as votos
    where votos.total >= 1
  ),
  ordenadas as materialized (
    select
      calculadas.obra_id,
      calculadas.total_avaliacoes,
      calculadas.nota_media,
      calculadas.pontuacao,
      row_number() over (
        order by calculadas.pontuacao desc,
          calculadas.total_avaliacoes desc,
          calculadas.obra_id asc
      )::bigint as posicao
    from calculadas
  ),
  -- Candidato a protecao contra paginas obsoletas: medir custo em escala
  -- antes de aprovar esta estrategia como definitiva.
  identificacao as materialized (
    select md5(coalesce(string_agg(
      calculadas.obra_id::text || ':' ||
      calculadas.total_avaliacoes::text || ':' ||
      calculadas.soma::text,
      '|' order by calculadas.obra_id
    ), '')) as valor
    from calculadas
  ),
  cursor_atual as materialized (
    select
      identificacao.valor,
      coalesce((
        select ordenadas.posicao
        from ordenadas
        where ordenadas.obra_id = p_apos_obra
      ), 0::bigint) as apos_posicao,
      (
        p_apos_obra is null
        or (
          p_assinatura = identificacao.valor
          and exists (
            select 1 from ordenadas
            where ordenadas.obra_id = p_apos_obra
          )
        )
      ) as valido
    from identificacao
  ),
  proximas as materialized (
    select ordenadas.*
    from ordenadas
    cross join cursor_atual
    where cursor_atual.valido
      and ordenadas.posicao > cursor_atual.apos_posicao
    order by ordenadas.posicao
    limit (v_limite + 1)
  ),
  pagina as (
    select proximas.*,
      row_number() over (order by proximas.posicao) as numero_pagina
    from proximas
  ),
  saida as (
    select
      'ok'::text as estado,
      pagina.obra_id,
      pagina.posicao,
      pagina.nota_media,
      pagina.total_avaliacoes,
      pagina.pontuacao,
      cursor_atual.valor as assinatura,
      exists (select 1 from pagina as extra where extra.numero_pagina > v_limite) as tem_mais
    from pagina
    cross join cursor_atual
    where cursor_atual.valido
      and pagina.numero_pagina <= v_limite

    union all

    -- Sinal explicito: o cliente deve descartar paginas anteriores e recomecar.
    select
      'cursor_desatualizado'::text,
      null::uuid,
      null::bigint,
      null::numeric,
      null::bigint,
      null::numeric,
      cursor_atual.valor,
      false
    from cursor_atual
    where not cursor_atual.valido
  )
  select
    saida.estado, saida.obra_id, saida.posicao, saida.nota_media,
    saida.total_avaliacoes, saida.pontuacao, saida.assinatura, saida.tem_mais
  from saida
  order by saida.posicao asc nulls first;
end;
$func$;

revoke all on function public.listar_ranking_geral(uuid,text,integer)
  from public, anon, authenticated, service_role;
grant execute on function public.listar_ranking_geral(uuid,text,integer)
  to anon;

comment on function public.listar_ranking_geral(uuid,text,integer) is
  'Ranking Geral de qualidade, m=10 e C=3 provisório; soma e contagem das avaliações efetivamente visíveis a anon sob RLS. Paginação por posição e assinatura da classificação; obsoleto exige reiniciar. Não altera nota pública, Em Alta ou preferências.';

notify pgrst, 'reload schema';
commit;
