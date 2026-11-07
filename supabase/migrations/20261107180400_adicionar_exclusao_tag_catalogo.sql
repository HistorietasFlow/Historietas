begin;

-- Nova variante sem defaults: preserva as assinaturas de 10, 11 e 12 argumentos.
do $migration$
declare
  v_original regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric)'::regprocedure;
  v_corpo text;
  v_alvo text := '    where obra.publicado = true';
begin
  select prosrc into strict v_corpo from pg_proc where oid = v_original;
  if (select prosecdef from pg_proc where oid = v_original)
     or strpos(v_corpo, v_alvo) = 0
     or strpos(v_corpo, '  v_busca text :=') = 0
     or strpos(v_corpo, '  return query') = 0
     or strpos(v_corpo, 'candidato.media_avaliacoes >= p_nota_minima') = 0 then
    raise exception 'Contrato do catálogo divergiu da base esperada.';
  end if;
  if strpos(substring(v_corpo from strpos(v_corpo, v_alvo) + char_length(v_alvo)), v_alvo) > 0 then
    raise exception 'Mais de um ponto de exclusão encontrado no catálogo.';
  end if;

  v_corpo := replace(v_corpo, '  v_busca text :=', $tag$
  v_tag_excluida text := btrim(regexp_replace(translate(lower(coalesce(p_tag_excluida, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
    E'[ \\t\\r\\n\\f\\v]+', ' ', 'g'));
  v_busca text :=$tag$);
  v_corpo := replace(v_corpo, '  return query', $validacao$
  if char_length(v_tag_excluida) > 90 then
    raise exception using errcode = '22023', message = 'A tag excluída aceita no máximo 90 caracteres.';
  end if;
  return query$validacao$);
  v_corpo := replace(v_corpo, v_alvo, $predicado$
    where obra.publicado = true
      and (v_tag_excluida = '' or not exists (
        select 1 from unnest(obra.tags) as tag_excluida(valor)
        where btrim(regexp_replace(translate(lower(coalesce(tag_excluida.valor, '')),
          'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
          E'[ \\t\\r\\n\\f\\v]+', ' ', 'g')) = v_tag_excluida
      ))$predicado$);

  execute 'create function public.listar_obras_catalogo(
    p_busca text, p_genero text, p_formato text, p_classificacao text,
    p_filtro_capitulos text, p_ordenacao text, p_limite integer,
    p_cursor_valor numeric, p_cursor_data timestamptz, p_cursor_id uuid,
    p_tag text, p_nota_minima numeric, p_tag_excluida text
  ) returns table (obra_id uuid, cursor_valor numeric, cursor_data timestamptz,
    cursor_id uuid, tem_mais boolean)
  language plpgsql stable security invoker set search_path = ''''
  as ' || quote_literal(v_corpo);
end;
$migration$;

alter function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text) owner to postgres;
revoke all on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text) from public;
grant execute on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text) to anon, authenticated, service_role;
comment on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text)
  is 'Catálogo com exclusão literal de tag antes da paginação; preserva RLS, nota mínima e variantes anteriores.';

do $checks$
declare
  v_funcao regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text)'::regprocedure;
begin
  if (select prosecdef or proconfig is distinct from array['search_path=""'] or pronargdefaults <> 0 from pg_proc where oid = v_funcao)
     or exists (select 1 from pg_proc, lateral aclexplode(coalesce(proacl, acldefault('f', proowner))) acl
       where oid = v_funcao and acl.grantee = 0 and acl.privilege_type = 'EXECUTE')
     or not has_function_privilege('anon', v_funcao, 'EXECUTE')
     or not has_function_privilege('authenticated', v_funcao, 'EXECUTE') then
    raise exception 'Privilégios ou configuração da RPC com exclusão inválidos.';
  end if;
end;
$checks$;
notify pgrst, 'reload schema';
commit;
