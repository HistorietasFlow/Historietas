# Agendamento — 6D8: registro idempotente, protecao parcial

Base: main `09e72739` (#2256). Sem ativacao, Cron ou upload ilustrado.

## Auditoria e escolha de escopo

A reivindicacao existente limita o lote a cinco e usa FOR UPDATE SKIP LOCKED,
lease de dois minutos e prioridade por tentativas/data/ID. Dois consumidores
podem receber eventos distintos. Expiracao permite recuperar uma solicitacao
perdida; nao comprova flush, nao elimina eventos nem publica novamente.

O registro anterior executava UPDATE solicitada_em=coalesce(solicitada_em,...)
em TODO retry valido, inclusive quando o valor ja existia. O PostgreSQL ainda
criava versoes de linha e WAL. Este efeito repetido e independente da ausencia
de ACK do Next e pode ser removido sem mudar o retorno do consumidor.

Migration `20261110121818_limitar_reescritas_solicitacao_cache_capitulos.sql`:

- Preserva assinatura, wrapper, owner, ACL, SECURITY DEFINER e search_path vazio.
- Mantem lock exclusivo da linha, como no UPDATE anterior. Confere o lease atual
  e sua validade, inclusive depois de esperar o lock. Snapshot obsoleto nao
  pode confirmar um lease substituido: a serializacao continua falhando.
- Faz UPDATE somente quando solicitada_em e null. Retorna true em repeticoes
  validas, sem mudar o primeiro timestamp. Lease expirado/incorreto continua
  55000, mesmo quando o evento ja foi solicitado.
- Limite comprovavel: **uma alteracao confirmada de solicitada_em por evento pelo
  contrato RPC**, sem alterar dados preexistentes. Um operador SQL privilegiado
  ainda pode editar a tabela; nao e uma barreira contra seu proprio owner.
- Nao modifica IDs, recibos, snapshots, leases, reivindicacoes, lotes, ordenacao,
  consumidores, pagina publica, RLS ou grants. Nenhuma nova tabela operacional.

## Limites nao resolvidos

FOR UPDATE ainda pode escrever WAL de locks. O limite acima NAO e zero WAL,
nem limite de bytes, de chamadas, de transacoes abortadas ou de tempo de espera.
Uma primeira escrita desfeita por rollback pode ocorrer novamente no retry;
ela nao e uma confirmacao, mas seu WAL ja gerado tampouco e desfeito.
Reivindicacoes ainda atualizam lease e tentativas; elas continuam potencialmente
ilimitadas ao longo do tempo. O lote de cinco nao limita um periodo inteiro.

Nao foi imposto arbitrariamente um numero maximo de retries, um saldo global
ou um lock global que rejeite consumidores concorrentes: sem contrato de
recuperacao administrativa, isso poderia impedir a recuperacao de pendencias
legitimas. Um orcamento futuro precisa de saturacao explicita (nao fila vazia),
retomada administrativa, contabilidade concorrente e observacao independente
dos abortos que revertem a propria contabilidade. Nao inferir limite de WAL de
um contador transacional, pois rollback nao desfaz WAL ja produzido.

Outbox integral, sem ACK artificial, TTL ou purga. A falta de confirmacao final
permanece; eventos novos e antigos continuam recuperaveis. Escritores externos
ao agendamento, temporarios e WAL retido continuam fora desta protecao.
**Capacidade fisica: NAO APTO.** Esta entrega reduz uma amplificacao comprovada,
nao habilita operacao automatica nem resolve o bloqueador global.

## Validacao

Node 22.23.4, CLI 2.116.0, Supabase descartavel `6d5-verify` restaurado de seu
backup, sem reset/remocao de volumes e sem migration remota. Configuracao e
migration auxiliar locais preservadas. Nenhum token de gestao foi repassado aos
processos de instalacao/teste. O Supabase antigo foi parado com autorizacao e
restaurado com os mesmos containers/volumes, 14 eventos e runner=false.

- pgTAP completo FINAL: **791/791 em 28 arquivos**, sem omitir testes. Arquivo
  novo **20/20**: fila cheia recusa INSERT mas permite registrar/recuperar eventos
  existentes. A primeira rodada completa tinha 789 assercoes; a final inclui
  as duas novas de saturacao e foi executada sem outros testes concorrentes.
- Nova integracao e outbox legada: **12/12**, serial/sem retries. Vinte chamadas
  concorrentes recebem true e um trigger auxiliar observa exatamente um UPDATE.
  Resposta perdida nao muda ctid/timestamp. Timeout/rollback, lease substituido
  enquanto o consumidor espera, snapshot REPEATABLE READ antigo e anon negado
  passaram. Instrumentacao somente local, removida pelo teardown.
- Outras integracoes: **47/50** na rodada ampla. Timeout no runner ao consultar
  information_schema; a assercao posterior esperou dois sucessos e recebeu tres,
  compativel com pendencia remanescente do teste anterior. Sem mudar codigo,
  timeout ou asserts, arquivo do runner isolado passou **8/8**. Nao transforma
  a rodada ampla em totalmente verde nem comprova causa ambiental definitiva.
- Data API ampla: paginacao **2/3** (57014 em consulta de comentarios sem range);
  anti-spam **3/5** (11 curtidas aceitas versus 60, incluindo falha do teste-pai).
  Houve sobreposicao de verificacoes nessa rodada; nao foi isolada a causa
  desses sintomas ja registrados na 6D5. Nao resetar contadores/elevar timeouts
  para forcar passe nem atribuir a uma funcao que nao e chamada nesses fluxos.
- npm ci raiz/QA, audit de producao (zero), Lint, Typecheck, Build, sessao
  (**2.002**) e paginacao (**37**) passaram. Pos-estatica **60/60**.
  Estatica no workspace **198/199**, guard da
  migration auxiliar preexistente; worktree limpo com os seis arquivos da fase
  **199/199**. As 474 assercoes unitarias anteriores a auditoria passaram.

Ocorrencias do ambiente: a primeira tentativa de iniciar tambem Realtime/Storage
parou por healthcheck. O ambiente minimo (banco/Auth/Data API) iniciou; servicos
omitidos nao participam desta RPC. A primeira rodada pgTAP via pipe PowerShell
corrompeu acentos; corrigido somente o harness temporario para UTF-8. Uma tentativa
das duas assercoes adicionais colidiu com o gate temporariamente aberto pelo
teste do runner; repetida serialmente depois do encerramento, passou 20/20.
Nenhuma dessas ocorrencias foi corrigida alterando producao ou enfraquecendo QA.

- Playwright em build local, workers=1/retries=0: agendamento/Diario **5/5**, com
  desktop/mobile, duas instancias Next, cache/sitemap e consumidor real. Baseline
  axe/acessibilidade **11/11**. O primeiro filtro de arquivos tambem selecionou
  community-comments-accessibility; esse teste adicional falhou por WebSocket
  HTTP 503, pois Realtime estava omitido no ambiente minimo. Resultado dessa
  rodada: 11 passes, uma falha, nove nao executados. O arquivo de agendamento,
  que nao havia rodado, foi executado com filtro exato e passou 5/5. Nao declarar
  E2E completo verde; nao houve retry, supressao de console ou mudanca de teste.

Ambiente E2E anterior restaurado e conferido por hash; backup temporario removido.
Hashes do config.toml e da migration auxiliar preexistentes continuam iguais.
Descartavel parado COM backup: **29 eventos**, runner=false, pg_cron ausente e
nenhuma tabela auxiliar qa_6d8 restante. Shim/harness temporarios removidos;
logs de evidencias locais ignorados pelo Git. Nenhuma migration de producao.
Analytics voltou a healthy apos o inicio; Vector antigo continua no estado de
reinicio/degradacao que ja apresentava antes da tarefa. Nao foi corrigido fora
do escopo nem houve remocao de volumes para forcar healthcheck.
As fixtures de integracao conservam todos os eventos anteriores e o evento
sintetico novo; removem somente seus objetos auxiliares de instrumentacao.

Referencias primarias:

- [PostgreSQL 17: isolamento e snapshots](https://www.postgresql.org/docs/17/transaction-iso.html).
- [PostgreSQL 17: locks de linha](https://www.postgresql.org/docs/17/explicit-locking.html).
- [Auditoria 6D3](AGENDAMENTO_CAPACIDADE_6D3.md) e
  [monitor 6D5](AGENDAMENTO_MONITOR_CAPACIDADE_6D5.md).
