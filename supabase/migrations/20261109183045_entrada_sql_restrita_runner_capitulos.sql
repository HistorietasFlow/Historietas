-- Fase 6B1: contrato operacional, SEM extensao, job, senha ou ativacao.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Colisao de nome falha fechada: nao reaproveitar um papel desconhecido.
create role historietas_capitulo_runner nologin noinherit nosuperuser
  nocreatedb nocreaterole noreplication nobypassrls;
alter role historietas_capitulo_runner set statement_timeout = '10s';
alter role historietas_capitulo_runner set lock_timeout = '500ms';
alter role historietas_capitulo_runner set idle_in_transaction_session_timeout = '5s';

-- Somente uma futura conexao SQL confiavel, nunca SET ROLE via PostgREST.
grant usage on schema historietas_privado to historietas_capitulo_runner;
create function historietas_privado.acionar_runner_capitulos()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  if session_user <> 'historietas_capitulo_runner'
    or current_setting('role') <> 'none' then
    raise exception 'Identidade operacional indisponivel.' using errcode='42501';
  end if;
  -- Valores precisam estar ativos ANTES da instrucao. Nao instalar timers
  -- aqui. O comando confiavel do Cron sera apenas SELECT desta funcao.
  if current_setting('statement_timeout')::interval <= interval '0'
    or current_setting('statement_timeout')::interval > interval '10 seconds'
    or current_setting('lock_timeout')::interval <= interval '0'
    or current_setting('lock_timeout')::interval > interval '500 milliseconds'
    or current_setting('lock_timeout')::interval >= current_setting('statement_timeout')::interval
    or current_setting('idle_in_transaction_session_timeout')::interval <= interval '0'
    or current_setting('idle_in_transaction_session_timeout')::interval > interval '5 seconds' then
    raise exception 'Timeouts operacionais previos obrigatorios.' using errcode='22023';
  end if;
  -- O trigger invoker diferido precisa validar enquanto esta operacao ainda
  -- possui autoridade. No commit a sessao restrita nao pode ler capitulos.
  -- Apenas este constraint, antecipado (nunca desabilitado). O runner publica
  -- somente texto e nao modifica manifestos; nenhuma permissao de tabela nova.
  set constraints public.capitulos_manifesto_integro immediate;
  -- Sem parametros, SQL dinamico, override do gate ou acesso direto a dados.
  return historietas_privado.executar_runner_capitulos(3,2000);
end;
$$;
alter function historietas_privado.acionar_runner_capitulos() owner to postgres;
revoke all on function historietas_privado.acionar_runner_capitulos()
  from public,anon,authenticated,service_role;
grant execute on function historietas_privado.acionar_runner_capitulos()
  to historietas_capitulo_runner;

-- Nao mudar o gate implicitamente em um ambiente ja ativado.
do $$ begin
  if not exists (select 1 from historietas_privado.capitulo_runner_controle
    where singleton and not habilitado) then
    raise exception 'Instalacao exige runner desativado.' using errcode='55000';
  end if;
end $$;
comment on function historietas_privado.acionar_runner_capitulos() is
  'Entrada privada fixa (3 itens/2000ms), somente sessao SQL dedicada. Defaults previos do papel devem armar timers; SET dentro do comando nao e prova. Gate false, sem Cron, ACK ou recuperacao de abortos globais.';
comment on role historietas_capitulo_runner is
  'NOLOGIN ate autorizacao operacional. Sem membros de API, BYPASSRLS ou acesso de tabela/executor. ADMIN do criador nao implica SET/heranca. Somente entrada privada; nunca entregar credencial a clientes.';
commit;
