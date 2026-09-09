begin;

-- O catálogo público usa busca textual e paginação por cursor. A função é
-- SECURITY INVOKER para que as policies RLS continuem sendo a fonte de
-- verdade da visibilidade de obras, capítulos e interações.

alter table public.obras
add column if not exists busca_documento tsvector
generated always as (
  setweight(
    to_tsvector('portuguese'::regconfig, coalesce(titulo, '')),
    'A'
  )
  || setweight(
    to_tsvector('portuguese'::regconfig, coalesce(autor, '')),
    'A'
  )
  || setweight(
    to_tsvector('portuguese'::regconfig, coalesce(genero, '')),
    'B'
  )
  || setweight(
    to_tsvector('portuguese'::regconfig, coalesce(formato, '')),
    'B'
  )
  || setweight(
    to_tsvector('portuguese'::regconfig, coalesce(sinopse, '')),
    'C'
  )
) stored;

alter table public.capitulos
add column if not exists busca_documento tsvector
generated always as (
  setweight(
    to_tsvector('portuguese'::regconfig, coalesce(titulo, '')),
    'A'
  )
) stored;

create index if not exists obras_catalogo_publico_recente_idx
on public.obras (criada_em desc, id desc)
where publicado = true
  and classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+');

create index if not exists obras_catalogo_busca_idx
on public.obras using gin (busca_documento)
where publicado = true
  and classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+');

create index if not exists capitulos_catalogo_publicos_obra_idx
on public.capitulos (obra_id, criado_em desc, id desc)
where publicado = true;

create index if not exists capitulos_catalogo_busca_idx
on public.capitulos using gin (busca_documento)
where publicado = true;

create or replace function public.listar_obras_catalogo(
  p_busca text default '',
  p_genero text default '',
  p_formato text default '',
  p_classificacao text default '',
  p_filtro_capitulos text default 'todos',
  p_ordenacao text default 'relevancia',
  p_limite integer default 24,
  p_cursor_valor numeric default null,
  p_cursor_data timestamptz default null,
  p_cursor_id uuid default null
)
returns table (
  obra_id uuid,
  cursor_valor numeric,
  cursor_data timestamptz,
  cursor_id uuid,
  tem_mais boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_busca text := left(btrim(coalesce(p_busca, '')), 120);
  v_genero text := translate(
    lower(btrim(coalesce(p_genero, ''))),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn'
  );
  v_formato text := lower(btrim(coalesce(p_formato, '')));
  v_classificacao text := btrim(coalesce(p_classificacao, ''));
  v_filtro_capitulos text := lower(btrim(coalesce(p_filtro_capitulos, 'todos')));
  v_ordenacao text := lower(btrim(coalesce(p_ordenacao, 'relevancia')));
  v_limite integer := least(greatest(coalesce(p_limite, 24), 1), 50);
  v_consulta tsquery := case
    when v_busca = '' then null
    else websearch_to_tsquery('portuguese'::regconfig, v_busca)
  end;
begin
  if char_length(btrim(coalesce(p_busca, ''))) > 120 then
    raise exception using
      errcode = '22023',
      message = 'A busca do catálogo aceita no máximo 120 caracteres.';
  end if;

  if v_consulta is not null and numnode(v_consulta) = 0 then
    v_consulta := null;
  end if;

  if v_filtro_capitulos not in ('todos', 'com-capitulos', 'sem-capitulos') then
    raise exception using
      errcode = '22023',
      message = 'Filtro de capítulos inválido.';
  end if;

  if v_ordenacao not in (
    'relevancia',
    'geral',
    'lidas',
    'mais-curtidas',
    'curtidas',
    'mais-comentadas',
    'comentadas',
    'mais-salvas',
    'salvas',
    'mais-recentes',
    'recentes',
    'mais-capitulos',
    'capitulos'
  ) then
    raise exception using
      errcode = '22023',
      message = 'Ordenação do catálogo inválida.';
  end if;

  if (p_cursor_valor is null) <> (p_cursor_data is null)
     or (p_cursor_valor is null) <> (p_cursor_id is null) then
    raise exception using
      errcode = '22023',
      message = 'O cursor do catálogo está incompleto.';
  end if;

  return query
  with
  obras_filtradas as materialized (
    select obra.*
    from public.obras as obra
    where obra.publicado = true
      and obra.classificacao_indicativa in (
        'Livre',
        '10+',
        '12+',
        '14+',
        '16+'
      )
      and (
        nullif(v_genero, '') is null
        or translate(
          lower(obra.genero),
          'áàâãäéèêëíìîïóòôõöúùûüçñ',
          'aaaaaeeeeiiiiooooouuuucn'
        ) like ('%' || v_genero || '%')
        or (
          v_genero = 'ficcao'
          and (
            translate(
              lower(obra.genero),
              'áàâãäéèêëíìîïóòôõöúùûüçñ',
              'aaaaaeeeeiiiiooooouuuucn'
            ) like '%ficcao%'
            or lower(obra.genero) like '%sci-fi%'
            or lower(obra.genero) like '%sci fi%'
          )
        )
      )
      and (
        nullif(v_formato, '') is null
        or lower(obra.formato) = v_formato
      )
      and (
        nullif(v_classificacao, '') is null
        or obra.classificacao_indicativa = v_classificacao
      )
      and (
        coalesce(nullif(btrim(obra.arquivo_url), ''), '') <> ''
        or exists (
          select 1
          from public.capitulos as capitulo_publico
          where capitulo_publico.obra_id = obra.id
            and capitulo_publico.publicado = true
        )
      )
      and (
        v_consulta is null
        or obra.busca_documento @@ v_consulta
        or exists (
          select 1
          from unnest(obra.tags) as tag(valor)
          where to_tsvector(
            'portuguese'::regconfig,
            coalesce(tag.valor, '')
          ) @@ v_consulta
        )
        or exists (
          select 1
          from public.capitulos as capitulo_busca
          where capitulo_busca.obra_id = obra.id
            and capitulo_busca.publicado = true
            and capitulo_busca.busca_documento @@ v_consulta
        )
      )
  ),
  capitulos_agregados as materialized (
    select
      capitulo.obra_id,
      count(*)::bigint as total,
      max(capitulo.criado_em) as ultimo_criado_em,
      coalesce(
        max(ts_rank_cd(capitulo.busca_documento, v_consulta))
          filter (where v_consulta is not null),
        0
      )::numeric as relevancia_busca
    from public.capitulos as capitulo
    join obras_filtradas as obra on obra.id = capitulo.obra_id
    where capitulo.publicado = true
    group by capitulo.obra_id
  ),
  curtidas_agregadas as materialized (
    select interacao.obra_id, count(*)::bigint as total
    from public.obra_curtidas as interacao
    join obras_filtradas as obra on obra.id = interacao.obra_id
    group by interacao.obra_id
  ),
  comentarios_agregados as materialized (
    select interacao.obra_id, count(*)::bigint as total
    from public.comentarios_obras as interacao
    join obras_filtradas as obra on obra.id = interacao.obra_id
    group by interacao.obra_id
  ),
  salvadores_visiveis as materialized (
    select interacao.obra_id, interacao.user_id
    from public.seguindo_obras as interacao
    join obras_filtradas as obra on obra.id = interacao.obra_id

    union

    select interacao.obra_id, interacao.user_id
    from public.favoritos as interacao
    join obras_filtradas as obra on obra.id = interacao.obra_id

    union

    select capitulo.obra_id, interacao.user_id
    from public.salvos_capitulos as interacao
    join public.capitulos as capitulo on capitulo.id = interacao.capitulo_id
    join obras_filtradas as obra on obra.id = capitulo.obra_id
    where capitulo.publicado = true
  ),
  salvos_agregados as materialized (
    select interacao.obra_id, count(*)::bigint as total
    from salvadores_visiveis as interacao
    group by interacao.obra_id
  ),
  avaliacoes_agregadas as materialized (
    select
      interacao.obra_id,
      count(*)::bigint as total,
      avg(interacao.nota)::numeric as media
    from public.obra_avaliacoes as interacao
    join obras_filtradas as obra on obra.id = interacao.obra_id
    where interacao.user_id <> obra.user_id
    group by interacao.obra_id
  ),
  candidatos as materialized (
    select
      obra.id,
      obra.criada_em,
      coalesce(capitulo.total, 0)::bigint as total_capitulos,
      coalesce(curtida.total, 0)::bigint as total_curtidas,
      coalesce(comentario.total, 0)::bigint as total_comentarios,
      coalesce(salvo.total, 0)::bigint as total_salvos,
      greatest(coalesce(obra.visualizacoes, 0), 0)::bigint as total_visualizacoes,
      coalesce(avaliacao.total, 0)::bigint as total_avaliacoes,
      coalesce(avaliacao.media, 0)::numeric as media_avaliacoes,
      greatest(
        ts_rank_cd(obra.busca_documento, v_consulta),
        coalesce(capitulo.relevancia_busca, 0)
      )::numeric as relevancia_busca
    from obras_filtradas as obra
    left join capitulos_agregados as capitulo on capitulo.obra_id = obra.id
    left join curtidas_agregadas as curtida on curtida.obra_id = obra.id
    left join comentarios_agregados as comentario
      on comentario.obra_id = obra.id
    left join salvos_agregados as salvo on salvo.obra_id = obra.id
    left join avaliacoes_agregadas as avaliacao on avaliacao.obra_id = obra.id
    where (
      v_filtro_capitulos = 'todos'
      or (
        v_filtro_capitulos = 'com-capitulos'
        and coalesce(capitulo.total, 0) > 0
      )
      or (
        v_filtro_capitulos = 'sem-capitulos'
        and coalesce(capitulo.total, 0) = 0
      )
    )
  ),
  candidatos_ordenados as materialized (
    select
      candidato.*,
      case
        when v_ordenacao in ('mais-curtidas', 'curtidas')
          then candidato.total_curtidas::numeric
        when v_ordenacao in ('mais-comentadas', 'comentadas')
          then candidato.total_comentarios::numeric
        when v_ordenacao in ('mais-salvas', 'salvas')
          then candidato.total_salvos::numeric
        when v_ordenacao in ('lidas')
          then candidato.total_visualizacoes::numeric
        when v_ordenacao in ('mais-capitulos', 'capitulos')
          then candidato.total_capitulos::numeric
        when v_ordenacao = 'geral'
          then (
            candidato.total_curtidas * 2
            + candidato.total_comentarios * 3
            + candidato.total_salvos * 4
            + candidato.total_visualizacoes
            + candidato.total_avaliacoes * 4
            + round(candidato.media_avaliacoes * 4)
          )::numeric
        when v_ordenacao = 'relevancia' and v_consulta is not null
          then candidato.relevancia_busca
        else 0::numeric
      end as valor_ordenacao
    from candidatos as candidato
  ),
  depois_cursor as materialized (
    select candidato.*
    from candidatos_ordenados as candidato
    where p_cursor_valor is null
      or (
        candidato.valor_ordenacao,
        candidato.criada_em,
        candidato.id
      ) < (
        p_cursor_valor,
        p_cursor_data,
        p_cursor_id
      )
  ),
  pagina_com_excedente as materialized (
    select candidato.*
    from depois_cursor as candidato
    order by
      candidato.valor_ordenacao desc,
      candidato.criada_em desc,
      candidato.id desc
    limit v_limite + 1
  ),
  pagina as (
    select
      candidato.*,
      row_number() over (
        order by
          candidato.valor_ordenacao desc,
          candidato.criada_em desc,
          candidato.id desc
      ) as numero_linha,
      count(*) over () > v_limite as possui_excedente
    from pagina_com_excedente as candidato
  )
  select
    pagina.id,
    pagina.valor_ordenacao,
    pagina.criada_em,
    pagina.id,
    pagina.possui_excedente
  from pagina
  where pagina.numero_linha <= v_limite
  order by
    pagina.valor_ordenacao desc,
    pagina.criada_em desc,
    pagina.id desc;
end;
$$;

alter function public.listar_obras_catalogo(
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  numeric,
  timestamptz,
  uuid
) owner to postgres;

revoke all on function public.listar_obras_catalogo(
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  numeric,
  timestamptz,
  uuid
) from public;

grant execute on function public.listar_obras_catalogo(
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  numeric,
  timestamptz,
  uuid
) to anon, authenticated, service_role;

comment on function public.listar_obras_catalogo(
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  numeric,
  timestamptz,
  uuid
) is
  'Lista somente IDs de obras públicas com busca, filtros, ranking e paginação por cursor estável; respeita RLS por ser SECURITY INVOKER.';

do $$
declare
  v_funcao regprocedure := to_regprocedure(
    'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid)'
  );
begin
  if v_funcao is null then
    raise exception 'A RPC listar_obras_catalogo não foi criada.';
  end if;

  if exists (
    select 1
    from pg_proc as funcao
    where funcao.oid = v_funcao
      and funcao.prosecdef
  ) then
    raise exception 'listar_obras_catalogo não pode usar SECURITY DEFINER.';
  end if;

  if exists (
    select 1
    from pg_proc as funcao
    cross join lateral aclexplode(
      coalesce(funcao.proacl, acldefault('f', funcao.proowner))
    ) as permissao
    where funcao.oid = v_funcao
      and permissao.grantee = 0
      and permissao.privilege_type = 'EXECUTE'
  ) then
    raise exception 'PUBLIC não pode executar listar_obras_catalogo.';
  end if;

  if not has_function_privilege('anon', v_funcao, 'EXECUTE')
     or not has_function_privilege('authenticated', v_funcao, 'EXECUTE') then
    raise exception 'Os papéis da aplicação não conseguem executar listar_obras_catalogo.';
  end if;

  if not exists (
    select 1
    from pg_attribute as coluna
    where coluna.attrelid = 'public.obras'::regclass
      and coluna.attname = 'busca_documento'
      and coluna.attgenerated = 's'
  ) or not exists (
    select 1
    from pg_attribute as coluna
    where coluna.attrelid = 'public.capitulos'::regclass
      and coluna.attname = 'busca_documento'
      and coluna.attgenerated = 's'
  ) then
    raise exception 'As colunas geradas de busca do catálogo estão incompletas.';
  end if;

  if to_regclass('public.obras_catalogo_publico_recente_idx') is null
     or to_regclass('public.obras_catalogo_busca_idx') is null
     or to_regclass('public.capitulos_catalogo_publicos_obra_idx') is null
     or to_regclass('public.capitulos_catalogo_busca_idx') is null then
    raise exception 'Os índices do catálogo estão incompletos.';
  end if;
end;
$$;

commit;
