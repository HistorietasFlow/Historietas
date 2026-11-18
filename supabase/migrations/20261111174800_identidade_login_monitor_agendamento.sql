-- Identidade de conexao do monitor. Sem senha, provisionamento ou ativacao.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

-- O novo LOGIN pode criar TEMP via PUBLIC. search_path='' nao impede que
-- relacoes temporarias sombreiem catalogos: qualificar os dois acessos do
-- caminho privilegiado, preservando corpo restante, owner, assinatura e ACL.
do $catalogos$
declare f regprocedure; d text;
begin
  foreach f in array array[
    'historietas_privado.snapshot_monitor_capitulos()'::regprocedure,
    'historietas_privado.fonte_monitor_capitulos(bigint)'::regprocedure] loop
    d:=pg_get_functiondef(f);
    if strpos(d,'from pg_extension')=0 then
      raise exception 'Contrato do catalogo do monitor divergiu.' using errcode='55000';
    end if;
    execute replace(d,'from pg_extension','from pg_catalog.pg_extension');
  end loop;
end $catalogos$;

create role historietas_agendamento_monitor_login login password null noinherit
  nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
alter role historietas_agendamento_monitor_login set statement_timeout='5s';
alter role historietas_agendamento_monitor_login set lock_timeout='500ms';
alter role historietas_agendamento_monitor_login set idle_in_transaction_session_timeout='5s';
alter role historietas_agendamento_monitor_login set default_transaction_read_only=on;

-- Os defaults do grupo NOLOGIN nao sao aplicados por SET ROLE. A conexao tem
-- seus proprios defaults, e a consulta fixa tambem usa SET LOCAL por transacao.
grant connect on database postgres to historietas_agendamento_monitor_login;
grant historietas_agendamento_monitor to historietas_agendamento_monitor_login
  with inherit false, set true, admin false;
-- Nenhum grant de tabela, schema ou funcao para o LOGIN: precisa de SET ROLE
-- explicito para usar o unico snapshot agregado ja permitido ao grupo.
comment on role historietas_agendamento_monitor_login is
  'Conexao exclusiva do monitor, sem senha na migration. NOINHERIT; somente SET ROLE historietas_agendamento_monitor. Provisionar senha fora do repositorio e homologar Supavisor/TLS separadamente. Nao autoriza runner ou schedules.';

do $$ begin
  if exists(select 1 from pg_roles where rolname='historietas_agendamento_monitor'
      and (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls))
    or exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado) then
    raise exception 'Instalacao exige grupo NOLOGIN e runner desativado.' using errcode='55000';
  end if;
  -- NOINHERIT nao remove privilegios de PUBLIC. Nao criar um LOGIN se o
  -- ambiente permitir acesso geral a relacoes (inclusive extensoes como net).
  -- Nao revogar PUBLIC globalmente para contornar uma instalacao incompatível.
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace,
      unnest(array['historietas_agendamento_monitor_login','historietas_agendamento_monitor']) r
      where n.nspname not like 'pg\_%' and n.nspname<>'information_schema'
        and has_schema_privilege(r,n.oid,'USAGE')
        and ((c.relkind in ('r','p','v','m','f') and
          (has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
            or has_any_column_privilege(r,c.oid,'SELECT,INSERT,UPDATE,REFERENCES')))
          or (c.relkind='S' and has_sequence_privilege(r,c.oid,'USAGE,SELECT,UPDATE')))) then
    raise exception 'Privilegios efetivos incompatíveis com monitor restrito.' using errcode='55000';
  end if;
end $$;
commit;
