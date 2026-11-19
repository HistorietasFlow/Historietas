-- Proposta QA5. A instalação mantém as chamadas pela Data API bloqueadas.
begin;
set local lock_timeout = '5s';
set local search_path = pg_catalog;

do $pre$
begin
  if current_user <> 'postgres' then
    raise exception 'A migration do catálogo deve ser executada pelo papel postgres.';
  end if;
  if not has_schema_privilege('authenticated','previa_interno','USAGE')
    or not has_function_privilege('authenticated','previa_interno.sessao_atual_ativa()','EXECUTE') then
    raise exception 'Validador de sessão do catálogo indisponível.';
  end if;
end;
$pre$;

create function public.qa5_recomendar_obras_autorizadas(
  p_busca text, p_genero text, p_formato text, p_classificacao text,
  p_filtro_capitulos text, p_ordenacao text, p_limite integer,
  p_cursor_valor numeric, p_cursor_data timestamptz, p_cursor_id uuid, p_tag text
) returns table (obra_id uuid, cursor_valor numeric, cursor_data timestamptz, cursor_id uuid, tem_mais boolean, metadados jsonb)
language plpgsql stable security invoker set search_path = '' as $qa5$

#variable_conflict use_column
declare

  v_tag text := btrim(regexp_replace(translate(lower(coalesce(p_tag, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
    E'[ \\t\\r\\n\\f\\v]+', ' ', 'g'));
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
  v_autores_busca uuid[] := '{}'::uuid[];

  v_consulta tsquery := case
    when v_busca = '' then null
    else websearch_to_tsquery('portuguese'::regconfig, v_busca)
  end;
begin
  if current_user = 'authenticated' then
    if auth.uid() is null
       or not coalesce(
         case
           when pg_catalog.jsonb_typeof((select auth.jwt() -> 'exp')) = 'number'
           then ((select auth.jwt() ->> 'exp'))::numeric
             > extract(epoch from pg_catalog.statement_timestamp())
           else false
         end, false)
       or not previa_interno.sessao_atual_ativa() then
      raise sqlstate 'PT401' using message = 'Sessão inválida.';
    end if;
  elsif current_user <> 'anon' then
    raise insufficient_privilege using message = 'Papel não habilitado para recomendações.';
  end if;
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


  if v_consulta is not null then
    select coalesce(array_agg(distinct perfil_autor.user_id), '{}'::uuid[])
    into v_autores_busca
    from public.profiles_publicos as perfil_autor
    where perfil_autor.tipo = 'autor'
      and strpos(
        regexp_replace(
          translate(
            lower(coalesce(perfil_autor.nome, '')),
            'áàâãäéèêëíìîïóòôõöúùûüçñ',
            'aaaaaeeeeiiiiooooouuuucn'
          ),
          '\s+',
          ' ',
          'g'
        ),
        regexp_replace(
          translate(
            lower(v_busca),
            'áàâãäéèêëíìîïóòôõöúùûüçñ',
            'aaaaaeeeeiiiiooooouuuucn'
          ),
          '\s+',
          ' ',
          'g'
        )
      ) > 0;
  end if;


  if char_length(v_tag) > 90 then
    raise exception using errcode = '22023', message = 'A tag aceita no máximo 90 caracteres.';
  end if;
  -- Para data sem texto de busca, o índice já fornece a ordem. Alcançar
  -- o limite só depois de verificar as regras de visibilidade e legibilidade.
  if v_ordenacao in ('recentes', 'mais-recentes')
     and v_filtro_capitulos = 'todos'
     and v_consulta is null then
    return query
    with pagina_com_excedente as materialized (
      select obra.*
      from public.obras as obra
      where obra.publicado = true
        and (v_tag = '' or exists (
          select 1 from unnest(obra.tags) as tag(valor)
          where btrim(regexp_replace(translate(lower(coalesce(tag.valor, '')),
            'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
            E'[ \\t\\r\\n\\f\\v]+', ' ', 'g')) = v_tag
        ))
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
          p_cursor_valor is null
          or p_cursor_valor > 0
          or (p_cursor_valor = 0 and (obra.criada_em, obra.id) < (p_cursor_data, p_cursor_id))
        )
        and public.usuario_pode_ver_perfil(obra.user_id)
        and (
          obra.user_id = (select auth.uid())
          or case public.carregar_preferencias_privacidade_publicas(obra.user_id)
                 ->> 'visibilidade_obras'
            when 'publico' then true
            when 'seguidores' then public.usuario_pode_ver_aba_perfil(obra.user_id, 'seguidores')
            when 'seguindo' then public.usuario_pode_ver_aba_perfil(obra.user_id, 'seguindo')
            else false
          end
        )
      order by obra.criada_em desc, obra.id desc
      limit v_limite + 1
    )
    select obra.id, 0::numeric, obra.criada_em, obra.id,
      count(*) over () > v_limite,
      pg_catalog.jsonb_build_object(
        'id', obra.id, 'user_id', obra.user_id, 'titulo', obra.titulo,
        'autor', obra.autor, 'genero', obra.genero, 'formato', obra.formato,
        'classificacao_indicativa', obra.classificacao_indicativa,
        'avisos_conteudo', obra.avisos_conteudo, 'sinopse', obra.sinopse,
        'tags', obra.tags, 'slug', obra.slug, 'criada_em', obra.criada_em,
        'publicado', obra.publicado,
        'visualizacoes', greatest(coalesce(obra.visualizacoes, 0), 0)::bigint,
        'total_capitulos', (
          select count(*)
          from public.capitulos as capitulo
          where capitulo.obra_id = obra.id and capitulo.publicado = true
        ),
        'possui_arquivo', nullif(pg_catalog.btrim(obra.arquivo_url), '') is not null
      )
    from pagina_com_excedente as obra
    order by obra.criada_em desc, obra.id desc
    limit v_limite;
    return;
  end if;

  return query

  with
  obras_pre_filtradas as materialized (
    select obra.*
    from public.obras as obra

    where obra.publicado = true
      and (v_tag = '' or exists (
        select 1 from unnest(obra.tags) as tag(valor)
        where btrim(regexp_replace(translate(lower(coalesce(tag.valor, '')),
          'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
          E'[ \\t\\r\\n\\f\\v]+', ' ', 'g')) = v_tag
      ))
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
        or obra.user_id = any(v_autores_busca)

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
  contexto_leitor as materialized (
    select auth.uid() as user_id
  ),
  relacoes_leitor as materialized (
    select relacao.seguidor_id, relacao.seguido_id
    from public.seguindo_usuarios as relacao
    where relacao.seguidor_id = (select user_id from contexto_leitor)
      or relacao.seguido_id = (select user_id from contexto_leitor)
  ),
  regras_autores as materialized (
    select autores.user_id,
      public.carregar_preferencias_privacidade_publicas(autores.user_id) as regras
    from (select distinct user_id from obras_pre_filtradas) as autores
  ),
  autores_autorizados as materialized (
    select regras.user_id
    from regras_autores as regras
    where public.usuario_pode_ver_perfil(regras.user_id)
      and (
        regras.user_id = (select user_id from contexto_leitor)
        or regras.regras ->> 'visibilidade_obras' = 'publico'
        or (regras.regras ->> 'visibilidade_obras' = 'seguidores'
          and exists (select 1 from relacoes_leitor as relacao
            where relacao.seguidor_id = (select user_id from contexto_leitor)
              and relacao.seguido_id = regras.user_id))
        or (regras.regras ->> 'visibilidade_obras' = 'seguindo'
          and exists (select 1 from relacoes_leitor as relacao
            where relacao.seguidor_id = regras.user_id
              and relacao.seguido_id = (select user_id from contexto_leitor)))
      )
  ),
  obras_filtradas as materialized (
    select obra.* from obras_pre_filtradas as obra
    join autores_autorizados as autor on autor.user_id = obra.user_id
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
    pagina.possui_excedente,
    pg_catalog.jsonb_build_object(
      'id', obra.id, 'user_id', obra.user_id, 'titulo', obra.titulo,
      'autor', obra.autor, 'genero', obra.genero, 'formato', obra.formato,
      'classificacao_indicativa', obra.classificacao_indicativa,
      'avisos_conteudo', obra.avisos_conteudo, 'sinopse', obra.sinopse,
      'tags', obra.tags, 'slug', obra.slug, 'criada_em', obra.criada_em,
      'publicado', obra.publicado,
      'visualizacoes', pagina.total_visualizacoes,
      'total_capitulos', pagina.total_capitulos,
      'possui_arquivo', nullif(pg_catalog.btrim(obra.arquivo_url), '') is not null
    )
  from pagina
  join obras_filtradas as obra on obra.id = pagina.id
  where pagina.numero_linha <= v_limite
  order by
    pagina.valor_ordenacao desc,
    pagina.criada_em desc,
    pagina.id desc;
end;

$qa5$;
alter function public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text) owner to postgres;
revoke all on function public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text) from public,anon,authenticated,service_role;
do $acl$
declare
  rpc oid := 'public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure;
begin
  if not exists (
    select from pg_proc
    where oid=rpc and proowner='postgres'::regrole and not prosecdef and provolatile='s'
      and proconfig=array['search_path=""']
  ) or exists (
    select from pg_proc f
    cross join lateral aclexplode(coalesce(f.proacl,acldefault('f',f.proowner))) acl
    where f.oid=rpc and acl.grantee<>f.proowner
  ) or exists (
    select from unnest(array['anon','authenticated','service_role','authenticator']) papel
    where has_function_privilege(papel,rpc,'EXECUTE')
  ) then
    raise exception 'Proprietário, contexto ou privilégios inesperados no catálogo de recomendações.';
  end if;
end;
$acl$;

notify pgrst, 'reload schema';
commit;
