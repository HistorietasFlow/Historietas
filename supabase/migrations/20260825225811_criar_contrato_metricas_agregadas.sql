-- Centraliza as metricas de obras, capitulos e autores em uma unica RPC.
-- A RPC publica e SECURITY INVOKER. Os helpers SECURITY DEFINER reproduzem em
-- lote as policies canonicas e preservam o auth.uid() do chamador; isso evita
-- a avaliacao correlacionada da RLS para cada linha sem ampliar visibilidade.

create index if not exists favoritos_obra_id_idx
on public.favoritos (obra_id);

create index if not exists concluidas_obra_id_idx
on public.concluidas (obra_id);

create index if not exists comunidade_posts_obra_tipo_idx
on public.comunidade_posts (obra_relacionada, tipo_publicacao)
where obra_relacionada <> '';

create index if not exists curtidas_capitulos_obra_id_idx
on public.curtidas_capitulos (obra_id);

create index if not exists comentarios_capitulos_obra_id_idx
on public.comentarios_capitulos (obra_id);

create index if not exists salvos_capitulos_obra_id_idx
on public.salvos_capitulos (obra_id);

-- progresso_leitura nao concede SELECT ao papel anon. Este helper com dono
-- privilegiado consulta exclusivamente o proprio auth.uid(); assim a RPC
-- publica continua funcionando sem ampliar o acesso direto a tabela privada.
create or replace function historietas_privado.obter_progresso_metricas_usuario(
  p_obra_ids uuid[] default '{}'::uuid[],
  p_capitulo_ids uuid[] default '{}'::uuid[]
)
returns table (
  obra_id uuid,
  capitulo_id uuid,
  lido_em timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if cardinality(coalesce(p_obra_ids, '{}'::uuid[])) > 100 then
    raise exception using
      errcode = '22023',
      message = 'O helper de metricas aceita no maximo 100 obras por chamada.';
  end if;

  if cardinality(coalesce(p_capitulo_ids, '{}'::uuid[])) > 600 then
    raise exception using
      errcode = '22023',
      message = 'O helper de metricas aceita no maximo 600 capitulos por chamada.';
  end if;

  return query
  select
    progresso.obra_id,
    progresso.capitulo_id,
    max(progresso.atualizado_em) as lido_em
  from public.progresso_leitura as progresso
  where (select auth.uid()) is not null
    and progresso.user_id = (select auth.uid())
    and progresso.lido = true
    and (
      progresso.obra_id = any(coalesce(p_obra_ids, '{}'::uuid[]))
      or progresso.capitulo_id = any(coalesce(p_capitulo_ids, '{}'::uuid[]))
    )
  group by progresso.obra_id, progresso.capitulo_id;
end;
$$;

alter function historietas_privado.obter_progresso_metricas_usuario(
  uuid[],
  uuid[]
) owner to postgres;

revoke all on function historietas_privado.obter_progresso_metricas_usuario(
  uuid[],
  uuid[]
) from public, anon, authenticated, service_role;

grant execute on function historietas_privado.obter_progresso_metricas_usuario(
  uuid[],
  uuid[]
) to anon, authenticated, service_role;

comment on function historietas_privado.obter_progresso_metricas_usuario(
  uuid[],
  uuid[]
) is
  'Retorna somente o progresso lido pertencente ao auth.uid() atual para compor o contrato de metricas.';

-- Seleciona obras e capitulos em lote com as mesmas condicoes das policies
-- SELECT. Isso evita que a policy de capitulos execute um EXISTS por linha.
create or replace function historietas_privado.obter_conteudos_metricas(
  p_obra_ids uuid[] default '{}'::uuid[],
  p_capitulo_ids uuid[] default '{}'::uuid[]
)
returns table (
  tipo_conteudo text,
  conteudo_id uuid,
  obra_id uuid,
  user_id uuid,
  titulo text,
  visualizacoes bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := (select auth.uid());
begin
  if cardinality(coalesce(p_obra_ids, '{}'::uuid[])) > 100 then
    raise exception using
      errcode = '22023',
      message = 'O helper de metricas aceita no maximo 100 obras por chamada.';
  end if;

  if cardinality(coalesce(p_capitulo_ids, '{}'::uuid[])) > 600 then
    raise exception using
      errcode = '22023',
      message = 'O helper de metricas aceita no maximo 600 capitulos por chamada.';
  end if;

  return query
  with ids_obras_alvo as materialized (
    select solicitado.id
    from unnest(coalesce(p_obra_ids, '{}'::uuid[])) as solicitado(id)
    where solicitado.id is not null

    union

    select capitulo.obra_id
    from public.capitulos as capitulo
    where capitulo.id = any(coalesce(p_capitulo_ids, '{}'::uuid[]))
  ),
  obras_permitidas as materialized (
    select
      obra.id,
      obra.user_id,
      obra.titulo,
      obra.visualizacoes,
      obra.publicado
    from public.obras as obra
    join ids_obras_alvo as alvo on alvo.id = obra.id
    where (
      v_usuario_id is not null
      and obra.user_id = v_usuario_id
    )
    or (
      coalesce(obra.publicado, false) = true
      and obra.classificacao_indicativa in (
        'Livre',
        '10+',
        '12+',
        '14+',
        '16+'
      )
    )
  ),
  capitulos_permitidos as materialized (
    select
      capitulo.id,
      capitulo.obra_id,
      capitulo.user_id,
      capitulo.visualizacoes
    from public.capitulos as capitulo
    join obras_permitidas as obra on obra.id = capitulo.obra_id
    where (
      capitulo.obra_id = any(coalesce(p_obra_ids, '{}'::uuid[]))
      or capitulo.id = any(coalesce(p_capitulo_ids, '{}'::uuid[]))
    )
      and (
        obra.user_id = v_usuario_id
        or (
          capitulo.user_id = obra.user_id
          and coalesce(capitulo.publicado, false) = true
          and coalesce(obra.publicado, false) = true
        )
      )
  )
  select
    'obra'::text,
    obra.id,
    obra.id,
    obra.user_id,
    obra.titulo,
    greatest(coalesce(obra.visualizacoes, 0), 0)::bigint
  from obras_permitidas as obra
  where obra.id = any(coalesce(p_obra_ids, '{}'::uuid[]))

  union all

  select
    'capitulo',
    capitulo.id,
    capitulo.obra_id,
    capitulo.user_id,
    null::text,
    greatest(coalesce(capitulo.visualizacoes, 0), 0)::bigint
  from capitulos_permitidos as capitulo;
end;
$$;

alter function historietas_privado.obter_conteudos_metricas(uuid[], uuid[])
owner to postgres;

revoke all on function historietas_privado.obter_conteudos_metricas(
  uuid[],
  uuid[]
) from public, anon, authenticated, service_role;

grant execute on function historietas_privado.obter_conteudos_metricas(
  uuid[],
  uuid[]
) to anon, authenticated, service_role;

comment on function historietas_privado.obter_conteudos_metricas(
  uuid[],
  uuid[]
) is
  'Reproduz em lote as policies SELECT de obras e capitulos solicitados sem expor conteudo fora da RLS.';

-- As policies da Biblioteca consultam preferencias, relacoes e bloqueios. Em
-- uma agregacao grande, repetir essas consultas para cada interacao seria
-- muito caro. Este helper agrupa primeiro os mesmos trios
-- (usuario, visibilidade, categoria) e reutiliza a funcao de autorizacao
-- canonica, sem alterar a semantica de privacidade.
create or replace function historietas_privado.obter_interacoes_biblioteca_metricas(
  p_obra_ids uuid[] default '{}'::uuid[],
  p_capitulo_ids uuid[] default '{}'::uuid[]
)
returns table (
  tipo_interacao text,
  obra_id uuid,
  capitulo_id uuid,
  user_id uuid,
  nota numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if cardinality(coalesce(p_obra_ids, '{}'::uuid[])) > 100 then
    raise exception using
      errcode = '22023',
      message = 'O helper de metricas aceita no maximo 100 obras por chamada.';
  end if;

  if cardinality(coalesce(p_capitulo_ids, '{}'::uuid[])) > 600 then
    raise exception using
      errcode = '22023',
      message = 'O helper de metricas aceita no maximo 600 capitulos por chamada.';
  end if;

  return query
  with candidatos as materialized (
    select
      'seguindo_obra'::text as tipo_interacao,
      interacao.obra_id,
      null::uuid as capitulo_id,
      interacao.user_id,
      interacao.visibilidade,
      'seguindo_obras'::text as categoria,
      null::numeric as nota
    from public.seguindo_obras as interacao
    where interacao.obra_id = any(coalesce(p_obra_ids, '{}'::uuid[]))

    union all

    select
      'favorito',
      interacao.obra_id,
      null::uuid,
      interacao.user_id,
      interacao.visibilidade,
      'favoritos',
      null::numeric
    from public.favoritos as interacao
    where interacao.obra_id = any(coalesce(p_obra_ids, '{}'::uuid[]))

    union all

    select
      'concluida',
      interacao.obra_id,
      null::uuid,
      interacao.user_id,
      interacao.visibilidade,
      'concluidas',
      null::numeric
    from public.concluidas as interacao
    where interacao.obra_id = any(coalesce(p_obra_ids, '{}'::uuid[]))

    union all

    select
      'avaliacao_obra',
      interacao.obra_id,
      null::uuid,
      interacao.user_id,
      interacao.visibilidade,
      'obra_avaliacoes',
      interacao.nota::numeric
    from public.obra_avaliacoes as interacao
    where interacao.obra_id = any(coalesce(p_obra_ids, '{}'::uuid[]))

    union all

    select
      'salvo_capitulo',
      interacao.obra_id,
      interacao.capitulo_id,
      interacao.user_id,
      'parcial'::text,
      'salvos_capitulos',
      null::numeric
    from public.salvos_capitulos as interacao
    where interacao.obra_id = any(coalesce(p_obra_ids, '{}'::uuid[]))
       or interacao.capitulo_id = any(
         coalesce(p_capitulo_ids, '{}'::uuid[])
       )
  ),
  permissoes as materialized (
    select
      chave.user_id,
      chave.visibilidade,
      chave.categoria,
      historietas_privado.usuario_pode_ver_registro_biblioteca(
        chave.user_id,
        chave.visibilidade,
        chave.categoria
      ) as permitido
    from (
      select distinct
        candidato.user_id,
        candidato.visibilidade,
        candidato.categoria
      from candidatos as candidato
    ) as chave
  )
  select
    candidato.tipo_interacao,
    candidato.obra_id,
    candidato.capitulo_id,
    candidato.user_id,
    candidato.nota
  from candidatos as candidato
  join permissoes as permissao
    on permissao.user_id = candidato.user_id
   and permissao.visibilidade = candidato.visibilidade
   and permissao.categoria = candidato.categoria
  where permissao.permitido;
end;
$$;

alter function historietas_privado.obter_interacoes_biblioteca_metricas(
  uuid[],
  uuid[]
) owner to postgres;

revoke all on function historietas_privado.obter_interacoes_biblioteca_metricas(
  uuid[],
  uuid[]
) from public, anon, authenticated, service_role;

grant execute on function historietas_privado.obter_interacoes_biblioteca_metricas(
  uuid[],
  uuid[]
) to anon, authenticated, service_role;

comment on function historietas_privado.obter_interacoes_biblioteca_metricas(
  uuid[],
  uuid[]
) is
  'Retorna apenas interacoes da Biblioteca que a policy canonica permite ao auth.uid() atual, avaliando cada combinacao de privacidade uma unica vez.';

-- Curtidas e comentarios usam policies baseadas na visibilidade do conteudo.
-- Esta versao set-based reproduz essas condicoes uma vez por obra/capitulo, em
-- vez de executar os EXISTS da policy para cada linha de interacao.
create or replace function historietas_privado.obter_interacoes_conteudo_metricas(
  p_obra_ids uuid[] default '{}'::uuid[],
  p_capitulo_ids uuid[] default '{}'::uuid[]
)
returns table (
  tipo_interacao text,
  obra_id uuid,
  capitulo_id uuid,
  user_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_usuario_admin boolean := coalesce(public.usuario_e_admin(), false);
begin
  if cardinality(coalesce(p_obra_ids, '{}'::uuid[])) > 100 then
    raise exception using
      errcode = '22023',
      message = 'O helper de metricas aceita no maximo 100 obras por chamada.';
  end if;

  if cardinality(coalesce(p_capitulo_ids, '{}'::uuid[])) > 600 then
    raise exception using
      errcode = '22023',
      message = 'O helper de metricas aceita no maximo 600 capitulos por chamada.';
  end if;

  return query
  with obras_permitidas as materialized (
    select obra.id
    from public.obras as obra
    where obra.id = any(coalesce(p_obra_ids, '{}'::uuid[]))
      and (
        obra.user_id = v_usuario_id
        or (
          coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
  ),
  capitulos_alvo as materialized (
    select
      capitulo.id,
      capitulo.obra_id,
      (
        obra.user_id = v_usuario_id
        or (
          capitulo.user_id = obra.user_id
          and coalesce(capitulo.publicado, false) = true
          and coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      ) as interacao_permitida
    from public.capitulos as capitulo
    join public.obras as obra on obra.id = capitulo.obra_id
    where capitulo.obra_id = any(coalesce(p_obra_ids, '{}'::uuid[]))
       or capitulo.id = any(coalesce(p_capitulo_ids, '{}'::uuid[]))
  )
  select
    'curtida_obra'::text,
    interacao.obra_id,
    null::uuid,
    interacao.user_id
  from public.obra_curtidas as interacao
  join obras_permitidas as obra on obra.id = interacao.obra_id

  union all

  select
    'comentario_obra',
    interacao.obra_id,
    null::uuid,
    interacao.user_id
  from public.comentarios_obras as interacao
  join obras_permitidas as obra on obra.id = interacao.obra_id

  union all

  select
    'curtida_capitulo',
    capitulo.obra_id,
    interacao.capitulo_id,
    interacao.user_id
  from public.curtidas_capitulos as interacao
  join capitulos_alvo as capitulo on capitulo.id = interacao.capitulo_id
  where capitulo.interacao_permitida

  union all

  select
    'comentario_capitulo',
    capitulo.obra_id,
    interacao.capitulo_id,
    interacao.user_id
  from public.comentarios_capitulos as interacao
  join capitulos_alvo as capitulo on capitulo.id = interacao.capitulo_id
  where capitulo.interacao_permitida or v_usuario_admin;
end;
$$;

alter function historietas_privado.obter_interacoes_conteudo_metricas(
  uuid[],
  uuid[]
) owner to postgres;

revoke all on function historietas_privado.obter_interacoes_conteudo_metricas(
  uuid[],
  uuid[]
) from public, anon, authenticated, service_role;

grant execute on function historietas_privado.obter_interacoes_conteudo_metricas(
  uuid[],
  uuid[]
) to anon, authenticated, service_role;

comment on function historietas_privado.obter_interacoes_conteudo_metricas(
  uuid[],
  uuid[]
) is
  'Reproduz em lote as policies SELECT de curtidas e comentarios para as obras e capitulos solicitados.';

create or replace function public.obter_metricas_conteudos(
  p_obra_ids uuid[] default '{}'::uuid[],
  p_capitulo_ids uuid[] default '{}'::uuid[],
  p_autor_ids uuid[] default '{}'::uuid[]
)
returns table (
  contrato_versao integer,
  tipo_conteudo text,
  conteudo_id uuid,
  obra_id uuid,
  visualizacoes bigint,
  curtidas bigint,
  comentarios bigint,
  salvos bigint,
  seguidores bigint,
  favoritos bigint,
  concluidas bigint,
  curtidores_unicos bigint,
  comentaristas_unicos bigint,
  salvadores_unicos bigint,
  avaliacao_media numeric,
  avaliacoes bigint,
  teorias bigint,
  reviews bigint,
  posts bigint,
  curtido_por_mim boolean,
  salvo_por_mim boolean,
  seguido_por_mim boolean,
  favorito_por_mim boolean,
  concluido_por_mim boolean,
  lido_por_mim boolean,
  lido_em timestamptz,
  minha_avaliacao numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_usuario_id uuid := (select auth.uid());
begin
  if cardinality(coalesce(p_obra_ids, '{}'::uuid[])) > 100 then
    raise exception using
      errcode = '22023',
      message = 'O contrato de metricas aceita no maximo 100 obras por chamada.';
  end if;

  if cardinality(coalesce(p_capitulo_ids, '{}'::uuid[])) > 600 then
    raise exception using
      errcode = '22023',
      message = 'O contrato de metricas aceita no maximo 600 capitulos por chamada.';
  end if;

  if cardinality(coalesce(p_autor_ids, '{}'::uuid[])) > 100 then
    raise exception using
      errcode = '22023',
      message = 'O contrato de metricas aceita no maximo 100 autores por chamada.';
  end if;

  return query
  with
  ids_obras as materialized (
    select distinct solicitado.id
    from unnest(coalesce(p_obra_ids, '{}'::uuid[])) as solicitado(id)
    where solicitado.id is not null
  ),
  ids_capitulos as materialized (
    select distinct solicitado.id
    from unnest(coalesce(p_capitulo_ids, '{}'::uuid[])) as solicitado(id)
    where solicitado.id is not null
  ),
  ids_autores as materialized (
    select distinct solicitado.id
    from unnest(coalesce(p_autor_ids, '{}'::uuid[])) as solicitado(id)
    where solicitado.id is not null
  ),
  conteudos_visiveis as materialized (
    select
      conteudo.tipo_conteudo,
      conteudo.conteudo_id,
      conteudo.obra_id,
      conteudo.user_id,
      conteudo.titulo,
      conteudo.visualizacoes
    from historietas_privado.obter_conteudos_metricas(
      p_obra_ids,
      p_capitulo_ids
    ) as conteudo
  ),
  obras_solicitadas as materialized (
    select
      conteudo.conteudo_id as id,
      conteudo.user_id,
      conteudo.titulo,
      conteudo.visualizacoes
    from conteudos_visiveis as conteudo
    join ids_obras as solicitado on solicitado.id = conteudo.conteudo_id
    where conteudo.tipo_conteudo = 'obra'
  ),
  capitulos_das_obras as materialized (
    select conteudo.conteudo_id as id, conteudo.obra_id
    from conteudos_visiveis as conteudo
    join obras_solicitadas as obra on obra.id = conteudo.obra_id
    where conteudo.tipo_conteudo = 'capitulo'
  ),
  capitulos_solicitados as materialized (
    select
      conteudo.conteudo_id as id,
      conteudo.obra_id,
      conteudo.visualizacoes
    from conteudos_visiveis as conteudo
    join ids_capitulos as solicitado
      on solicitado.id = conteudo.conteudo_id
    where conteudo.tipo_conteudo = 'capitulo'
  ),
  capitulos_relevantes as materialized (
    select capitulo.id, capitulo.obra_id
    from capitulos_das_obras as capitulo
    union
    select capitulo.id, capitulo.obra_id
    from capitulos_solicitados as capitulo
  ),
  progresso_usuario as materialized (
    select progresso.obra_id, progresso.capitulo_id, progresso.lido_em
    from historietas_privado.obter_progresso_metricas_usuario(
      p_obra_ids,
      p_capitulo_ids
    ) as progresso
  ),
  interacoes_biblioteca as materialized (
    select
      interacao.tipo_interacao,
      interacao.obra_id,
      interacao.capitulo_id,
      interacao.user_id,
      interacao.nota
    from historietas_privado.obter_interacoes_biblioteca_metricas(
      p_obra_ids,
      p_capitulo_ids
    ) as interacao
  ),
  interacoes_conteudo as materialized (
    select
      interacao.tipo_interacao,
      interacao.obra_id,
      interacao.capitulo_id,
      interacao.user_id
    from historietas_privado.obter_interacoes_conteudo_metricas(
      p_obra_ids,
      p_capitulo_ids
    ) as interacao
  ),
  linhas_curtidas_obras as materialized (
    select interacao.obra_id, interacao.user_id
    from interacoes_conteudo as interacao
    join obras_solicitadas as obra on obra.id = interacao.obra_id
    where interacao.tipo_interacao = 'curtida_obra'
  ),
  linhas_comentarios_obras as materialized (
    select interacao.obra_id, interacao.user_id
    from interacoes_conteudo as interacao
    join obras_solicitadas as obra on obra.id = interacao.obra_id
    where interacao.tipo_interacao = 'comentario_obra'
  ),
  linhas_seguidores_obras as materialized (
    select interacao.obra_id, interacao.user_id
    from interacoes_biblioteca as interacao
    join obras_solicitadas as obra on obra.id = interacao.obra_id
    where interacao.tipo_interacao = 'seguindo_obra'
  ),
  linhas_favoritos_obras as materialized (
    select interacao.obra_id, interacao.user_id
    from interacoes_biblioteca as interacao
    join obras_solicitadas as obra on obra.id = interacao.obra_id
    where interacao.tipo_interacao = 'favorito'
  ),
  linhas_concluidas_obras as materialized (
    select interacao.obra_id, interacao.user_id
    from interacoes_biblioteca as interacao
    join obras_solicitadas as obra on obra.id = interacao.obra_id
    where interacao.tipo_interacao = 'concluida'
  ),
  linhas_avaliacoes_obras as materialized (
    select
      avaliacao.obra_id,
      avaliacao.user_id,
      avaliacao.nota,
      obra.user_id as autor_id
    from interacoes_biblioteca as avaliacao
    join obras_solicitadas as obra on obra.id = avaliacao.obra_id
    where avaliacao.tipo_interacao = 'avaliacao_obra'
  ),
  linhas_comunidade_obras as materialized (
    select obra.id as obra_id, publicacao.tipo_publicacao
    from obras_solicitadas as obra
    join public.comunidade_posts as publicacao
      on publicacao.obra_relacionada = obra.titulo
  ),
  linhas_curtidas_capitulos as materialized (
    select
      interacao.capitulo_id,
      capitulo.obra_id,
      interacao.user_id
    from interacoes_conteudo as interacao
    join capitulos_relevantes as capitulo
      on capitulo.id = interacao.capitulo_id
    where interacao.tipo_interacao = 'curtida_capitulo'
  ),
  linhas_comentarios_capitulos as materialized (
    select
      interacao.capitulo_id,
      capitulo.obra_id,
      interacao.user_id
    from interacoes_conteudo as interacao
    join capitulos_relevantes as capitulo
      on capitulo.id = interacao.capitulo_id
    where interacao.tipo_interacao = 'comentario_capitulo'
  ),
  linhas_salvos_capitulos as materialized (
    select
      interacao.capitulo_id,
      capitulo.obra_id,
      interacao.user_id
    from interacoes_biblioteca as interacao
    join capitulos_relevantes as capitulo
      on capitulo.id = interacao.capitulo_id
    where interacao.tipo_interacao = 'salvo_capitulo'
  ),
  linhas_seguidores_autores as materialized (
    select interacao.seguido_id as autor_id, interacao.seguidor_id
    from public.seguindo_usuarios as interacao
    join ids_autores as autor on autor.id = interacao.seguido_id
  ),
  linhas_avaliacoes_autores as materialized (
    select avaliacao.autor_id, avaliacao.user_id, avaliacao.nota
    from public.autor_avaliacoes as avaliacao
    join ids_autores as autor on autor.id = avaliacao.autor_id
  ),
  curtidas_obras as (
    select
      interacao.obra_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.user_id = v_usuario_id), false) as minha
    from linhas_curtidas_obras as interacao
    group by interacao.obra_id
  ),
  comentarios_obras as (
    select interacao.obra_id, count(*)::bigint as total
    from linhas_comentarios_obras as interacao
    group by interacao.obra_id
  ),
  seguidores_obras as (
    select
      interacao.obra_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.user_id = v_usuario_id), false) as meu
    from linhas_seguidores_obras as interacao
    group by interacao.obra_id
  ),
  favoritos_obras as (
    select
      interacao.obra_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.user_id = v_usuario_id), false) as meu
    from linhas_favoritos_obras as interacao
    group by interacao.obra_id
  ),
  concluidas_obras as (
    select
      interacao.obra_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.user_id = v_usuario_id), false) as minha
    from linhas_concluidas_obras as interacao
    group by interacao.obra_id
  ),
  avaliacoes_obras as (
    select
      avaliacao.obra_id,
      avg(avaliacao.nota)::numeric as media,
      count(*)::bigint as total,
      max(avaliacao.nota) filter (
        where avaliacao.user_id = v_usuario_id
      )::numeric as minha
    from linhas_avaliacoes_obras as avaliacao
    where avaliacao.user_id <> avaliacao.autor_id
    group by avaliacao.obra_id
  ),
  comunidade_obras as (
    select
      publicacao.obra_id,
      count(*) filter (
        where publicacao.tipo_publicacao = 'Teoria'
      )::bigint as teorias,
      count(*) filter (
        where publicacao.tipo_publicacao = 'Review'
      )::bigint as reviews,
      count(*) filter (
        where publicacao.tipo_publicacao not in ('Teoria', 'Review')
      )::bigint as posts
    from linhas_comunidade_obras as publicacao
    group by publicacao.obra_id
  ),
  curtidores_obras as (
    select interacao.obra_id, interacao.user_id
    from linhas_curtidas_obras as interacao
    union
    select interacao.obra_id, interacao.user_id
    from linhas_curtidas_capitulos as interacao
    join obras_solicitadas as obra on obra.id = interacao.obra_id
  ),
  total_curtidores_obras as (
    select interacao.obra_id, count(*)::bigint as total
    from curtidores_obras as interacao
    group by interacao.obra_id
  ),
  comentaristas_obras as (
    select interacao.obra_id, interacao.user_id
    from linhas_comentarios_obras as interacao
    union
    select interacao.obra_id, interacao.user_id
    from linhas_comentarios_capitulos as interacao
    join obras_solicitadas as obra on obra.id = interacao.obra_id
  ),
  total_comentaristas_obras as (
    select interacao.obra_id, count(*)::bigint as total
    from comentaristas_obras as interacao
    group by interacao.obra_id
  ),
  bibliotecas_obras as (
    select interacao.obra_id, interacao.user_id
    from linhas_seguidores_obras as interacao
    union
    select interacao.obra_id, interacao.user_id
    from linhas_favoritos_obras as interacao
  ),
  total_bibliotecas_obras as (
    select
      interacao.obra_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.user_id = v_usuario_id), false) as minha
    from bibliotecas_obras as interacao
    group by interacao.obra_id
  ),
  salvadores_obras as (
    select interacao.obra_id, interacao.user_id
    from bibliotecas_obras as interacao
    union
    select interacao.obra_id, interacao.user_id
    from linhas_salvos_capitulos as interacao
    join obras_solicitadas as obra on obra.id = interacao.obra_id
  ),
  total_salvadores_obras as (
    select
      interacao.obra_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.user_id = v_usuario_id), false) as meu
    from salvadores_obras as interacao
    group by interacao.obra_id
  ),
  total_leitores_obras as (
    select
      progresso.obra_id,
      true as minha,
      max(progresso.lido_em) as meu_lido_em
    from progresso_usuario as progresso
    join obras_solicitadas as obra on obra.id = progresso.obra_id
    group by progresso.obra_id
  ),
  curtidas_capitulos as (
    select
      interacao.capitulo_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.user_id = v_usuario_id), false) as minha
    from linhas_curtidas_capitulos as interacao
    join capitulos_solicitados as capitulo
      on capitulo.id = interacao.capitulo_id
    group by interacao.capitulo_id
  ),
  comentarios_capitulos as (
    select interacao.capitulo_id, count(*)::bigint as total
    from linhas_comentarios_capitulos as interacao
    join capitulos_solicitados as capitulo
      on capitulo.id = interacao.capitulo_id
    group by interacao.capitulo_id
  ),
  salvos_capitulos as (
    select
      interacao.capitulo_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.user_id = v_usuario_id), false) as meu
    from linhas_salvos_capitulos as interacao
    join capitulos_solicitados as capitulo
      on capitulo.id = interacao.capitulo_id
    group by interacao.capitulo_id
  ),
  leituras_capitulos as (
    select
      progresso.capitulo_id,
      true as minha,
      max(progresso.lido_em) as meu_lido_em
    from progresso_usuario as progresso
    join capitulos_solicitados as capitulo
      on capitulo.id = progresso.capitulo_id
    group by progresso.capitulo_id
  ),
  seguidores_autores as (
    select
      interacao.autor_id,
      count(*)::bigint as total,
      coalesce(bool_or(interacao.seguidor_id = v_usuario_id), false) as meu
    from linhas_seguidores_autores as interacao
    group by interacao.autor_id
  ),
  avaliacoes_autores as (
    select
      avaliacao.autor_id,
      avg(avaliacao.nota)::numeric as media,
      count(*)::bigint as total,
      max(avaliacao.nota) filter (
        where avaliacao.user_id = v_usuario_id
      )::numeric as minha
    from linhas_avaliacoes_autores as avaliacao
    where avaliacao.user_id <> avaliacao.autor_id
    group by avaliacao.autor_id
  ),
  linhas as (
    select
      1::integer as contrato_versao,
      'obra'::text as tipo_conteudo,
      obra.id as conteudo_id,
      obra.id as obra_id,
      greatest(coalesce(obra.visualizacoes, 0), 0)::bigint as visualizacoes,
      coalesce(curtida.total, 0)::bigint as curtidas,
      coalesce(comentario.total, 0)::bigint as comentarios,
      coalesce(biblioteca.total, 0)::bigint as salvos,
      coalesce(seguidor.total, 0)::bigint as seguidores,
      coalesce(favorito.total, 0)::bigint as favoritos,
      coalesce(concluida.total, 0)::bigint as concluidas,
      coalesce(curtidor.total, 0)::bigint as curtidores_unicos,
      coalesce(comentarista.total, 0)::bigint as comentaristas_unicos,
      coalesce(salvador.total, 0)::bigint as salvadores_unicos,
      coalesce(avaliacao.media, 0)::numeric as avaliacao_media,
      coalesce(avaliacao.total, 0)::bigint as avaliacoes,
      coalesce(comunidade.teorias, 0)::bigint as teorias,
      coalesce(comunidade.reviews, 0)::bigint as reviews,
      coalesce(comunidade.posts, 0)::bigint as posts,
      coalesce(curtida.minha, false) as curtido_por_mim,
      coalesce(biblioteca.minha, false) as salvo_por_mim,
      coalesce(seguidor.meu, false) as seguido_por_mim,
      coalesce(favorito.meu, false) as favorito_por_mim,
      coalesce(concluida.minha, false) as concluido_por_mim,
      coalesce(leitor.minha, false) as lido_por_mim,
      leitor.meu_lido_em as lido_em,
      coalesce(avaliacao.minha, 0)::numeric as minha_avaliacao
    from obras_solicitadas as obra
    left join curtidas_obras as curtida on curtida.obra_id = obra.id
    left join comentarios_obras as comentario on comentario.obra_id = obra.id
    left join seguidores_obras as seguidor on seguidor.obra_id = obra.id
    left join favoritos_obras as favorito on favorito.obra_id = obra.id
    left join concluidas_obras as concluida on concluida.obra_id = obra.id
    left join avaliacoes_obras as avaliacao on avaliacao.obra_id = obra.id
    left join comunidade_obras as comunidade on comunidade.obra_id = obra.id
    left join total_curtidores_obras as curtidor on curtidor.obra_id = obra.id
    left join total_comentaristas_obras as comentarista
      on comentarista.obra_id = obra.id
    left join total_bibliotecas_obras as biblioteca
      on biblioteca.obra_id = obra.id
    left join total_salvadores_obras as salvador on salvador.obra_id = obra.id
    left join total_leitores_obras as leitor on leitor.obra_id = obra.id

    union all

    select
      1::integer,
      'capitulo'::text,
      capitulo.id,
      capitulo.obra_id,
      greatest(coalesce(capitulo.visualizacoes, 0), 0)::bigint,
      coalesce(curtida.total, 0)::bigint,
      coalesce(comentario.total, 0)::bigint,
      coalesce(salvo.total, 0)::bigint,
      0::bigint,
      0::bigint,
      0::bigint,
      coalesce(curtida.total, 0)::bigint,
      coalesce(comentario.total, 0)::bigint,
      coalesce(salvo.total, 0)::bigint,
      0::numeric,
      0::bigint,
      0::bigint,
      0::bigint,
      0::bigint,
      coalesce(curtida.minha, false),
      coalesce(salvo.meu, false),
      false,
      false,
      false,
      coalesce(leitura.minha, false),
      leitura.meu_lido_em,
      0::numeric
    from capitulos_solicitados as capitulo
    left join curtidas_capitulos as curtida
      on curtida.capitulo_id = capitulo.id
    left join comentarios_capitulos as comentario
      on comentario.capitulo_id = capitulo.id
    left join salvos_capitulos as salvo on salvo.capitulo_id = capitulo.id
    left join leituras_capitulos as leitura on leitura.capitulo_id = capitulo.id

    union all

    select
      1::integer,
      'autor'::text,
      autor.id,
      null::uuid,
      0::bigint,
      0::bigint,
      0::bigint,
      0::bigint,
      coalesce(seguidor.total, 0)::bigint,
      0::bigint,
      0::bigint,
      0::bigint,
      0::bigint,
      0::bigint,
      coalesce(avaliacao.media, 0)::numeric,
      coalesce(avaliacao.total, 0)::bigint,
      0::bigint,
      0::bigint,
      0::bigint,
      false,
      false,
      coalesce(seguidor.meu, false),
      false,
      false,
      false,
      null::timestamptz,
      coalesce(avaliacao.minha, 0)::numeric
    from ids_autores as autor
    left join seguidores_autores as seguidor on seguidor.autor_id = autor.id
    left join avaliacoes_autores as avaliacao on avaliacao.autor_id = autor.id
  )
  select linha.*
  from linhas as linha
  order by linha.tipo_conteudo, linha.conteudo_id;
end;
$$;

alter function public.obter_metricas_conteudos(uuid[], uuid[], uuid[])
owner to postgres;

revoke all on function public.obter_metricas_conteudos(uuid[], uuid[], uuid[])
from public, anon, authenticated, service_role;

grant execute on function public.obter_metricas_conteudos(uuid[], uuid[], uuid[])
to anon, authenticated, service_role;

comment on function public.obter_metricas_conteudos(uuid[], uuid[], uuid[]) is
  'Contrato v1 de metricas agregadas. Retorna no maximo 100 obras, 600 capitulos e 100 autores; a visibilidade equivale as policies do chamador. Em obras, curtidas/comentarios sao diretos, salvos une seguidores/favoritos e os campos *_unicos agregam obra e capitulos. Progresso privado aparece somente em lido_por_mim/lido_em e nunca e exposto como contador publico.';

-- Pos-condicoes: a migration aborta se qualquer helper privilegiado ficar sem
-- search_path fixo, se os grants forem ampliados ou se os indices esperados
-- nao forem criados.
do $metricas_pos_condicoes$
declare
  v_rpc oid :=
    'public.obter_metricas_conteudos(uuid[],uuid[],uuid[])'::regprocedure;
  v_helpers oid[] := array[
    'historietas_privado.obter_progresso_metricas_usuario(uuid[],uuid[])'::regprocedure,
    'historietas_privado.obter_conteudos_metricas(uuid[],uuid[])'::regprocedure,
    'historietas_privado.obter_interacoes_biblioteca_metricas(uuid[],uuid[])'::regprocedure,
    'historietas_privado.obter_interacoes_conteudo_metricas(uuid[],uuid[])'::regprocedure
  ];
  v_funcoes oid[];
begin
  v_funcoes := array_prepend(v_rpc, v_helpers);

  if not coalesce(
    (
      select
        not funcao.prosecdef
        and funcao.provolatile = 's'
        and funcao.proconfig @> array['search_path=""']::text[]
        and pg_catalog.pg_get_userbyid(funcao.proowner) = 'postgres'
      from pg_catalog.pg_proc as funcao
      where funcao.oid = v_rpc
    ),
    false
  ) then
    raise exception
      'A RPC de metricas deve ser STABLE SECURITY INVOKER, pertencer a postgres e ter search_path vazio.';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_proc as funcao
    where funcao.oid = any(v_helpers)
      and funcao.prosecdef
      and funcao.provolatile = 's'
      and funcao.proconfig @> array['search_path=""']::text[]
      and pg_catalog.pg_get_userbyid(funcao.proowner) = 'postgres'
  ) <> cardinality(v_helpers) then
    raise exception
      'Todos os helpers de metricas devem ser STABLE SECURITY DEFINER, pertencer a postgres e ter search_path vazio.';
  end if;

  if exists (
    select 1
    from unnest(v_funcoes) as alvo(funcao_oid)
    where not pg_catalog.has_function_privilege(
      'anon',
      alvo.funcao_oid,
      'EXECUTE'
    )
      or not pg_catalog.has_function_privilege(
        'authenticated',
        alvo.funcao_oid,
        'EXECUTE'
      )
      or not pg_catalog.has_function_privilege(
        'service_role',
        alvo.funcao_oid,
        'EXECUTE'
      )
  ) then
    raise exception
      'Os papeis da API nao receberam a execucao minima do contrato de metricas.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as funcao
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        funcao.proacl,
        pg_catalog.acldefault('f', funcao.proowner)
      )
    ) as privilegio
    where funcao.oid = any(v_funcoes)
      and privilegio.grantee = 0
      and privilegio.privilege_type = 'EXECUTE'
  ) then
    raise exception
      'PUBLIC nao pode executar a RPC nem os helpers de metricas.';
  end if;

  if (
    select count(distinct classe.relname)
    from pg_catalog.pg_class as classe
    join pg_catalog.pg_namespace as esquema
      on esquema.oid = classe.relnamespace
    where esquema.nspname = 'public'
      and classe.relkind = 'i'
      and classe.relname in (
        'favoritos_obra_id_idx',
        'concluidas_obra_id_idx',
        'comunidade_posts_obra_tipo_idx',
        'curtidas_capitulos_obra_id_idx',
        'comentarios_capitulos_obra_id_idx',
        'salvos_capitulos_obra_id_idx'
      )
  ) <> 6 then
    raise exception
      'Nem todos os indices do contrato de metricas foram criados.';
  end if;
end;
$metricas_pos_condicoes$;
