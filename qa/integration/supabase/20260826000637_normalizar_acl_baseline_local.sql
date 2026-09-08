-- SOMENTE TESTES LOCAIS.
--
-- O banco remoto ja tinha revogado o EXECUTE das funcoes SECURITY DEFINER
-- fora do inventario abaixo antes de a migration 20260826000638 ser criada.
-- O baseline historico nao registra todas essas revogacoes e, ao ser
-- reproduzido do zero, expoe funcoes adicionais pelo privilegio padrao de
-- PUBLIC. Esta migration auxiliar reconstitui somente essa precondicao no
-- Supabase descartavel do CI. Ela nunca deve ser copiada para as migrations
-- de producao.

begin;

create temporary table pg_temp.qa_security_definer_review (
  signature text primary key,
  core_anon boolean not null,
  core_authenticated boolean not null,
  core_service_role boolean not null
) on commit drop;

insert into pg_temp.qa_security_definer_review (
  signature,
  core_anon,
  core_authenticated,
  core_service_role
)
values
  ('public.aceitar_termos_publicacao(text,text,text)', false, true, false),
  ('public.bloquear_usuario(uuid)', false, true, false),
  ('public.cancelar_solicitacao_seguidor(uuid)', false, true, false),
  ('public.carregar_avaliacao_diario(uuid)', true, true, false),
  ('public.carregar_estado_bloqueio_usuario(uuid)', false, true, false),
  ('public.carregar_permissoes_abas_perfil(uuid)', true, true, false),
  ('public.carregar_preferencias_privacidade_publicas(uuid)', true, true, true),
  ('public.comunidade_enquete_resultados(uuid[])', false, true, false),
  ('public.comunidade_pode_ver_comentario(uuid)', true, true, false),
  ('public.comunidade_pode_ver_post(uuid)', true, true, false),
  ('public.criar_denuncia(text,uuid,text,text)', false, true, false),
  ('public.criar_denuncia_perfil(uuid,text,text,text,text)', false, true, false),
  ('public.criar_notificacao_interacao_capitulo(uuid,uuid,text,text,text,text)', false, true, false),
  ('public.criar_notificacao_social(uuid,text,text,text,text,text,uuid,uuid)', false, true, false),
  ('public.criar_notificacoes_capitulo(uuid,uuid,text,text,text,text,timestamp with time zone)', false, true, false),
  ('public.criar_problema_tecnico(text,text,text,text,text,text)', false, true, false),
  ('public.deixar_de_seguir_usuario(uuid)', false, true, false),
  ('public.desbloquear_usuario(uuid)', false, true, false),
  ('public.diario_pode_comentar(uuid)', true, true, false),
  ('public.diario_pode_ver_anotacao(uuid)', true, true, false),
  ('public.diario_pode_ver_comentarios(uuid)', true, true, false),
  ('public.diario_sem_bloqueio_com_usuario_atual(uuid)', true, true, false),
  ('public.excluir_notificacoes_lidas()', false, true, false),
  ('public.listar_meus_problemas_tecnicos(integer)', false, true, false),
  ('public.listar_minhas_denuncias(integer)', false, true, false),
  ('public.listar_reincidencias_moderacao()', false, true, false),
  ('public.listar_usuarios_bloqueados(integer)', false, true, false),
  ('public.marcar_notificacoes_lidas(text[],boolean)', false, true, false),
  ('public.notificacao_conteudo_18_liberado(uuid,uuid,text,text)', false, true, false),
  ('public.remover_avaliacao_diario(uuid)', false, true, false),
  ('public.remover_conteudo_denunciado_transacional(text,uuid,text)', false, true, false),
  ('public.remover_seguidor(uuid)', false, true, false),
  ('public.responder_solicitacao_seguidor(uuid,boolean)', false, true, false),
  ('public.rls_auto_enable()', false, false, false),
  ('public.salvar_avaliacao_diario(uuid,numeric)', false, true, false),
  ('public.solicitar_ou_seguir_usuario(uuid)', false, true, false),
  ('public.status_aceite_termos_publicacao()', false, true, false),
  ('public.usuario_e_admin()', false, true, false),
  ('public.usuario_pode_ver_aba_perfil(uuid,text)', true, true, false),
  ('public.usuario_pode_ver_perfil(uuid)', true, true, false),
  ('public.usuarios_possuem_bloqueio(uuid,uuid)', false, true, false);

do $test_migration$
declare
  function_to_normalize record;
  reviewed record;
begin
  if exists (
    select 1
    from pg_temp.qa_security_definer_review review
    where pg_catalog.to_regprocedure(review.signature) is null
  ) then
    raise exception
      'O inventario SECURITY DEFINER do teste divergiu do baseline.';
  end if;

  for function_to_normalize in
    select pg_catalog.format(
      '%I.%I(%s)',
      namespace_row.nspname,
      function_row.proname,
      pg_catalog.pg_get_function_identity_arguments(function_row.oid)
    ) as signature
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.prokind = 'f'
      and function_row.prosecdef
  loop
    execute pg_catalog.format(
      'revoke all on function %s from public, anon, authenticated, service_role',
      function_to_normalize.signature
    );
  end loop;

  for reviewed in
    select *
    from pg_temp.qa_security_definer_review
    order by signature
  loop
    if reviewed.core_anon then
      execute pg_catalog.format(
        'grant execute on function %s to anon',
        pg_catalog.to_regprocedure(reviewed.signature)::pg_catalog.regprocedure
      );
    end if;

    if reviewed.core_authenticated then
      execute pg_catalog.format(
        'grant execute on function %s to authenticated',
        pg_catalog.to_regprocedure(reviewed.signature)::pg_catalog.regprocedure
      );
    end if;

    if reviewed.core_service_role then
      execute pg_catalog.format(
        'grant execute on function %s to service_role',
        pg_catalog.to_regprocedure(reviewed.signature)::pg_catalog.regprocedure
      );
    end if;
  end loop;

  -- A migration seguinte espera as 41 funcoes ainda expostas. Esta e a
  -- unica entrada sem grant de API no inventario e sera removida por ela.
  grant execute on function public.rls_auto_enable() to public;
end;
$test_migration$;

-- O dump usado como baseline contem o handler, mas nao o event trigger que ja
-- existia no projeto remoto. A migration seguinte move o handler para o
-- schema privado e valida que o trigger continua apontando para o mesmo OID.
create event trigger ensure_rls
  on ddl_command_end
  execute function public.rls_auto_enable();

-- O projeto remoto tambem ja negava a leitura administrativa direta desta
-- tabela. A migration 20260901201213 substitui essa leitura por uma RPC minima
-- e valida a precondicao antes de concluir.
revoke select on table public.obras from service_role;

commit;
