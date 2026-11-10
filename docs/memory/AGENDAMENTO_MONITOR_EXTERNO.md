# Agendamento — 6D2: verificação externa e alerta, sem ativação

Base: main `8976a7d3` (#2251), em 09/11/2026. **NÃO APTO para monitoramento
operacional automático.** Esta preparação não resolve a certificação gerenciada
6D1, a observação independente contínua, a entrega ao responsável nem a
capacidade física. Não habilita Cron, runner, publicação ou uploads ilustrados.

## Reaproveitamento e implementação

O observador da 6B2 continua sendo a única rotina que importa o histórico,
registra incidentes e pausa após três falhas observadas. Não foi modificado.
O novo verificador NÃO chama esse observador, não altera gates, não retoma
execução e não confirma a outbox. Uma consulta de saúde não substitui o
acionamento independente do observador.

Migration `20261110014753_snapshot_monitor_externo_agendamento.sql`:

- Papel `historietas_agendamento_monitor` nasce NOLOGIN, sem membros de API,
  herança, superuser, BYPASSRLS ou acesso direto às tabelas privadas/Auth.
- Apenas USAGE no schema privado e EXECUTE em snapshot sem argumentos. A função
  definer, de proprietário postgres e search_path vazio, reutiliza saúde,
  capacidade e validação da fonte existentes. Acrescenta apenas estado/horários
  da última execução real do job; não retorna erros livres, comando, identidade
  de usuários ou conteúdo. Nenhum wrapper público/Data API novo.
- Defaults: leitura somente, statement_timeout 5 s, lock_timeout 500 ms,
  idle-in-transaction 5 s. Nunca provisionar senha de postgres/service_role para
  o verificador. LOGIN, senha restrita, acesso SQL/TLS e CA precisam de aprovação
  e certificação próprias; a migration não os habilita.

`qa/scripts/chapter-scheduling-monitor.mjs` abre uma transação SQL fixa
REPEATABLE READ / READ ONLY via psql. Exige o papel dedicado, TLS verify-full e
CA configurada; conexão limitada a 5 s e processo a 12 s. Credenciais somente
no ambiente do processo, nunca em argumentos, relatórios ou logs. Erros livres
do cliente SQL não são publicados. BANCO_INDISPONIVEL significa leitura
indisponível: pode ser rede, TLS, autenticação, timeout ou servidor; não é prova
isolada de queda do banco.

O relatório externo tem somente versão, horário UTC e códigos de uma allowlist.
Detecta gate desativado, monitor ausente/atrasado, fonte inválida, ausência ou
atraso de execução, falha/incerteza, pausa, incidentes, retries esgotados,
atraso de backlog e alertas/bloqueios de capacidade. Estado preparatório não é
apresentado como operação saudável. Atraso de observação/execução: 180 s;
backlog: 300 s; execução incerta: 30 s. São critérios de diagnóstico, não SLA.
Nenhuma medida instantânea passa a garantir espaço físico/WAL.

## Canal GitHub e limitações de entrega

Responsável escolheu uma issue de teste. Criada com sucesso a
[issue #2252](https://github.com/HistorietasFlow/Historietas/issues/2252),
explicitamente não produtiva e sem informações privadas. Ela permanece aberta;
nenhum fechamento automático é implementado.

O adaptador de entrega publica comentários somente numa issue previamente
aprovada pelo marcador `historietas-agendamento-monitor:v1`, no repositório
fixo. Não cria issues a cada checagem. Lê até duas páginas para consultar os
últimos 100 comentários e considera somente o autor confiável
`github-actions[bot]`. Comentários de outros usuários não confirmam entrega.
Sem histórico confiável após esse limite, falha fechada e exige intervenção.

Compara códigos para evitar avisos repetidos. Na recuperação, publica mensagem
informativa, sem fechar issue ou remover pausa. Relatórios antigos são
descartados. Não repete POST automaticamente: resposta perdida é erro até que
uma checagem posterior encontre o comentário. O workflow serializa escritores;
execuções externas simultâneas não possuem CAS na API do GitHub e NÃO estão
certificadas. Manter um único escritor autorizado.

**Entrega real ainda incompleta:** a leitura local restrita produziu o relatório
com gate fechado e preservou a outbox. O mesmo adaptador foi acionado com
transporte pelos conectores GitHub, mas o conector de comentário aceita apenas
destino de PR. A revisão de segurança bloqueou usá-lo para a issue #2252.
Não foi contornado o bloqueio e nenhum comentário foi publicado. A criação da
issue foi real; NÃO comprova entrega do alerta gerado, credencial do bot ou
notificação recebida pelo responsável. Não existe GITHUB_TOKEN disponível
localmente e não foram extraídas credenciais de outros meios.

Para concluir: realizar teste explícito com o GITHUB_TOKEN do workflow manual,
após autorização/configuração do canal de homologação, ou disponibilizar um
conector de comentários de issues apropriado. Não solicitar tokens em texto.
Confirmar recebimento pelo responsável/assinante na interface GitHub; sucesso
HTTP/API não garante e-mail, push ou leitura humana. Não usar dados privados em
uma issue pública, mesmo após o teste.

## Acionamento, alternativas e custo

`.github/workflows/agendamento-monitor.yml` é somente workflow_dispatch,
sem schedule/push/pull_request. O job ainda exige variável
`AGENDAMENTO_MONITOR_AUTORIZADO=true`; ela NÃO foi configurada nesta fase.
O padrão é teste de transporte sem conexão ao banco. Leitura real exige escolha
explícita, credenciais exclusivas e conexão homologada. Não executado Actions
manualmente nem alterados secrets/variáveis do repositório nesta fase.

O repositório é público. Runners Ubuntu padrão têm gratuidade de compute no
GitHub; não usar runners maiores nem artefatos/caches neste verificador. Sem
novas dependências, Vercel Cron ou serviço pago. A extensão e a consulta usam
os recursos existentes do Supabase; consulta agregada tem custo proporcional
às intenções e timeout, não custo zero. Históricos/índices continuam consumindo
armazenamento e exigem orçamento.

Uma futura cadência de 15 min fora da hora cheia representaria cerca de 2.880
execuções/mês de 30 dias. NÃO foi adicionada. GitHub permite intervalo mínimo
de 5 min, mas pode atrasar ou descartar disparos e desabilita schedules públicos
após 60 dias sem atividade. Portanto não oferece atraso máximo garantido nem
pausa antes do quarto disparo do runner de 15–60 s. Também não detecta sozinho
a ausência do próprio workflow quando GitHub está indisponível.

Alternativas avaliadas:

- Observador via pg_cron: necessário para a pausa transacional, mas compartilha
  falhas/indisponibilidade do banco. Não substitui verificador externo.
- Sentry existente: pode receber diagnóstico/erros, mas alertas de heartbeat e
  notificações precisam de canal/quota/plano e teste próprios; não presumir
  recurso gratuito nem confundir Sentry dentro do app com observação externa.
- Processo local/self-hosted: reutilizável para testes, mas depende do computador,
  energia e rede do responsável, sem disponibilidade contínua comprovada.
- Healthchecks.io Hobbyist: alternativa de heartbeat externo a US$ 0, até 20
  jobs e 100 entradas de log por job. Adicionaria conta, segredo de ping e
  dependência; não foi contratado/configurado. Só faria sentido após avaliar
  primeiro a capacidade do Sentry existente e testar ausência de heartbeat.

## Recuperação e critérios de ativação

1. Alerta: manter gates fechados; checar leitura SQL/TLS, fonte, histórico e
   incidentes privados por sessão administrativa aprovada. Não publicar SQL ou
   respostas brutas na issue.
2. Preservar outbox e falhas. Não limpar pendências, inventar ACK, zerar retries
   ou reativar em função de um aviso de recuperação.
3. Tratar a causa; usar a retomada administrativa existente com revisão atual.
   Ela não habilita gate/job. Uma nova pausa não pode ser removida por resposta
   antiga.
4. Canal indisponível/403/timeout/histórico sem confiança: execução termina com
   falha, não registra entrega. Repetir a checagem reconciliando o canal, não
   reenviar POST cegamente.
5. Ausência do próprio verificador requer supervisão independente/contrato
   operacional explícito. Não prometer alerta durante falha conjunta de GitHub,
   responsável e Supabase.

Ativação depende de: leitura restrita/TLS e timeouts certificados no destino;
teste real de alerta e recebimento; responsável e canal inscritos; cadência e
atraso best-effort explicitamente aceitos; acionamento independente do observador
e recuperação/ausência do próprio verificador tratados; capacidade e demais
bloqueadores 6C resolvidos. Nada nesta PR autoriza ativação automática.

## Evidências de validação

- Unitários do classificador/transporte: casos de falha, deduplicação,
  recuperação, resposta perdida, relatório antigo, comentário forjado,
  paginação, destino externo, 403 e configuração do workflow manual: **13/13**.
- pgTAP local: **32/32**, incluindo 18 novos e 14 da entrada legada. Primeiro harness parou em helper pgTAP inacessível ao
  papel restrito; corrigida apenas a troca de papel em helper temporário da
  transação, sem conceder permissões adicionais na migration.
- Leitura real no descartável: códigos EXECUCAO_AUSENTE, FONTE_INVALIDA,
  MONITOR_ATRASADO, MONITOR_NAO_CONFIGURADO, PAUSA_ATIVA e RUNNER_DESATIVADO.
  Monitor externo novamente NOLOGIN ao final; runner falso e 14 eventos intactos.
- Lint, Typecheck, Build, audit de produção (zero), paginação e sessão aprovados.
- Auditoria estática no workspace original: 198/199; falha no guard que proíbe
  a migration auxiliar local preexistente `20260826000637`. Ela foi preservada,
  não removida nem versionada. Worktree limpo do commit da fase, sem esse
  arquivo: npm ci, estática **199/199**, **534 unitários existentes** e os
  **13/13** novos aprovados. Nenhuma asserção foi alterada para contornar o guard.
- Não executados testes destrutivos/remotos ou suíte E2E completa: não há
  alteração de UI/fluxos da aplicação. Não afirmar suíte completa aprovada.

Fontes primárias:

- [Schedules: atrasos, descarte, cadência e desativação](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
- [Custos do Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- [Supabase Cron](https://supabase.com/docs/guides/cron).
- [Concessões mínimas PostgreSQL](https://www.postgresql.org/docs/17/sql-grant.html).
- [Limites gratuitos Healthchecks.io](https://healthchecks.io/pricing/).
