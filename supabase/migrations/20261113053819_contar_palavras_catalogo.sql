begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';

-- Ausencia de medicao nao e zero. Sem default, backfill ou rewrite do historico.
alter table public.capitulos add column palavras_contadas bigint
  constraint capitulos_palavras_contadas_check check (palavras_contadas >= 0);
comment on column public.capitulos.palavras_contadas is
  'Contagem v1 do texto armazenado, selada pelo trigger. NULL = nao medido/nao textual; zero = texto medido vazio. Nao representa paginas.';

create function historietas_privado.definir_palavras_capitulo()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.tipo_conteudo <> 'texto' then
    new.palavras_contadas := null;
  elsif tg_op = 'INSERT' then
    new.palavras_contadas := pg_catalog.regexp_count(new.texto collate "C",
      U&'[^\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+');
  elsif new.texto is distinct from old.texto
    or new.tipo_conteudo is distinct from old.tipo_conteudo
    or new.palavras_contadas is distinct from old.palavras_contadas then
    -- Inclusive UPDATE apenas do contador: nunca confiar no numero do cliente.
    new.palavras_contadas := pg_catalog.regexp_count(new.texto collate "C",
      U&'[^\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+');
  else
    new.palavras_contadas := old.palavras_contadas;
  end if;
  return new;
end;
$$;
alter function historietas_privado.definir_palavras_capitulo() owner to postgres;
revoke all on function historietas_privado.definir_palavras_capitulo()
  from public, anon, authenticated, service_role;
create trigger capitulos_palavras_contadas before insert or update on public.capitulos
  for each row execute function historietas_privado.definir_palavras_capitulo();

-- Operacao exclusivamente administrativa, sem endpoint/cron ou novo grant.
-- O limite de linhas NAO e garantia de tempo, bytes, WAL ou capacidade fisica.
create function historietas_privado.preencher_palavras_capitulos(p_limite integer)
returns table(capitulo_id uuid)
language plpgsql volatile security invoker set search_path = '' as $$
begin
  if p_limite is null or p_limite < 1 or p_limite > 25 then
    raise exception using errcode = '22023', message = 'Lote de palavras invalido (1 a 25).';
  end if;
  return query
  with lote as materialized (
    select c.id from public.capitulos c
    where c.tipo_conteudo = 'texto' and c.palavras_contadas is null
    order by c.id limit p_limite for update skip locked
  )
  update public.capitulos c set palavras_contadas = 0
  from lote where c.id = lote.id and c.palavras_contadas is null
  -- O trigger calcula NEW.texto sob o lock. Zero acima nao e a medicao.
  returning c.id;
end;
$$;
alter function historietas_privado.preencher_palavras_capitulos(integer) owner to postgres;
revoke all on function historietas_privado.preencher_palavras_capitulos(integer)
  from public, anon, authenticated, service_role;

-- Acrescenta somente a variante de 17 argumentos; nao substitui as seis antigas.
do $migration$
declare
  v_original regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text)'::regprocedure;
  v_corpo text;
  v_legadas jsonb;
  v_agregado text := E'      capitulo.obra_id,\n      count(*)::bigint as total,';
  v_filtro text := E'    where (\n      v_filtro_capitulos = ''todos''';
begin
  select jsonb_agg(jsonb_build_array(oid,pg_get_functiondef(oid),proacl::text) order by oid)
    into v_legadas from pg_proc where pronamespace='public'::regnamespace
      and proname='listar_obras_catalogo' and pronargs between 10 and 15;
  if jsonb_array_length(v_legadas) is distinct from 6 then
    raise exception 'Seis variantes legadas do catalogo sao obrigatorias.';
  end if;
  select prosrc into strict v_corpo from pg_proc where oid=v_original;
  -- Baselines aplicadas no Windows podem conservar CRLF em prosrc. Normaliza
  -- apenas a copia da variante nova; definicoes das seis anteriores sao imutaveis.
  v_corpo := replace(v_corpo, E'\r\n', E'\n');
  if (select prosecdef or pronargdefaults<>0 or proconfig is distinct from array['search_path=""'] from pg_proc where oid=v_original)
    or (length(v_corpo)-length(replace(v_corpo,v_agregado,'')))<>length(v_agregado)
    or (length(v_corpo)-length(replace(v_corpo,v_filtro,'')))<>length(v_filtro)
    or strpos(v_corpo,'obra.status_editorial = p_status_editorial')=0
    or strpos(v_corpo,'candidato.media_avaliacoes >= p_nota_minima')=0 then
    raise exception 'Contrato de 15 argumentos do catalogo divergiu.';
  end if;
  -- NUMERIC recebe a entrada antes de coercoes: BIGINT arredondaria decimais
  -- em casts SQL. Limite tecnico compartilhavel com Number.isSafeInteger.
  v_corpo := replace(v_corpo, '  return query', $validacao$
  if (p_palavras_minimas is not null and (p_palavras_minimas::text in ('NaN','Infinity','-Infinity')
      or p_palavras_minimas<0 or p_palavras_minimas>9007199254740991 or trunc(p_palavras_minimas)<>p_palavras_minimas))
    or (p_palavras_maximas is not null and (p_palavras_maximas::text in ('NaN','Infinity','-Infinity')
      or p_palavras_maximas<0 or p_palavras_maximas>9007199254740991 or trunc(p_palavras_maximas)<>p_palavras_maximas))
    or p_palavras_minimas>p_palavras_maximas then
    raise exception using errcode='22023', message='Intervalo de palavras invalido.';
  end if;
  return query$validacao$);
  v_corpo := replace(v_corpo,v_agregado,v_agregado || $agregado$
      bool_and(capitulo.tipo_conteudo='texto' and capitulo.palavras_contadas is not null)
        filter (where capitulo.user_id=obra.user_id) as palavras_confirmadas,
      sum(capitulo.palavras_contadas) filter
        (where capitulo.user_id=obra.user_id and capitulo.tipo_conteudo='texto') as total_palavras,$agregado$);
  v_corpo := replace(v_corpo,v_filtro,$filtro$
    where (p_palavras_minimas is null and p_palavras_maximas is null or (
      nullif(btrim(obra.arquivo_url),'') is null
      and capitulo.palavras_confirmadas is true
      and (p_palavras_minimas is null or capitulo.total_palavras>=p_palavras_minimas)
      and (p_palavras_maximas is null or capitulo.total_palavras<=p_palavras_maximas)
    )) and (
      v_filtro_capitulos = 'todos'$filtro$);
  execute 'create function public.listar_obras_catalogo(
    p_busca text, p_genero text, p_formato text, p_classificacao text,
    p_filtro_capitulos text, p_ordenacao text, p_limite integer,
    p_cursor_valor numeric, p_cursor_data timestamptz, p_cursor_id uuid,
    p_tag text, p_nota_minima numeric, p_tag_excluida text,
    p_genero_excluido text, p_status_editorial text,
    p_palavras_minimas numeric, p_palavras_maximas numeric
  ) returns table(obra_id uuid,cursor_valor numeric,cursor_data timestamptz,cursor_id uuid,tem_mais boolean)
  language plpgsql stable security invoker set search_path = ''''
  as ' || quote_literal(v_corpo);
  if v_legadas is distinct from (select jsonb_agg(jsonb_build_array(oid,pg_get_functiondef(oid),proacl::text) order by oid)
    from pg_proc where pronamespace='public'::regnamespace and proname='listar_obras_catalogo' and pronargs between 10 and 15) then
    raise exception 'Definicoes/defaults/ACL do catalogo legado foram alterados.';
  end if;
end;
$migration$;
alter function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text,numeric,numeric) owner to postgres;
revoke all on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text,numeric,numeric)
  from public, anon, authenticated, service_role;
grant execute on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text,numeric,numeric)
  to anon, authenticated, service_role;
comment on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text,numeric,numeric) is
  'Palavras v1 de capitulos publicos integralmente medidos, sem anexos/mistos. Intervalo inclusivo antes do cursor. NULL/NULL neutro; seis variantes preservadas. Sem paginas.';
notify pgrst, 'reload schema';
commit;
