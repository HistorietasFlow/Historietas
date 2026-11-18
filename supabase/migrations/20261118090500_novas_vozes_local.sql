begin;
set local lock_timeout = '5s';
set local search_path = pg_catalog;

create schema novas_vozes_interno authorization postgres;
revoke all on schema novas_vozes_interno from public, anon, authenticated, service_role;
grant usage on schema novas_vozes_interno to anon, authenticated;

-- Sem backfill por created_at da obra. Contas anteriores a este marco têm
-- histórico desconhecido e não são certificadas por este registro.
create table novas_vozes_interno.config (
  unica boolean primary key default true check (unica),
  observado_desde timestamptz not null,
  listagem_habilitada boolean not null default false
);
insert into novas_vozes_interno.config (observado_desde) values (statement_timestamp());

create table novas_vozes_interno.estreias (
  autor_id uuid primary key references auth.users(id) on delete cascade,
  primeira_publicacao timestamptz not null
);
create index novas_vozes_primeira_publicacao_idx
  on novas_vozes_interno.estreias (primeira_publicacao, autor_id);
alter table novas_vozes_interno.config enable row level security;
alter table novas_vozes_interno.estreias enable row level security;
revoke all on novas_vozes_interno.config, novas_vozes_interno.estreias
  from public, anon, authenticated, service_role;

-- Confirma um capítulo de texto do próprio autor ou o arquivo privado no
-- bucket contratado. Referências legadas, URLs externas e entradas ambíguas
-- não servem como prova de disponibilidade.
create function novas_vozes_interno.obra_legivel(p_obra_id uuid, p_autor_id uuid, p_arquivo text)
returns boolean language sql stable set search_path = '' as $legivel$
  select exists (
    select 1 from public.capitulos as capitulo
    where capitulo.obra_id = p_obra_id and capitulo.user_id = p_autor_id
      and capitulo.publicado is true and capitulo.tipo_conteudo = 'texto'
      -- O contador selado do catálogo já distingue texto de separadores;
      -- capítulos legados ainda não medidos usam a mesma definição de palavra.
      and coalesce(capitulo.palavras_contadas > 0,
        capitulo.texto collate pg_catalog."C" ~ U&'[^\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]')
  ) or (
    p_arquivo like p_autor_id::text || '/%'
    and pg_catalog.length(p_arquivo) <= 1024
    and p_arquivo !~* '(^|/)(\.{1,2}|capitulos)(/|$)|[%?#\\[:cntrl:]]|//|/$'
    and exists (
      select 1 from storage.objects as objeto
      where objeto.bucket_id = 'arquivos-obras' and objeto.name = p_arquivo
    )
  );
$legivel$;

create function novas_vozes_interno.certificar_estreia()
returns trigger language plpgsql security definer set search_path = '' as $estreia$
declare
  v_autor uuid;
begin
  if tg_table_schema = 'storage' then
    if new.bucket_id <> 'arquivos-obras'
       or not pg_catalog.pg_input_is_valid(pg_catalog.split_part(new.name, '/', 1), 'pg_catalog.uuid') then
      return null;
    end if;
    v_autor := pg_catalog.split_part(new.name, '/', 1)::uuid;
  elsif tg_op = 'DELETE' then
    v_autor := old.user_id;
  else
    v_autor := new.user_id;
  end if;
  -- Serializa a primeira certificação do mesmo autor. A leitura seguinte usa
  -- o novo snapshot sob READ COMMITTED quando o evento concorrente termina.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_autor::text, 91721301));
  if exists (
    select from auth.users as conta cross join novas_vozes_interno.config as config
    where conta.id = v_autor and conta.created_at >= config.observado_desde
  ) and not exists (
    select from novas_vozes_interno.estreias where autor_id = v_autor
  ) and exists (
    select from public.obras as obra
    left join public.preferencias_privacidade as pref on pref.user_id = obra.user_id
    where obra.user_id = v_autor and obra.publicado is true
      and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
      and not coalesce(pref.perfil_privado, false)
      and coalesce(pref.visibilidade_obras, 'publico') = 'publico'
      and novas_vozes_interno.obra_legivel(obra.id, obra.user_id, obra.arquivo_url)
  ) then
    insert into novas_vozes_interno.estreias (autor_id, primeira_publicacao)
      values (v_autor, pg_catalog.clock_timestamp()) on conflict (autor_id) do nothing;
  end if;
  return null;
end;
$estreia$;

-- A verificação deferida acompanha o estado que a transação deixa registrado.
create constraint trigger certificar_estreia_por_obra
  after insert or update of publicado, classificacao_indicativa, arquivo_url on public.obras
  deferrable initially deferred for each row execute function novas_vozes_interno.certificar_estreia();
create constraint trigger certificar_estreia_por_capitulo
  after insert or update of obra_id, publicado, texto, tipo_conteudo on public.capitulos
  deferrable initially deferred for each row execute function novas_vozes_interno.certificar_estreia();
create constraint trigger certificar_estreia_por_arquivo
  after insert or update of name, bucket_id on storage.objects
  deferrable initially deferred for each row
  when (new.bucket_id = 'arquivos-obras')
  execute function novas_vozes_interno.certificar_estreia();
create constraint trigger certificar_estreia_por_perfil
  after insert or delete or update of perfil_privado, visibilidade_obras on public.preferencias_privacidade
  deferrable initially deferred for each row execute function novas_vozes_interno.certificar_estreia();

-- Apenas IDs públicos atuais e seus slots, sem exposição da data de estreia.
create function novas_vozes_interno.selecionar()
returns table (obra_id uuid, ordem bigint)
language sql stable security definer set search_path = '' as $selecao$
  with autores as (
    select e.autor_id
    from novas_vozes_interno.estreias as e
    cross join novas_vozes_interno.config as config
    where config.listagem_habilitada
      and e.primeira_publicacao between (pg_catalog.statement_timestamp() - interval '2160 hours')
        and pg_catalog.statement_timestamp()
  ), uma_por_autor as (
    select distinct on (e.autor_id) e.autor_id, o.id as obra_id
    from autores as e
    join public.obras as o on o.user_id = e.autor_id
    left join public.preferencias_privacidade as pref on pref.user_id = e.autor_id
    where o.publicado is true
      and o.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
      and not coalesce(pref.perfil_privado, false)
      and coalesce(pref.visibilidade_obras, 'publico') = 'publico'
      and public.usuario_pode_ver_perfil(o.user_id)
      and (public.carregar_permissoes_abas_perfil(o.user_id) ->> 'obras') = 'true'
      and novas_vozes_interno.obra_legivel(o.id, o.user_id, o.arquivo_url)
    order by e.autor_id, o.id
  ), fila as (
    select u.obra_id, row_number() over (
      order by pg_catalog.sha256(pg_catalog.convert_to(u.autor_id::text, 'UTF8')), u.autor_id
    ) - 1 as posicao, count(*) over () as total
    from uma_por_autor as u
  ), rotacao as (
    select f.obra_id,
      pg_catalog.mod(f.posicao - pg_catalog.mod(
        ((pg_catalog.statement_timestamp() at time zone 'UTC')::date - date '1970-01-01')::bigint
        * least(12::bigint, f.total), f.total) + f.total, f.total) as ordem
    from fila as f
  )
  select r.obra_id, r.ordem from rotacao as r where r.ordem < 12 order by r.ordem;
$selecao$;

revoke all on function novas_vozes_interno.obra_legivel(uuid,uuid,text), novas_vozes_interno.certificar_estreia(),
  novas_vozes_interno.selecionar() from public, anon, authenticated, service_role;
grant execute on function novas_vozes_interno.selecionar() to anon, authenticated;

create function public.listar_novas_vozes()
returns table (
  id uuid, user_id uuid, titulo text, autor text, genero text, formato text,
  classificacao_indicativa text, avisos_conteudo text[], sinopse text, tags text[],
  capa_url text, capa_nome text, publicado boolean, slug text,
  criada_em timestamptz, atualizado_em timestamptz, visualizacoes integer, link text,
  possui_previa boolean
)
language plpgsql stable security invoker set search_path = '' as $listagem$
begin
  if current_user = 'authenticated' then
    if auth.uid() is null or not previa_interno.sessao_atual_ativa() then
      raise sqlstate 'PT401' using message = 'Sessão inválida.';
    end if;
  elsif current_user <> 'anon' then
    raise insufficient_privilege;
  end if;

  return query
  select obra.id, obra.user_id, obra.titulo, obra.autor, obra.genero, obra.formato,
    obra.classificacao_indicativa, obra.avisos_conteudo, obra.sinopse, obra.tags,
    obra.capa_url, obra.capa_nome, obra.publicado, obra.slug, obra.criada_em,
    obra.atualizado_em, obra.visualizacoes, obra.link,
    exists (
      select 1 from public.capitulos as c
      where c.obra_id = obra.id and c.user_id = obra.user_id and c.ordem = 1
        and c.publicado is true and c.tipo_conteudo = 'texto'
        and pg_catalog.left(c.texto, 600) collate pg_catalog."C" ~
          U&'[^\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]'
    )
  from novas_vozes_interno.selecionar() as secao
  join public.obras as obra on obra.id = secao.obra_id
  order by secao.ordem;
end;
$listagem$;

revoke all on function public.listar_novas_vozes() from public, anon, authenticated, service_role;
grant execute on function public.listar_novas_vozes() to anon, authenticated;
commit;
