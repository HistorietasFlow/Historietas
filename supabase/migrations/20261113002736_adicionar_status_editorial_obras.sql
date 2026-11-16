begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';

-- Informativo: NULL nao e inferido da publicacao, leitura ou atividade.
alter table public.obras add column status_editorial text
  constraint obras_status_editorial_check
  check (status_editorial in ('em_andamento', 'concluida', 'pausada'));
comment on column public.obras.status_editorial is
  'Estado editorial informado pelo autor; NULL = nao informado. Nao altera publicacao, leitura ou agendamento.';
grant update (status_editorial) on public.obras to authenticated;

-- Mesmos campos/WHEN/funcao do guard anterior, mais o novo metadado.
drop trigger exigir_aceite_termos_obra_edicao_publicada on public.obras;
create trigger exigir_aceite_termos_obra_edicao_publicada
before update of titulo, genero, formato, classificacao_indicativa,
  avisos_conteudo, sinopse, tags, capa_url, capa_nome, arquivo_url,
  arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_categoria, link,
  status_editorial
on public.obras for each row when (new.publicado is true)
execute function public.exigir_aceite_termos_antes_de_publicar();

-- Deriva somente a variante nova. As cinco funcoes antigas nao sao alteradas.
do $migration$
declare
  v_original regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text)'::regprocedure;
  v_corpo text;
  v_alvo text := '    where obra.publicado = true';
  v_legadas jsonb;
begin
  select jsonb_agg(jsonb_build_array(oid, pg_get_functiondef(oid), proacl::text) order by oid)
    into v_legadas from pg_proc where pronamespace='public'::regnamespace
      and proname='listar_obras_catalogo' and pronargs between 10 and 14;
  if jsonb_array_length(v_legadas) is distinct from 5 then
    raise exception 'Cinco variantes legadas do catalogo sao obrigatorias.';
  end if;
  select prosrc into strict v_corpo from pg_proc where oid = v_original;
  if (select prosecdef or pronargdefaults <> 0 or proconfig is distinct from array['search_path=""'] from pg_proc where oid = v_original)
    or (length(v_corpo) - length(replace(v_corpo, v_alvo, ''))) <> length(v_alvo)
    or strpos(v_corpo, '  return query') = 0
    or strpos(v_corpo, 'candidato.media_avaliacoes >= p_nota_minima') = 0
    or strpos(v_corpo, 'v_tag_excluida') = 0
    or strpos(v_corpo, 'v_genero_excluido') = 0 then
    raise exception 'Contrato do catalogo divergiu da variante de 14 argumentos.';
  end if;
  -- Neutros: NULL e ''. Nao aceitar aliases, espacos ou estados desconhecidos.
  v_corpo := replace(v_corpo, '  return query', $validacao$
  if p_status_editorial is not null and p_status_editorial not in
    ('', 'em_andamento', 'concluida', 'pausada') then
    raise exception using errcode = '22023', message = 'Status editorial invalido.';
  end if;
  return query$validacao$);
  v_corpo := replace(v_corpo, v_alvo, v_alvo || E'\n'
    || '      and (nullif(p_status_editorial, '''') is null or obra.status_editorial = p_status_editorial)');
  execute 'create function public.listar_obras_catalogo(
    p_busca text, p_genero text, p_formato text, p_classificacao text,
    p_filtro_capitulos text, p_ordenacao text, p_limite integer,
    p_cursor_valor numeric, p_cursor_data timestamptz, p_cursor_id uuid,
    p_tag text, p_nota_minima numeric, p_tag_excluida text,
    p_genero_excluido text, p_status_editorial text
  ) returns table (obra_id uuid, cursor_valor numeric, cursor_data timestamptz,
    cursor_id uuid, tem_mais boolean)
  language plpgsql stable security invoker set search_path = ''''
  as ' || quote_literal(v_corpo);
  if v_legadas is distinct from (select jsonb_agg(jsonb_build_array(oid, pg_get_functiondef(oid), proacl::text) order by oid)
    from pg_proc where pronamespace='public'::regnamespace
      and proname='listar_obras_catalogo' and pronargs between 10 and 14) then
    raise exception 'Definicao, defaults ou ACL do catalogo legado foram alterados.';
  end if;
end;
$migration$;
alter function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text) owner to postgres;
revoke all on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text) to anon, authenticated, service_role;
comment on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text) is
  'Status editorial literal antes do cursor/limite. NULL ou vazio nao filtram. Preserva cinco assinaturas anteriores e RLS.';

-- JSON aditivo no mesmo snapshot/revisao, sem trocar assinatura ou ACL.
do $projection$
declare
  v_def text;
  v_alvo text := '''genero'',o.genero,''formato'',o.formato';
begin
  select pg_get_functiondef('public.obter_projecao_publica_obra(text,integer)'::regprocedure) into strict v_def;
  if (length(v_def) - length(replace(v_def, v_alvo, ''))) <> length(v_alvo)
    or (select prosecdef from pg_proc where oid = 'public.obter_projecao_publica_obra(text,integer)'::regprocedure) then
    raise exception 'Contrato da projecao publica divergiu.';
  end if;
  execute replace(v_def, v_alvo, '''statusEditorial'',o.status_editorial,' || v_alvo);
end;
$projection$;
-- O trigger revisar_projecao_obra ja inclui colunas futuras; nao criar outro.
-- Nao ha contrato de CAS para rascunhos nesta fase: nao habilitar edicao UI.
notify pgrst, 'reload schema';
commit;
