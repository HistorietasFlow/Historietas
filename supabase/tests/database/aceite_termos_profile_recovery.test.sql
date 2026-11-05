begin;

select plan(8);

select ok(
  (
    select prosecdef
      and pg_get_functiondef(oid) like '%SET search_path TO ''''%'
    from pg_proc
    where oid = 'historietas_privado.aceitar_termos_publicacao(text,text,text)'::regprocedure
  ),
  'nucleo do aceite permanece SECURITY DEFINER com search_path vazio'
);

select ok(
  (
    select not prosecdef
      and pg_get_functiondef(oid) like '%SET search_path TO ''''%'
    from pg_proc
    where oid = 'public.aceitar_termos_publicacao(text,text,text)'::regprocedure
  ),
  'wrapper publico permanece SECURITY INVOKER com search_path vazio'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.aceitar_termos_publicacao(text,text,text)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'historietas_privado.aceitar_termos_publicacao(text,text,text)',
    'EXECUTE'
  ),
  'authenticated preserva acesso ao wrapper e ao nucleo privado'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.aceitar_termos_publicacao(text,text,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'historietas_privado.aceitar_termos_publicacao(text,text,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'service_role',
    'public.aceitar_termos_publicacao(text,text,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'service_role',
    'historietas_privado.aceitar_termos_publicacao(text,text,text)',
    'EXECUTE'
  ),
  'anon e service_role nao recebem acesso ao aceite'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.profiles'::regclass
  ),
  'profiles permanece com RLS habilitado'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname in (
        'profiles_insert_proprio',
        'profiles_select_publico',
        'profiles_update_proprio',
        'profiles_delete_proprio'
      )
  ),
  4,
  'policies existentes de profiles permanecem instaladas'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_user_id_key'
      and contype = 'u'
  )
  and exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_user_id_fkey'
      and contype = 'f'
  ),
  'unicidade e integridade referencial de user_id permanecem ativas'
);

select ok(
  pg_get_functiondef(
    'historietas_privado.aceitar_termos_publicacao(text,text,text)'::regprocedure
  ) like '%insert into public.profiles%'
  and pg_get_functiondef(
    'historietas_privado.aceitar_termos_publicacao(text,text,text)'::regprocedure
  ) like '%on conflict do nothing%'
  and pg_get_functiondef(
    'historietas_privado.aceitar_termos_publicacao(text,text,text)'::regprocedure
  ) like '%v_user_id,%v_user_id,%',
  'recuperacao cria somente o perfil da identidade autenticada e trata concorrencia'
);

select * from finish();

rollback;
