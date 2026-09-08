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
  signature text primary key
) on commit drop;

insert into pg_temp.qa_security_definer_review (signature)
values
  ('public.aceitar_termos_publicacao(text,text,text)'),
  ('public.bloquear_usuario(uuid)'),
  ('public.cancelar_solicitacao_seguidor(uuid)'),
  ('public.carregar_avaliacao_diario(uuid)'),
  ('public.carregar_estado_bloqueio_usuario(uuid)'),
  ('public.carregar_permissoes_abas_perfil(uuid)'),
  ('public.carregar_preferencias_privacidade_publicas(uuid)'),
  ('public.comunidade_enquete_resultados(uuid[])'),
  ('public.comunidade_pode_ver_comentario(uuid)'),
  ('public.comunidade_pode_ver_post(uuid)'),
  ('public.criar_denuncia(text,uuid,text,text)'),
  ('public.criar_denuncia_perfil(uuid,text,text,text,text)'),
  ('public.criar_notificacao_interacao_capitulo(uuid,uuid,text,text,text,text)'),
  ('public.criar_notificacao_social(uuid,text,text,text,text,text,uuid,uuid)'),
  ('public.criar_notificacoes_capitulo(uuid,uuid,text,text,text,text,timestamp with time zone)'),
  ('public.criar_problema_tecnico(text,text,text,text,text,text)'),
  ('public.deixar_de_seguir_usuario(uuid)'),
  ('public.desbloquear_usuario(uuid)'),
  ('public.diario_pode_comentar(uuid)'),
  ('public.diario_pode_ver_anotacao(uuid)'),
  ('public.diario_pode_ver_comentarios(uuid)'),
  ('public.diario_sem_bloqueio_com_usuario_atual(uuid)'),
  ('public.excluir_notificacoes_lidas()'),
  ('public.listar_meus_problemas_tecnicos(integer)'),
  ('public.listar_minhas_denuncias(integer)'),
  ('public.listar_reincidencias_moderacao()'),
  ('public.listar_usuarios_bloqueados(integer)'),
  ('public.marcar_notificacoes_lidas(text[],boolean)'),
  ('public.notificacao_conteudo_18_liberado(uuid,uuid,text,text)'),
  ('public.remover_avaliacao_diario(uuid)'),
  ('public.remover_conteudo_denunciado_transacional(text,uuid,text)'),
  ('public.remover_seguidor(uuid)'),
  ('public.responder_solicitacao_seguidor(uuid,boolean)'),
  ('public.rls_auto_enable()'),
  ('public.salvar_avaliacao_diario(uuid,numeric)'),
  ('public.solicitar_ou_seguir_usuario(uuid)'),
  ('public.status_aceite_termos_publicacao()'),
  ('public.usuario_e_admin()'),
  ('public.usuario_pode_ver_aba_perfil(uuid,text)'),
  ('public.usuario_pode_ver_perfil(uuid)'),
  ('public.usuarios_possuem_bloqueio(uuid,uuid)');

do $test_migration$
declare
  unreviewed record;
begin
  if exists (
    select 1
    from pg_temp.qa_security_definer_review review
    where pg_catalog.to_regprocedure(review.signature) is null
  ) then
    raise exception
      'O inventario SECURITY DEFINER do teste divergiu do baseline.';
  end if;

  for unreviewed in
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
      and function_row.oid not in (
        select pg_catalog.to_regprocedure(review.signature)::oid
        from pg_temp.qa_security_definer_review review
      )
  loop
    execute pg_catalog.format(
      'revoke all on function %s from public, anon, authenticated, service_role',
      unreviewed.signature
    );
  end loop;
end;
$test_migration$;

commit;
