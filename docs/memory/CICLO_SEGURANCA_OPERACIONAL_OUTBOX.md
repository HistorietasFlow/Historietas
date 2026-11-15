# Ciclo consolidado de seguranca operacional — apos #2260

Base `836d8c4d`, 10/11/2026. **NAO APTO para ativacao; capacidade fisica NAO APTA.**
A #2260 estava merged com CI, Build, Tests, Lint, Typecheck, CodeQL e Gitleaks
aprovados na consulta unica inicial. Nenhuma ativacao ou alteracao remota.

## Resultado por etapa

| Etapa | Garantia/entrega | Limite ou bloqueador |
| --- | --- | --- |
| Observacao independente | Snapshot restrito observa intencoes, recibos, tombstones, saldo e integridade por outra conexao/transacao; alerta pelo transporte existente | Ve somente estado confirmado. Nao identifica causa exata de aborto/timeout nem entrega HTTP; periodicidade/TLS/ausencia do proprio verificador continuam sem certificacao |
| Gate | Admissao confirma pendencia e pausa ANTES da execucao; rollback da execucao conserva a pausa; outra intencao e retomada com pendencia sao negadas | Monitor e somente leitura, nao escreve gates. Alerta nao e autorizacao. Falha anterior a qualquer commit pode nao deixar evidencia SQL |
| Recuperacao | Reutiliza UUID/recibo/lease, tombstone e reconciliacao serializada/CAS 6D12–6D13; nao reembolsa nem renova lease no replay | Perda da sessao original exige SQL administrativo restrito; nao criar credencial privilegiada para automatizar |
| Retencao | Politica integral/sem purga explicita e bytes reais de tabelas+indices observaveis; nenhum evento/ID/recibo eliminado | Nao existe orcamento aprovado nem descarte seguro das evidencias. Crescimento indefinido NAO e sustentavel em disco finito |
| Orcamento | Reutiliza saldo acumulado 6D10 de claims confirmados, lote de ate cinco e uma intencao admitida; alerta saldo ausente/pausado/esgotado | Nao limita todas as tentativas abortadas, sessoes SQL aguardando locks, WAL ou outros escritores; nenhum numero novo foi escolhido |
| Validacao | Evidencias locais abaixo, testes seriais sem retries e pipeline automatico da PR | Banco gerenciado, entrega periodica, capacidade fisica e ACK de flush nao certificados |

## Implementacao segura e isolada

Migration `20261110174613_observar_operacoes_cache_privadas.sql` adiciona SOMENTE
helper INVOKER privado e integra chave aditiva `operacoesCache` ao snapshot v1
existente. Owner/ACL/DEFINER do snapshot sao preservados; nenhum grant adicional
para monitor, API, service_role ou runner. Nenhum acesso direto ao ledger/Auth,
funcao de reconciliacao ou escrita e concedido. Monitor continua NOLOGIN.

Uma instrucao SQL agrega protocolo, contagens, correspondencia de recibos/links,
coerencia do ponteiro/pausa e saldo. As contagens usam o mesmo snapshot; o coletor
existente continua REPEATABLE READ/READ ONLY com timeouts previos. Sem locks de
escrita, tabelas de log novas, heartbeat gravado ou contadores atualizados em toda
consulta. Tamanhos fisicos de relacoes sao amostras, podem variar concorrentemente
e NAO formam reserva nem sao atomicamente equivalentes as contagens logicas.

Ausencia de singleton/erro nao vira saldo zero ou sucesso. O envelope e carimbado
DEPOIS das coletas, como na 6D5. O classificador reutiliza o criterio existente de
frescor (60 s/1 s futuro), sem inventar timeout de encerramento de operacoes.

Relatorio externo contem SOMENTE codigos allowlist: fonte ausente/obsoleta,
contrato/integridade divergentes, intencao sem recibo, admissao fechada, saldo
indisponivel/pausado/esgotado e retencao sem orcamento. Nenhum UUID, usuario,
sessao, lease, caminho, conteudo, numero do saldo ou erro livre vai para a issue.
Transporte GitHub/deduplicacao/recuperacao existentes sao reutilizados. Nao ha
novo envio remoto nem certificacao de recebimento neste ciclo.

## O que a observacao realmente comprova

- `admitida` SEM recibo indica uma operacao nao confirmada: pode estar entre RPCs,
  executando, ter abortado ou nunca ter iniciado. Nao rotular como crash provado.
- Outra conexao ve a intencao ja commitada enquanto execucao/reconciliacao ainda
  mantem mudancas sem commit. Nao espera os locks de escrita nem antecipa sucesso.
- Recibo confirmado prova COMMIT do claim/debito, nao recebimento da resposta
  pelo cliente, flush Next ou ACK da outbox. `solicitada_em` continua sem ACK.
- Aborto de transacao SEM intencao previa nao e observavel integralmente por
  esta consulta; `pg_stat_activity` nao e historico completo e ausencia de PID nao
  prova terminalidade. Estatisticas podem atrasar/resetar e nao atribuem todos
  os abortos a uma operacao. Nao simular confirmacao independente.
- Gate fechado nao depende da disponibilidade do GitHub/monitor depois da
  admissao. O monitor NAO reabre, retoma ou autoriza novas operacoes. Se uma
  configuracao for adulterada pelo owner, alerta e diagnostico, nao fencing do
  proprio owner. A fronteira administrativa confiavel permanece a mesma.

## Retencao: politica conservadora, nao solucao ilimitada

1. Conservar outbox integral, inclusive eventos solicitados; sem ACK, TTL ou purge.
2. Conservar intencoes, recibos, links de lease, retomadas e tombstones. Nao usar
   idade, logout, expiracao de lease ou ausencia de arquivo como prova de descarte.
3. Tombstone impede reabrir UUID antigo. Apaga-lo sem barreira de replay permitiria
   admissao atrasada; descarte exige protocolo de geracoes/encerramento verificavel
   e compatibilidade de todos os chamadores, ainda nao implementado/aprovado.
4. Limites existentes de outbox/saldo e pausas sao paradas logicas, nao reservas
   fisicas. Lote vazio/intencao reconciliada pode aumentar ledger sem novo claim;
   logo saldo 6D10 NAO e teto de cardinalidade/bytes das intencoes.
5. Antes de automatizar, aprovar horizonte de operacao, capacidade para evidencias,
   limites de admissoes/tentativas e procedimento de parada/exportacao verificavel.
   Nao implementar GC, novos defaults numericos, reembolso ou rotacao automatica
   apenas para caber no plano Free. Se saturar sem descarte seguro, permanecer parado.

## Orcamento/WAL e custos

Saldo logico existente continua desativado, sem teto aprovado; nenhuma variacao
percentual ou limite de tentativas foi inventado. Unicidade de intencao admite
uma pendencia, mas NAO limita todos os backends/requests concorrentes. Locks,
abortos, leituras com hint bits e tentativas recusadas podem custar WAL/CPU.

Ensaio local com EXPLAIN(ANALYZE,WAL,FORMAT JSON), sobre o claim real e seguido
de ROLLBACK: **19 registros, quatro imagens completas, 11.348 bytes de WAL**.
Debito/recibo foram revertidos e pendencia conservada. E uma amostra de banco
aquecido/local, NAO teto, taxa segura ou benchmark do Supabase gerenciado.
O teardown inicial desse probe falhou ao alterar trigger ainda com evento
diferido; a limpeza TEMPORARIA conferiu constraints antes do ALTER, validou o
estado sintetico exato e restaurou os controles. Nenhuma funcao de producao ou
constraint foi enfraquecida para limpar a fixture. Nao repetiu a medicao.

Somente SQL/bibliotecas/GitHub ja existentes. Nao ha nova dependencia, servico,
writer operacional, permissao ampla, job, deploy ou alteracao de infraestrutura.
Observacao custa varredura do ledger e consultas indexadas por operacao; fica
sujeita aos timeouts. Sem retencao aprovada, crescimento torna essa leitura mais
cara. Limites/pausas precisam ser aprovados antes de habilitar admissao automatica.

## Proximas decisoes indispensaveis

1. Homologar chamador/observador independente com credencial minima, TLS,
   cadencia e atraso best-effort explicitamente aceitos, incluindo falha do proprio
   observador. Workflow atual e manual, autorizado=false; nenhum schedule criado.
2. Aprovar orcamento finito de tentativas/admissoes/evidencias com margem para
   demais escritores e recuperacao. Testes locais nao fornecem esses valores.
3. Se exigir deteccao completa de cada aborto/timeout anterior ao commit,
   provisionar evidencia independente anterior a tentativa e recuperacao cercada
   contra execucao tardia. So SQL na transacao que aborta nao oferece essa garantia.
4. Nao iniciar purga antes de um contrato de replay/ACK/descarte verificavel.
   Capacidade fisica/WAL e disponibilidade gerenciada permanecem NAO APTAS.

## Validacao

- Node 22.23.4, `npm ci` na raiz e em `qa`, sem mudanca de lockfiles.
- pgTAP completo: **914/914**, 32 arquivos, sem omissoes; novo contrato: 22/22.
- Integracao local de recuperacao/observacao/Data API: **28/28**; regressao de
  outbox, saldo, #2257 e monitor de capacidade: **24/24**.
- Paginacao Data API + anti-spam: **19/19**. O teste anti-spam usa UUID fixo que
  ja consumiu o limite diario neste descartavel reutilizado; executadas as mesmas
  assercoes por harness temporario com UUID/e-mail novos, sem resetar contadores,
  alterar limites, permissoes ou o teste permanente.
- Unitarios focados (monitor + consumidor): **43/43**; paginacao: **37/37**;
  sessao: **2002/2002**; pretestes estaticos: **482/482**; postestaticos: **60/60**.
- Lint, Typecheck e Build aprovados. Audit de producao: zero vulnerabilidades;
  advisors locais: sem problemas. Nenhuma mudanca de dependencia.
- Playwright com build de producao: **7/7**, desktop/mobile, um worker e
  `--retries=0`: consumidor UUID, resposta perdida, replay, reconciliacao,
  gate/logout, revisao entre instancias, sitemap, cache negativo e Diario.
- Auditoria estatica no workspace: **198/199**, somente o helper ACL local
  preexistente/nao versionado; nao foi removido nem foi enfraquecida a verificacao.
  Auditoria isolada do diff versionado: **199/199**, sem o helper local, que
  permanece intacto no workspace original.

Limitacoes: banco descartavel local restaurado com deltas, nao certificacao de
replay limpo de todas as migrations; pipeline da PR deve confirmar essa cadeia.
Suite Playwright completa, Lighthouse/k6/ZAP e scans remotos nao foram repetidos
localmente nesta alteracao privada sem mudanca de UI. Nao ativado/instalado Cron.
CI/CodeQL/Gitleaks do novo commit devem ser consultados uma vez apos abrir a PR,
sem confundir pendente com aprovado. Configuracoes/arquivos locais preexistentes
e volumes preservados; Supabase antigo pausado apenas com autorizacao e os onze
containers reiniciados ao terminar, conservando os 14 eventos anteriores e runner
desativado. Ambiente local restaurado por hash; scripts/backup temporarios
removidos. Nenhuma aprovacao local autoriza ativar controles,
Cron, runner, publicacao ou uploads.

Fontes primarias: [transacoes PostgREST](https://docs.postgrest.org/en/stable/references/transactions.html),
[estatisticas PostgreSQL 17](https://www.postgresql.org/docs/17/monitoring-stats.html),
[EXPLAIN WAL e rollback](https://www.postgresql.org/docs/17/sql-explain.html),
[WAL/checkpoints](https://www.postgresql.org/docs/17/wal-configuration.html).
