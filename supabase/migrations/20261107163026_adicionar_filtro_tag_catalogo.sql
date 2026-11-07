begin;

-- Preserva a assinatura antiga (incluindo defaults e chamadas posicionais).
-- A variante com tag exige todos os argumentos: não há sobrecarga ambígua
-- para os clientes antigos. O cliente envia cursores nulos na primeira página.
do $migration$
declare
  v_original regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid)'::regprocedure;
  v_corpo text;
  v_alvo text := '    where obra.publicado = true';
begin
  select prosrc into strict v_corpo from pg_proc where oid = v_original;
  if (select prosecdef from pg_proc where oid = v_original) then
    raise exception 'A RPC original deve permanecer SECURITY INVOKER.';
  end if;
  if strpos(v_corpo, v_alvo) = 0
     or strpos(v_corpo, '  v_busca text :=') = 0
     or strpos(v_corpo, '  return query') = 0 then
    raise exception 'Contrato do catálogo divergiu da base esperada.';
  end if;

  v_corpo := replace(v_corpo, '  v_busca text :=', $tag$
  v_tag text := btrim(regexp_replace(translate(lower(coalesce(p_tag, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
    E'[ \\t\\r\\n\\f\\v]+', ' ', 'g'));
  v_busca text :=$tag$);
  v_corpo := replace(v_corpo, '  return query', $validacao$
  if char_length(v_tag) > 90 then
    raise exception using errcode = '22023', message = 'A tag aceita no máximo 90 caracteres.';
  end if;
  return query$validacao$);
  v_corpo := replace(v_corpo, v_alvo, $predicado$
    where obra.publicado = true
      and (v_tag = '' or exists (
        select 1 from unnest(obra.tags) as tag(valor)
        where btrim(regexp_replace(translate(lower(coalesce(tag.valor, '')),
          'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
          E'[ \\t\\r\\n\\f\\v]+', ' ', 'g')) = v_tag
      ))$predicado$);

  execute 'create function public.listar_obras_catalogo(
    p_busca text, p_genero text, p_formato text, p_classificacao text,
    p_filtro_capitulos text, p_ordenacao text, p_limite integer,
    p_cursor_valor numeric, p_cursor_data timestamptz, p_cursor_id uuid, p_tag text
  ) returns table (obra_id uuid, cursor_valor numeric, cursor_data timestamptz,
    cursor_id uuid, tem_mais boolean)
  language plpgsql stable security invoker set search_path = ''''
  as ' || quote_literal(v_corpo);
end;
$migration$;

alter function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text) owner to postgres;
revoke all on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text) from public;
grant execute on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text) to anon, authenticated, service_role;
comment on function public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)
  is 'Catálogo público com tag literal normalizada antes do cursor; contrato legado preservado.';

do $checks$
declare
  v_funcao regprocedure := 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure;
begin
  if (select prosecdef or proconfig is distinct from array['search_path=""'] from pg_proc where oid = v_funcao)
     or exists (select 1 from pg_proc, lateral aclexplode(coalesce(proacl, acldefault('f', proowner))) acl
       where oid = v_funcao and acl.grantee = 0 and acl.privilege_type = 'EXECUTE')
     or not has_function_privilege('anon', v_funcao, 'EXECUTE')
     or not has_function_privilege('authenticated', v_funcao, 'EXECUTE') then
    raise exception 'Privilégios ou configuração da RPC com tag inválidos.';
  end if;
end;
$checks$;

notify pgrst, 'reload schema';
commit;
