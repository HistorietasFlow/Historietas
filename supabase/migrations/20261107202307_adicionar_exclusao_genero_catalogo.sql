begin;

-- Nova variante sem defaults: preserva as assinaturas de 10, 11, 12 e 13 argumentos.
do $migration$
declare
  v_original regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text)'::regprocedure;
  v_corpo text;
  v_alvo text := '    where obra.publicado = true';
begin
  select prosrc into strict v_corpo from pg_proc where oid = v_original;
  if (select prosecdef from pg_proc where oid = v_original)
     or strpos(v_corpo, v_alvo) = 0
     or strpos(v_corpo, '  v_busca text :=') = 0
     or strpos(v_corpo, '  return query') = 0
     or strpos(v_corpo, 'candidato.media_avaliacoes >= p_nota_minima') = 0
     or strpos(v_corpo, 'not exists (') = 0
     or strpos(v_corpo, 'v_tag_excluida') = 0 then
    raise exception 'Contrato do catálogo divergiu da base esperada.';
  end if;
  if strpos(substring(v_corpo from strpos(v_corpo, v_alvo) + char_length(v_alvo)), v_alvo) > 0 then
    raise exception 'Mais de um ponto de exclusão de gênero encontrado no catálogo.';
  end if;

  v_corpo := replace(v_corpo, '  v_busca text :=', $genero$
  v_genero_excluido text := btrim(regexp_replace(translate(lower(coalesce(p_genero_excluido, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
    E'[ \\t\\r\\n\\f\\v]+', ' ', 'g'));
  v_busca text :=$genero$);
  v_corpo := replace(v_corpo, '  return query', $validacao$
  if v_genero_excluido in ('sci-fi', 'sci fi') then
    v_genero_excluido := 'ficcao';
  end if;
  if v_genero_excluido not in ('', 'acao', 'aventura', 'comedia', 'drama', 'fantasia',
    'ficcao', 'misterio', 'romance', 'suspense', 'terror', 'sobrenatural', 'historico', 'biografia') then
    raise exception using errcode = '22023', message = 'Gênero excluído inválido.';
  end if;
  return query$validacao$);
  v_corpo := replace(v_corpo, v_alvo, $predicado$
    where obra.publicado = true
      and (v_genero_excluido = '' or (
        case when v_genero in ('sci-fi', 'sci fi') then 'ficcao' else v_genero end <> v_genero_excluido
        and not (
        btrim(regexp_replace(translate(lower(coalesce(obra.genero, '')),
          'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
          E'[ \\t\\r\\n\\f\\v]+', ' ', 'g'))
        ~ ('(^|[^[:alnum:]_])' ||
          case when v_genero_excluido = 'ficcao' then '(ficcao|sci-fi|sci fi)'
            else v_genero_excluido end || '([^[:alnum:]_]|$)')
      )))$predicado$);

  execute 'create function public.listar_obras_catalogo(
    p_busca text, p_genero text, p_formato text, p_classificacao text,
    p_filtro_capitulos text, p_ordenacao text, p_limite integer,
    p_cursor_valor numeric, p_cursor_data timestamptz, p_cursor_id uuid,
    p_tag text, p_nota_minima numeric, p_tag_excluida text, p_genero_excluido text
  ) returns table (obra_id uuid, cursor_valor numeric, cursor_data timestamptz,
    cursor_id uuid, tem_mais boolean)
  language plpgsql stable security invoker set search_path = ''''
  as ' || quote_literal(v_corpo);
end;
$migration$;

alter function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text) owner to postgres;
revoke all on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text) from public;
grant execute on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text) to anon, authenticated, service_role;
comment on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text)
  is 'Catálogo com exclusão de gênero por termos completos antes da paginação; preserva RLS e quatro variantes anteriores.';

do $checks$
declare
  v_funcao regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text)'::regprocedure;
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
