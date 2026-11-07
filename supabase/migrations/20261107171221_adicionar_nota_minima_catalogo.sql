begin;

-- Mantém intactas as assinaturas de 10 e 11 argumentos. Esta variante exige
-- todos os 12 argumentos para preservar a resolução das chamadas antigas.
do $migration$
declare
  v_original regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure;
  v_corpo text;
  v_alvo text := '    from candidatos as candidato';
begin
  select prosrc into strict v_corpo from pg_proc where oid = v_original;
  if (select prosecdef from pg_proc where oid = v_original)
     or strpos(v_corpo, v_alvo) = 0
     or strpos(v_corpo, '  return query') = 0
     or strpos(v_corpo, 'avg(interacao.nota)::numeric as media') = 0
     or strpos(v_corpo, 'where interacao.user_id <> obra.user_id') = 0 then
    raise exception 'Contrato público de avaliações do catálogo divergiu da base esperada.';
  end if;
  if strpos(substring(v_corpo from strpos(v_corpo, v_alvo) + char_length(v_alvo)), v_alvo) > 0 then
    raise exception 'Mais de um ponto de filtragem encontrado no catálogo.';
  end if;

  v_corpo := replace(v_corpo, '  return query', $validacao$
  if p_nota_minima is not null and (
    p_nota_minima < 0.5 or p_nota_minima > 5
    or p_nota_minima * 2 <> trunc(p_nota_minima * 2)
  ) then
    raise exception using errcode = '22023', message = 'Avaliação mínima inválida.';
  end if;
  return query$validacao$);
  v_corpo := replace(v_corpo, v_alvo, $predicado$
    from candidatos as candidato
    where p_nota_minima is null or (
      candidato.total_avaliacoes > 0
      and candidato.media_avaliacoes >= p_nota_minima
    )$predicado$);

  execute 'create function public.listar_obras_catalogo(
    p_busca text, p_genero text, p_formato text, p_classificacao text,
    p_filtro_capitulos text, p_ordenacao text, p_limite integer,
    p_cursor_valor numeric, p_cursor_data timestamptz, p_cursor_id uuid,
    p_tag text, p_nota_minima numeric
  ) returns table (obra_id uuid, cursor_valor numeric, cursor_data timestamptz,
    cursor_id uuid, tem_mais boolean)
  language plpgsql stable security invoker set search_path = ''''
  as ' || quote_literal(v_corpo);
end;
$migration$;

alter function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric) owner to postgres;
revoke all on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric) from public;
grant execute on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric) to anon, authenticated, service_role;
comment on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric)
  is 'Catálogo público com média mínima real antes do cursor; preserva RLS, tag e assinaturas legadas.';

do $checks$
declare
  v_funcao regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric)'::regprocedure;
begin
  if (select prosecdef or proconfig is distinct from array['search_path=""'] or pronargdefaults <> 0 from pg_proc where oid = v_funcao)
     or exists (select 1 from pg_proc, lateral aclexplode(coalesce(proacl, acldefault('f', proowner))) acl
       where oid = v_funcao and acl.grantee = 0 and acl.privilege_type = 'EXECUTE')
     or not has_function_privilege('anon', v_funcao, 'EXECUTE')
     or not has_function_privilege('authenticated', v_funcao, 'EXECUTE') then
    raise exception 'Privilégios ou configuração da RPC com nota mínima inválidos.';
  end if;
end;
$checks$;
notify pgrst, 'reload schema';
commit;
