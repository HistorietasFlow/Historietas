# Conexao dedicada do monitor SQL — preparacao sem provisionamento

Base `main` `50dcd318`. O inventario autorizado anterior confirmou em producao
o snapshot e sua ACL, mas o usuario fixo do workflow era NOLOGIN. A migration
`20261111155517_identidade_login_monitor_agendamento.sql` prepara
`historietas_agendamento_monitor_login` com LOGIN **sem senha**. Nao cria
credencial utilizavel por autenticacao de senha nem configura GitHub/Supabase.
O papel `historietas_agendamento_monitor` permanece NOLOGIN.

Antes de criar o LOGIN, a mesma migration qualifica `pg_catalog.pg_extension`
no snapshot e em `fonte_monitor_capitulos`. Um canario local comprovou que
`search_path=''` permitia sombreamento por TEMP nesse caminho. Assinaturas,
owners, ACLs e os demais corpos permanecem identicos; nao revogar TEMP de PUBLIC
nem depender de read-only mutavel para impedir essa injecao.

## Contrato de privilegios e conexao

- LOGIN sem superuser, BYPASSRLS, CREATEROLE, CREATEDB ou REPLICATION;
  NOINHERIT, sem grants de tabelas, schemas ou funcoes. CONNECT no banco postgres.
- Uma unica associacao: grupo do monitor, com SET true, INHERIT false e ADMIN
  false. O SQL fixo usa SET LOCAL ROLE para obter somente o snapshot existente.
  Nenhum vinculo de anon/authenticated/service_role com essas identidades.
- Defaults do LOGIN: statement_timeout 5 s, lock_timeout 500 ms,
  idle_in_transaction_session_timeout 5 s e default_transaction_read_only on.
  SET ROLE nao aplica defaults do grupo. A consulta fixa repete os timeouts
  com SET LOCAL em REPEATABLE READ/READ ONLY e termina com ROLLBACK.
- O resultado interno comprova session_user (LOGIN), current_user (grupo),
  isolamento, leitura e timeouts antes de ser aceito. Identidade divergente,
  contrato antigo, SQL/TLS/JSON falho ou timeout retornam apenas codigo
  BANCO_INDISPONIVEL; stdout/stderr, identidade e credenciais nao vao aos alertas.
- Um processo psql por verificacao, sem retry de conexao; connect timeout 5 s,
  limite externo 12 s e concurrency do workflow existente. Esses limites sao
  os anteriores, nao um novo orcamento ou certificacao de capacidade fisica.

Usar **Shared pooler / Session mode** do painel Connect: IPv4, porta **5432**,
usuario `historietas_agendamento_monitor_login.PROJECT_REF`. O host deve ser
copiado do painel, nao derivado da regiao. Transaction mode (6543), usuario
administrativo, URI/opcoes injetadas, host alternativo e TLS inferior a
verify-full sao recusados. O pooler apresenta cadeia da Supabase Root 2021 CA,
que nao e confiada automaticamente pelos bundles padrao testados. O workflow
usa exclusivamente `qa/certificates/supabase-prod-ca-2021.crt`, obtida por HTTPS
da fonte do painel oficial, com pin DER/validade conferidos antes da etapa v2.
Ver [proveniencia, fingerprint e rotacao](../../qa/certificates/README.md).
Nao baixar a CA do handshake SQL, modificar o trust store global, fazer download
a cada execucao ou reduzir TLS para `require`. CA ausente/invalida e hostname
incorreto falham fechados. Nao e necessario cadastrar um novo secret de CA.

### Limites que permanecem explicitos

PUBLIC e inerente a todos os papeis; NOINHERIT nao o remove. A migration aborta
se houver privilegios efetivos de relacoes/colunas/sequencias nao sistemicas
acessiveis ao LOGIN/grupo, inclusive extensoes que concedam tabelas a PUBLIC.
Nao revoga PUBLIC globalmente. Se esse guard impedir instalacao, investigar o
objeto/owner antes de provisionar; nao ignorar o guard nem ampliar permissoes.

Catalogos do Postgres, funcoes basicas e TEMP/large objects herdados de PUBLIC
nao podem ser descritos como acesso exclusivo literal a uma funcao. Defaults
read-only e timeouts sao mutaveis pelo usuario: protegem o caminho fixo do
workflow, nao substituem ACL. O segredo dedicado deve ficar restrito ao monitor.
Extensoes/novos grants exigem nova auditoria antes de conceder a credencial.

## Provisionamento posterior — exige autorizacao propria

1. Revisar/aplicar a migration pelo procedimento administrativo aprovado.
   Esta PR nao executa migrations remotas nem ativa nenhum gate.
2. Conferir atributos/membership, ausencia de grants diretos e ACL efetiva
   apos a instalacao. Para relacoes, repetir a consulta do guard incluindo
   colunas, sequencias e grants PUBLIC; confirmar que somente o grupo pode
   executar o snapshot e que nenhum outro contrato privado lhe e acessivel.
   Nao liberar senha se houver divergencia. O inventario deve usar somente
   metadados, sem ler dados pessoais ou verificadores de senha para relatorios.
3. Em sessao administrativa segura de psql, gerar uma senha exclusiva num
   gerenciador e usar `SET password_encryption='scram-sha-256';`, seguido de
   `\password historietas_agendamento_monitor_login`. Nao incluir senha em SQL
   versionado, shell, URI, logs ou historico. A sessao administrativa serve
   somente ao provisionamento; o runtime usa exclusivamente o LOGIN dedicado.
4. Copiar do painel Connect o host do **Session pooler** e conferir suporte ao
   papel customizado. Testar autenticacao, SET ROLE, session_user e defaults no
   caminho real. Supavisor local/Postgres local nao certificam o gerenciado.
5. Cadastrar posteriormente, pelo responsavel, em GitHub Repository settings
   → Secrets and variables → Actions:

| Tipo | Nome | Valor/origem |
| --- | --- | --- |
| Secret | AGENDAMENTO_MONITOR_PGHOST | Host exato do Shared Session pooler, sem protocolo ou porta |
| Secret | AGENDAMENTO_MONITOR_PGPASSWORD | Senha exclusiva desse LOGIN |
| Variable | AGENDAMENTO_MONITOR_PROJECT_REF | Ref real do projeto, 20 letras minusculas, sem ponto/sufixo |

O workflow fixa banco postgres, porta 5432, usuario composto, TLS verify-full
e CA oficial versionada. `AGENDAMENTO_MONITOR_PGPORT` deixa de ser utilizado. Nao
reutilizar senha de postgres, service role ou credencial de outro fluxo.
`AGENDAMENTO_ALERT_ISSUE`, os gates e as janelas do watchdog continuam com os
contratos existentes; o secret Sentry nao depende desta credencial SQL.

6. Em janela autorizada, conferir o gate exclusivamente do monitor e executar
   uma vez `agendamento-monitor.yml` na main com `teste_entrega=false`.
   Registrar run/attempt, etapa v2 e entrega confirmada, sem stdout SQL ou
   credenciais. Isso nao ativa schedules, runner ou publicacao. Falha de ACL,
   TLS ou identidade exige correcao, nunca fallback para usuario privilegiado.
7. Homologar Sentry separadamente conforme `sentry-watchdog-homologacao.md`.
   Dispatch manual nao gera check-in. Runner desligado e problemas operacionais
   continuam alertando, mesmo com leitura/entrega comprovadas.

Revogacao/rotacao deve considerar sessoes ja abertas e o pooler: senha removida
nao prova encerramento imediato de conexoes existentes. Suspender o chamador e
encerrar/revalidar somente sessoes desse LOGIN exige procedimento administrativo
autorizado. A repeticao local tambem comprovou autenticacao retida no cache
do Supavisor apos trocar a senha. Homologar invalidacao de cache/sessoes com o
provedor na rotacao; nao presumir revogacao imediata pela mudanca da senha.
Nenhum mecanismo automatico de revogacao foi instalado aqui.

## Validacao e limites da evidencia

Unidades cobrem a selecao do pooler/usuario, TLS obrigatorio, identidade devolvida,
timeouts, falhas e a cadeia de prova/entrega do monitor, watchdog e Sentry.
pgTAP verifica papeis, ACL e impossibilidade de escalada/abertura de gates.
Integracao local usa senha efemera, TCP, certificado de teste, HBA SCRAM/TLS
restrito ao LOGIN e o mesmo SQL do workflow. Restaura senha nula e configuracao
local; nao toca na producao. Tambem testa a identidade com sufixo pelo Supavisor
SESSION da CLI, sem TLS nessa perna local (a CLI nao o fornece). A CI habilita
somente esse pooler descartavel no config gerado. Para executar localmente,
habilitar `[db.pooler] enabled = true` e `pool_mode = "session"` antes de iniciar
o descartavel. Nao copiar isso para producao. Ver resultados finais no Memory Bank/PR.
Como a senha da fixture muda a cada teste, o ensaio reinicia apenas o pooler
descartavel para invalidar cache/sessoes antes e depois, com verificacao de
readiness; nao faz retry de autenticacao. Esse reinicio nao e um procedimento
aprovado para o ambiente gerenciado.

A cadeia/hostname do pooler gerenciado foi validada sem senha por Node e psql
Linux: CA correta aceita; CA ausente/invalida e hostname errado rejeitados.
O psql parou em `no password supplied`, sem executar SQL remoto. Isso nao
certifica autenticacao nem a perna interna pooler/Postgres.

Permanecem pendentes: provisionamento autorizado, autenticacao do LOGIN no
Supavisor gerenciado, execucao psql no runner efetivo, execucao real v2,
entrega de alerta/check-in e homologacao de ausencia/falha/recuperacao. Nenhum
teste sintetico ou local e apresentado como essa homologacao operacional.

Fontes: [Supabase: conexoes e pooler](https://supabase.com/docs/guides/database/connecting-to-postgres),
[Supabase: papeis e logins](https://supabase.com/docs/guides/database/postgres/roles),
[Supabase: privilegios herdados de PUBLIC](https://supabase.com/kb/troubleshooting/custom-role-inherits-privileges-that-were-not-explicitly-granted-ddaa1c).
