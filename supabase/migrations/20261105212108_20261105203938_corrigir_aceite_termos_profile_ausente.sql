begin;

create or replace function historietas_privado.aceitar_termos_publicacao(
  p_termos_versao text,
  p_diretrizes_versao text,
  p_politica_versao text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_agora timestamptz := pg_catalog.now();
  v_nome_fonte text;
  v_nome text;
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado para aceitar os termos.'
      using errcode = '42501';
  end if;

  if p_termos_versao is distinct from '2026-08-05'
     or p_diretrizes_versao is distinct from '2026-08-05'
     or p_politica_versao is distinct from '2026-08-05' then
    raise exception 'A versão dos documentos não é a versão atual.'
      using errcode = '22023';
  end if;

  update public.profiles
  set
    termos_uso_versao = p_termos_versao,
    termos_uso_aceitos_em = v_agora,
    diretrizes_comunidade_versao = p_diretrizes_versao,
    diretrizes_comunidade_aceitas_em = v_agora,
    politica_privacidade_versao = p_politica_versao,
    politica_privacidade_ciente_em = v_agora
  where user_id = v_user_id or id = v_user_id;

  if found then
    return true;
  end if;

  select coalesce(
    case
      when pg_catalog.jsonb_typeof(raw_user_meta_data -> 'nome') = 'string'
        then nullif(pg_catalog.btrim(raw_user_meta_data ->> 'nome'), '')
    end,
    case
      when pg_catalog.jsonb_typeof(raw_user_meta_data -> 'name') = 'string'
        then nullif(pg_catalog.btrim(raw_user_meta_data ->> 'name'), '')
    end,
    case
      when pg_catalog.jsonb_typeof(raw_user_meta_data -> 'full_name') = 'string'
        then nullif(pg_catalog.btrim(raw_user_meta_data ->> 'full_name'), '')
    end,
    'Usuário'
  )
  into v_nome_fonte
  from auth.users
  where id = v_user_id;

  if not found then
    raise exception 'A conta autenticada não foi encontrada.'
      using errcode = '42501';
  end if;

  v_nome := pg_catalog.left(
    pg_catalog.btrim(
      pg_catalog.regexp_replace(
        pg_catalog.regexp_replace(v_nome_fonte, '[[:cntrl:]]+', ' ', 'g'),
        '[<>]',
        '',
        'g'
      )
    ),
    80
  );
  v_nome := pg_catalog.regexp_replace(v_nome, '[[:space:]]+', ' ', 'g');

  if v_nome = '' then
    v_nome := 'Usuário';
  end if;

  insert into public.profiles (
    id,
    user_id,
    nome,
    tipo,
    termos_uso_versao,
    termos_uso_aceitos_em,
    diretrizes_comunidade_versao,
    diretrizes_comunidade_aceitas_em,
    politica_privacidade_versao,
    politica_privacidade_ciente_em
  )
  values (
    v_user_id,
    v_user_id,
    v_nome,
    'leitor',
    p_termos_versao,
    v_agora,
    p_diretrizes_versao,
    v_agora,
    p_politica_versao,
    v_agora
  )
  on conflict do nothing;

  if found then
    return true;
  end if;

  -- Uma chamada concorrente pode ter criado o perfil enquanto esta aguardava
  -- os indices unicos. Nesse caso, conclui o aceite no registro vencedor.
  update public.profiles
  set
    termos_uso_versao = p_termos_versao,
    termos_uso_aceitos_em = v_agora,
    diretrizes_comunidade_versao = p_diretrizes_versao,
    diretrizes_comunidade_aceitas_em = v_agora,
    politica_privacidade_versao = p_politica_versao,
    politica_privacidade_ciente_em = v_agora
  where user_id = v_user_id or id = v_user_id;

  if not found then
    raise exception 'Não foi possível criar ou localizar o perfil autenticado.'
      using errcode = 'P0002';
  end if;

  return true;
end;
$$;

alter function historietas_privado.aceitar_termos_publicacao(text, text, text)
  owner to postgres;

revoke all on function historietas_privado.aceitar_termos_publicacao(text, text, text)
  from public, anon, service_role;
grant execute on function historietas_privado.aceitar_termos_publicacao(text, text, text)
  to authenticated;

revoke all on function public.aceitar_termos_publicacao(text, text, text)
  from public, anon, service_role;
grant execute on function public.aceitar_termos_publicacao(text, text, text)
  to authenticated;

commit;
