begin;

do $migration$
declare
  v_funcao regprocedure := to_regprocedure(
    'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid)'
  );
  v_definicao text;
  v_declaracao_anterior text :=
    '  v_limite integer := least(greatest(coalesce(p_limite, 24), 1), 50);';
  v_declaracao_atualizada text := $trecho$
  v_limite integer := least(greatest(coalesce(p_limite, 24), 1), 50);
  v_autores_busca uuid[] := '{}'::uuid[];
$trecho$;
  v_retorno_anterior text := '  return query';
  v_retorno_atualizado text := $trecho$
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

  return query
$trecho$;
  v_trecho_anterior text :=
    '        or obra.busca_documento @@ v_consulta';
  v_trecho_atualizado text := $trecho$
        or obra.busca_documento @@ v_consulta
        or obra.user_id = any(v_autores_busca)
$trecho$;
begin
  if v_funcao is null then
    raise exception 'A RPC listar_obras_catalogo não foi encontrada.';
  end if;

  select pg_get_functiondef(v_funcao)
  into v_definicao;

  if strpos(v_definicao, v_declaracao_anterior) = 0
     or strpos(v_definicao, v_retorno_anterior) = 0
     or strpos(v_definicao, v_trecho_anterior) = 0 then
    raise exception
      'A definição de listar_obras_catalogo divergiu da base esperada.';
  end if;

  if strpos(
    substring(
      v_definicao
      from strpos(v_definicao, v_trecho_anterior) + char_length(v_trecho_anterior)
    ),
    v_trecho_anterior
  ) > 0 then
    raise exception
      'A definição de listar_obras_catalogo contém mais de um trecho-alvo.';
  end if;

  v_definicao := replace(
    v_definicao,
    v_declaracao_anterior,
    v_declaracao_atualizada
  );
  v_definicao := replace(
    v_definicao,
    v_retorno_anterior,
    v_retorno_atualizado
  );
  execute replace(v_definicao, v_trecho_anterior, v_trecho_atualizado);
end;
$migration$;

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
  'Lista IDs de obras públicas com busca pelo conteúdo e pelo nome público atual do autor, filtros, ranking e paginação por cursor estável; respeita RLS por ser SECURITY INVOKER.';

do $$
declare
  v_funcao regprocedure := to_regprocedure(
    'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid)'
  );
  v_definicao text;
begin
  if v_funcao is null then
    raise exception 'A RPC listar_obras_catalogo não foi preservada.';
  end if;

  select pg_get_functiondef(v_funcao)
  into v_definicao;

  if strpos(v_definicao, 'from public.profiles_publicos as perfil_autor') = 0
     or strpos(v_definicao, 'obra.user_id = any(v_autores_busca)') = 0 then
    raise exception 'A busca pelo nome público atual do autor não foi aplicada.';
  end if;

  if exists (
    select 1
    from pg_proc as funcao
    where funcao.oid = v_funcao
      and funcao.prosecdef
  ) then
    raise exception 'listar_obras_catalogo deve permanecer SECURITY INVOKER.';
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
    raise exception 'Os papéis da aplicação perderam acesso à RPC.';
  end if;
end;
$$;

commit;
