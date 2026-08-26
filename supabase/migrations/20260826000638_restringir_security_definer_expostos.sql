begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- SECURITY DEFINER continua permitido somente no nucleo nao exposto. As
-- assinaturas publicas usadas pelo aplicativo passam a ser wrappers
-- SECURITY INVOKER; helpers internos deixam de ser RPCs executaveis.
create schema if not exists historietas_privado;

revoke all on schema historietas_privado from public;
revoke create on schema historietas_privado
  from anon, authenticated, service_role;
grant usage on schema historietas_privado
  to anon, authenticated, service_role;

-- Novas funcoes devem declarar os grants deliberadamente. O owner postgres e
-- o papel usado pelas migrations deste projeto.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema historietas_privado
  revoke execute on functions from public, anon, authenticated, service_role;

create temporary table pg_temp.security_definer_review (
  signature text primary key,
  wrapper_mode text not null check (wrapper_mode in ('api', 'internal', 'none')),
  core_anon boolean not null,
  core_authenticated boolean not null,
  core_service_role boolean not null
) on commit drop;

insert into pg_temp.security_definer_review (
  signature,
  wrapper_mode,
  core_anon,
  core_authenticated,
  core_service_role
)
values
  ('public.aceitar_termos_publicacao(text,text,text)', 'api', false, true, false),
  ('public.bloquear_usuario(uuid)', 'api', false, true, false),
  ('public.cancelar_solicitacao_seguidor(uuid)', 'api', false, true, false),
  ('public.carregar_avaliacao_diario(uuid)', 'api', true, true, false),
  ('public.carregar_estado_bloqueio_usuario(uuid)', 'api', false, true, false),
  ('public.carregar_permissoes_abas_perfil(uuid)', 'api', true, true, false),
  ('public.carregar_preferencias_privacidade_publicas(uuid)', 'api', true, true, true),
  ('public.comunidade_enquete_resultados(uuid[])', 'api', false, true, false),
  ('public.comunidade_pode_ver_comentario(uuid)', 'internal', true, true, false),
  ('public.comunidade_pode_ver_post(uuid)', 'internal', true, true, false),
  ('public.criar_denuncia(text,uuid,text,text)', 'api', false, true, false),
  ('public.criar_denuncia_perfil(uuid,text,text,text,text)', 'api', false, true, false),
  ('public.criar_notificacao_interacao_capitulo(uuid,uuid,text,text,text,text)', 'api', false, true, false),
  ('public.criar_notificacao_social(uuid,text,text,text,text,text,uuid,uuid)', 'api', false, true, false),
  ('public.criar_notificacoes_capitulo(uuid,uuid,text,text,text,text,timestamp with time zone)', 'api', false, true, false),
  ('public.criar_problema_tecnico(text,text,text,text,text,text)', 'api', false, true, false),
  ('public.deixar_de_seguir_usuario(uuid)', 'api', false, true, false),
  ('public.desbloquear_usuario(uuid)', 'api', false, true, false),
  ('public.diario_pode_comentar(uuid)', 'internal', true, true, false),
  ('public.diario_pode_ver_anotacao(uuid)', 'internal', true, true, false),
  ('public.diario_pode_ver_comentarios(uuid)', 'internal', true, true, false),
  ('public.diario_sem_bloqueio_com_usuario_atual(uuid)', 'internal', true, true, false),
  ('public.excluir_notificacoes_lidas()', 'api', false, true, false),
  ('public.listar_meus_problemas_tecnicos(integer)', 'api', false, true, false),
  ('public.listar_minhas_denuncias(integer)', 'api', false, true, false),
  ('public.listar_reincidencias_moderacao()', 'api', false, true, false),
  ('public.listar_usuarios_bloqueados(integer)', 'api', false, true, false),
  ('public.marcar_notificacoes_lidas(text[],boolean)', 'api', false, true, false),
  ('public.notificacao_conteudo_18_liberado(uuid,uuid,text,text)', 'internal', false, true, false),
  ('public.remover_avaliacao_diario(uuid)', 'api', false, true, false),
  ('public.remover_conteudo_denunciado_transacional(text,uuid,text)', 'api', false, true, false),
  ('public.remover_seguidor(uuid)', 'api', false, true, false),
  ('public.responder_solicitacao_seguidor(uuid,boolean)', 'api', false, true, false),
  ('public.rls_auto_enable()', 'none', false, false, false),
  ('public.salvar_avaliacao_diario(uuid,numeric)', 'api', false, true, false),
  ('public.solicitar_ou_seguir_usuario(uuid)', 'api', false, true, false),
  ('public.status_aceite_termos_publicacao()', 'api', false, true, false),
  ('public.usuario_e_admin()', 'api', false, true, false),
  ('public.usuario_pode_ver_aba_perfil(uuid,text)', 'api', true, true, false),
  ('public.usuario_pode_ver_perfil(uuid)', 'api', true, true, false),
  ('public.usuarios_possuem_bloqueio(uuid,uuid)', 'internal', false, true, false);

do $migration$
declare
  reviewed record;
  function_oid oid;
  function_name name;
  function_argtypes oidvector;
  function_type_args text;
  function_all_args text;
  function_result text;
  function_returns_set boolean;
  function_nargs integer;
  function_volatility "char";
  function_volatility_sql text;
  function_owner name;
  function_is_definer boolean;
  function_comment text;
  function_has_public_execute boolean;
  current_anon boolean;
  current_authenticated boolean;
  current_service_role boolean;
  private_signature text;
  public_signature text;
  call_args text;
  wrapper_body text;
  exposed_count integer;
begin
  select count(*)
  into exposed_count
  from pg_catalog.pg_proc function_row
  join pg_catalog.pg_namespace namespace_row
    on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname = 'public'
    and function_row.prokind = 'f'
    and function_row.prosecdef
    and (
      pg_catalog.has_function_privilege('anon', function_row.oid, 'EXECUTE')
      or pg_catalog.has_function_privilege(
        'authenticated',
        function_row.oid,
        'EXECUTE'
      )
    );

  if exposed_count <> 41 then
    raise exception
      'Precondicao falhou: eram esperadas 41 funcoes SECURITY DEFINER expostas; encontradas %.',
      exposed_count;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.prokind = 'f'
      and function_row.prosecdef
      and (
        pg_catalog.has_function_privilege('anon', function_row.oid, 'EXECUTE')
        or pg_catalog.has_function_privilege(
          'authenticated',
          function_row.oid,
          'EXECUTE'
        )
      )
      and function_row.oid not in (
        select pg_catalog.to_regprocedure(review.signature)::oid
        from pg_temp.security_definer_review review
      )
  ) then
    raise exception
      'Precondicao falhou: existe SECURITY DEFINER exposto fora do inventario revisado.';
  end if;

  for reviewed in
    select *
    from pg_temp.security_definer_review
    order by signature
  loop
    function_oid := pg_catalog.to_regprocedure(reviewed.signature);

    if function_oid is null then
      raise exception 'Funcao revisada ausente: %.', reviewed.signature;
    end if;

    select
      function_row.proname,
      function_row.proargtypes,
      pg_catalog.oidvectortypes(function_row.proargtypes),
      pg_catalog.pg_get_function_arguments(function_row.oid),
      pg_catalog.pg_get_function_result(function_row.oid),
      function_row.proretset,
      function_row.pronargs,
      function_row.provolatile,
      pg_catalog.pg_get_userbyid(function_row.proowner),
      function_row.prosecdef,
      pg_catalog.obj_description(function_row.oid, 'pg_proc'),
      pg_catalog.has_function_privilege('anon', function_row.oid, 'EXECUTE'),
      pg_catalog.has_function_privilege(
        'authenticated',
        function_row.oid,
        'EXECUTE'
      ),
      pg_catalog.has_function_privilege(
        'service_role',
        function_row.oid,
        'EXECUTE'
      ),
      exists (
        select 1
        from pg_catalog.aclexplode(
          coalesce(
            function_row.proacl,
            pg_catalog.acldefault('f', function_row.proowner)
          )
        ) acl
        where acl.grantee = 0
          and acl.privilege_type = 'EXECUTE'
      )
    into
      function_name,
      function_argtypes,
      function_type_args,
      function_all_args,
      function_result,
      function_returns_set,
      function_nargs,
      function_volatility,
      function_owner,
      function_is_definer,
      function_comment,
      current_anon,
      current_authenticated,
      current_service_role,
      function_has_public_execute
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = function_row.pronamespace
    where function_row.oid = function_oid
      and namespace_row.nspname = 'public'
      and function_row.prokind = 'f';

    if function_owner <> 'postgres' or not function_is_definer then
      raise exception
        'Precondicao falhou para %: owner=% security_definer=%.',
        reviewed.signature,
        function_owner,
        function_is_definer;
    end if;

    if reviewed.wrapper_mode <> 'none'
       and (
         current_anon <> reviewed.core_anon
         or current_authenticated <> reviewed.core_authenticated
         or current_service_role <> reviewed.core_service_role
         or function_has_public_execute
       ) then
      raise exception
        'ACL inesperada antes da migracao para %.',
        reviewed.signature;
    end if;

    if reviewed.wrapper_mode = 'none'
       and reviewed.signature <> 'public.rls_auto_enable()' then
      raise exception 'Modo none inesperado para %.', reviewed.signature;
    end if;

    if exists (
      select 1
      from pg_catalog.pg_proc private_function
      join pg_catalog.pg_namespace private_namespace
        on private_namespace.oid = private_function.pronamespace
      where private_namespace.nspname = 'historietas_privado'
        and private_function.proname = function_name
        and private_function.proargtypes = function_argtypes
    ) then
      raise exception
        'Conflito: historietas_privado ja contem a assinatura de %.',
        reviewed.signature;
    end if;

    execute pg_catalog.format(
      'alter function %I.%I(%s) set schema %I',
      'public',
      function_name,
      function_type_args,
      'historietas_privado'
    );

    private_signature := pg_catalog.format(
      '%I.%I(%s)',
      'historietas_privado',
      function_name,
      function_type_args
    );

    execute pg_catalog.format(
      'revoke all on function %s from public, anon, authenticated, service_role',
      private_signature
    );

    if reviewed.core_anon then
      execute pg_catalog.format(
        'grant execute on function %s to anon',
        private_signature
      );
    end if;

    if reviewed.core_authenticated then
      execute pg_catalog.format(
        'grant execute on function %s to authenticated',
        private_signature
      );
    end if;

    if reviewed.core_service_role then
      execute pg_catalog.format(
        'grant execute on function %s to service_role',
        private_signature
      );
    end if;

    if reviewed.wrapper_mode = 'none' then
      continue;
    end if;

    select coalesce(
      pg_catalog.string_agg('$' || argument_number::text, ', ' order by argument_number),
      ''
    )
    into call_args
    from pg_catalog.generate_series(1, function_nargs) argument_number;

    if function_returns_set then
      wrapper_body := pg_catalog.format(
        'select * from %I.%I(%s)',
        'historietas_privado',
        function_name,
        call_args
      );
    else
      wrapper_body := pg_catalog.format(
        'select %I.%I(%s)',
        'historietas_privado',
        function_name,
        call_args
      );
    end if;

    function_volatility_sql := case function_volatility
      when 'i' then 'immutable'
      when 's' then 'stable'
      else 'volatile'
    end;

    execute pg_catalog.format(
      'create function %I.%I(%s) returns %s language sql %s security invoker set search_path = '''' as %L',
      'public',
      function_name,
      function_all_args,
      function_result,
      function_volatility_sql,
      wrapper_body
    );

    public_signature := pg_catalog.format(
      '%I.%I(%s)',
      'public',
      function_name,
      function_type_args
    );

    execute pg_catalog.format(
      'alter function %s owner to postgres',
      public_signature
    );

    execute pg_catalog.format(
      'revoke all on function %s from public, anon, authenticated, service_role',
      public_signature
    );

    if reviewed.wrapper_mode = 'api' and reviewed.core_anon then
      execute pg_catalog.format(
        'grant execute on function %s to anon',
        public_signature
      );
    end if;

    if reviewed.wrapper_mode = 'api' and reviewed.core_authenticated then
      execute pg_catalog.format(
        'grant execute on function %s to authenticated',
        public_signature
      );
    end if;

    if reviewed.wrapper_mode = 'api' and reviewed.core_service_role then
      execute pg_catalog.format(
        'grant execute on function %s to service_role',
        public_signature
      );
    end if;

    if function_comment is not null then
      execute pg_catalog.format(
        'comment on function %s is %L',
        public_signature,
        function_comment
      );
    end if;
  end loop;
end;
$migration$;

comment on function historietas_privado.rls_auto_enable() is
  'Event trigger interno que habilita RLS em novas tabelas public; sem endpoint RPC e sem EXECUTE para papeis da API.';

do $postconditions$
declare
  reviewed record;
  public_oid oid;
  private_oid oid;
  function_name name;
  function_type_args text;
  public_is_definer boolean;
  private_is_definer boolean;
  public_owner name;
  private_owner name;
  public_settings text[];
begin
  if pg_catalog.to_regprocedure('public.rls_auto_enable()') is not null then
    raise exception 'public.rls_auto_enable() ainda existe.';
  end if;

  private_oid := pg_catalog.to_regprocedure(
    'historietas_privado.rls_auto_enable()'
  );

  if private_oid is null
     or pg_catalog.has_function_privilege('anon', private_oid, 'EXECUTE')
     or pg_catalog.has_function_privilege(
       'authenticated',
       private_oid,
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'service_role',
       private_oid,
       'EXECUTE'
     ) then
    raise exception 'O event trigger de RLS nao ficou isolado.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_event_trigger event_row
    join pg_catalog.pg_proc function_row
      on function_row.oid = event_row.evtfoid
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = function_row.pronamespace
    where event_row.evtname = 'ensure_rls'
      and namespace_row.nspname = 'historietas_privado'
      and function_row.proname = 'rls_auto_enable'
      and event_row.evtenabled <> 'D'
  ) then
    raise exception 'O event trigger ensure_rls perdeu seu handler interno.';
  end if;

  for reviewed in
    select *
    from pg_temp.security_definer_review
    order by signature
  loop
    select
      function_row.proname,
      pg_catalog.oidvectortypes(function_row.proargtypes)
    into function_name, function_type_args
    from pg_catalog.pg_proc function_row
    where function_row.oid = pg_catalog.to_regprocedure(reviewed.signature);

    if reviewed.wrapper_mode = 'none' then
      function_name := 'rls_auto_enable';
      function_type_args := '';
    end if;

    private_oid := pg_catalog.to_regprocedure(
      pg_catalog.format(
        '%I.%I(%s)',
        'historietas_privado',
        function_name,
        function_type_args
      )
    );

    if private_oid is null then
      raise exception 'Nucleo privilegiado ausente para %.', reviewed.signature;
    end if;

    select
      function_row.prosecdef,
      pg_catalog.pg_get_userbyid(function_row.proowner)
    into private_is_definer, private_owner
    from pg_catalog.pg_proc function_row
    where function_row.oid = private_oid;

    if not private_is_definer or private_owner <> 'postgres' then
      raise exception
        'Nucleo invalido para %: owner=% security_definer=%.',
        reviewed.signature,
        private_owner,
        private_is_definer;
    end if;

    if pg_catalog.has_function_privilege('anon', private_oid, 'EXECUTE')
         <> reviewed.core_anon
       or pg_catalog.has_function_privilege(
         'authenticated',
         private_oid,
         'EXECUTE'
       ) <> reviewed.core_authenticated
       or pg_catalog.has_function_privilege(
         'service_role',
         private_oid,
         'EXECUTE'
       ) <> reviewed.core_service_role then
      raise exception 'ACL privada divergente para %.', reviewed.signature;
    end if;

    if reviewed.wrapper_mode = 'none' then
      continue;
    end if;

    public_oid := pg_catalog.to_regprocedure(reviewed.signature);

    if public_oid is null then
      raise exception 'Wrapper publico ausente para %.', reviewed.signature;
    end if;

    select
      function_row.prosecdef,
      pg_catalog.pg_get_userbyid(function_row.proowner),
      function_row.proconfig
    into public_is_definer, public_owner, public_settings
    from pg_catalog.pg_proc function_row
    where function_row.oid = public_oid;

    if public_is_definer
       or public_owner <> 'postgres'
       or not ('search_path=""' = any(public_settings)) then
      raise exception
        'Wrapper publico inseguro para %: owner=% security_definer=% settings=%.',
        reviewed.signature,
        public_owner,
        public_is_definer,
        public_settings;
    end if;

    if exists (
      select 1
      from pg_catalog.pg_proc public_function
      join pg_catalog.pg_proc private_function
        on private_function.oid = private_oid
      where public_function.oid = public_oid
        and (
          public_function.prorettype <> private_function.prorettype
          or public_function.proretset <> private_function.proretset
          or public_function.pronargs <> private_function.pronargs
          or public_function.proargtypes <> private_function.proargtypes
          or public_function.pronargdefaults
            <> private_function.pronargdefaults
          or coalesce(public_function.proallargtypes, '{}'::oid[])
            <> coalesce(private_function.proallargtypes, '{}'::oid[])
          or coalesce(public_function.proargmodes, '{}'::"char"[])
            <> coalesce(private_function.proargmodes, '{}'::"char"[])
          or coalesce(public_function.proargnames, '{}'::text[])
            <> coalesce(private_function.proargnames, '{}'::text[])
          or public_function.provolatile <> private_function.provolatile
          or coalesce(
            pg_catalog.pg_get_expr(public_function.proargdefaults, 0),
            ''
          ) <> coalesce(
            pg_catalog.pg_get_expr(private_function.proargdefaults, 0),
            ''
          )
        )
    ) then
      raise exception
        'Wrapper publico alterou o contrato de %.',
        reviewed.signature;
    end if;

    if pg_catalog.has_function_privilege('anon', public_oid, 'EXECUTE')
         <> (reviewed.wrapper_mode = 'api' and reviewed.core_anon)
       or pg_catalog.has_function_privilege(
         'authenticated',
         public_oid,
         'EXECUTE'
       ) <> (
         reviewed.wrapper_mode = 'api'
         and reviewed.core_authenticated
       )
       or pg_catalog.has_function_privilege(
         'service_role',
         public_oid,
         'EXECUTE'
       ) <> (
         reviewed.wrapper_mode = 'api'
         and reviewed.core_service_role
       ) then
      raise exception 'ACL publica divergente para %.', reviewed.signature;
    end if;
  end loop;

  if exists (
    select 1
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.prokind = 'f'
      and function_row.prosecdef
      and (
        pg_catalog.has_function_privilege('anon', function_row.oid, 'EXECUTE')
        or pg_catalog.has_function_privilege(
          'authenticated',
          function_row.oid,
          'EXECUTE'
        )
      )
  ) then
    raise exception 'Ainda existe SECURITY DEFINER publico executavel pela API.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_default_acl default_acl
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = default_acl.defaclnamespace
    cross join lateral pg_catalog.aclexplode(default_acl.defaclacl) acl
    where pg_catalog.pg_get_userbyid(default_acl.defaclrole) = 'postgres'
      and namespace_row.nspname in ('public', 'historietas_privado')
      and default_acl.defaclobjtype = 'f'
      and acl.privilege_type = 'EXECUTE'
      and (
        acl.grantee = 0
        or acl.grantee in (
          'anon'::regrole::oid,
          'authenticated'::regrole::oid,
          'service_role'::regrole::oid
        )
      )
  ) then
    raise exception 'Default privileges ainda autoexpoem novas funcoes.';
  end if;
end;
$postconditions$;

notify pgrst, 'reload schema';

commit;
