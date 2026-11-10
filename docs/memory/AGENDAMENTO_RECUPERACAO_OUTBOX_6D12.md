# Agendamento — 6D12: recuperacao privada, sem ativacao

Base `6fa4b7d1` (#2258). Migration dedicada
`20261110152413_recuperacao_privada_reivindicacoes_outbox.sql`.
**Capacidade fisica permanece NAO APTA.** Sem Cron, runner, upload ilustrado,
endpoint novo, grants de API ou migration remota.

## Escopo e fronteira de confianca

Esta fase implementa contratos SQL administrativos privados. NAO integra o
consumidor Next a esses contratos nem provisiona um chamador/observador automatico.
O controle nasce `habilitado=false`, `iniciado=false`, `pausado=true`, revisao 1.
Nenhuma funcao habilita controles. Instalar exige runner e saldo 6D10 desativados.
O owner SQL e confiavel; nao se promete impedir seu proprio owner de alterar o
schema. Nenhum papel da API, service_role, runner ou monitor recebe EXECUTE nos
contratos novos ou acesso direto as cinco tabelas, todas privadas/com RLS.
Os IDs armazenados nao comprovam posse de JWT. Um adaptador futuro deve derivar
identidade/sessao de autenticacao validada, nunca aceitar esses IDs do navegador
como prova nem simplesmente conceder EXECUTE a papeis da API.

O nucleo 6D10 e movido literalmente para funcao INVOKER sem grants. O wrapper
antigo conserva assinatura/owner/ACL/DEFINER e funciona como antes enquanto o
novo protocolo nao foi iniciado. Quando habilitado/iniciado ou com pendencia,
nega novas reivindicacoes legadas: desabilitar nao e voltar ao modo legado.
O registro da #2257 nao muda e continua permitido para leases validos.

## Protocolo

1. `admitir_operacao_cache(UUID, usuario, sessao, limite)` grava intencao privada
   com parametros imutaveis. Confere sessao e papel admin reais no Auth, nunca
   metadata editavel. Locks SHARE serializam logout/revogacao; nao ha IO externo.
   Um unico registro admitido e permitido. A admissao fecha o gate, fixa pendencia
   e avanca revisao ANTES da execucao. UUID equivalente retorna a mesma intencao;
   UUID com parametros/identidade/sessao diferentes falha.
2. **Commit separado obrigatorio.** XID8 de topo registrado na admissao impede
   executar na mesma transacao, inclusive com SAVEPOINTs. Timestamp, espera e
   xmin de subtransacao nao sao usados como prova. Apos restauracao logica do
   banco, eventual coincidencia conservadora do XID exige reconciliacao, nao
   bypass dessa validacao. Nao usar esse XID como identificador externo.
3. `executar_operacao_cache` trava controle -> intencao -> Auth -> saldo/eventos.
   Exige saldo 6D10 ativo/configurado/disponivel. Reutiliza o nucleo; confere
   diferenca efetiva do saldo e revalida autorizacao antes do recibo. Recibo,
   resultado, vinculos imutaveis evento/lease/prazo, debito e estado terminal
   confirmam na MESMA transacao. Constraints diferidas verificam consistencia.
4. Retry de operacao confirmada le o mesmo recibo, inclusive com saldo pausado,
   sem reivindicar, cobrar ou renovar leases. `leasesValidos` e uma observacao
   atual separada: recibo historico nao permite usar lease vencido/substituido,
   nem prova exclusividade de efeitos Next. A consulta continua exigindo sessao
   administrativa atual da identidade originalmente vinculada.
5. `reconciliar_operacao_cache`, em OUTRA transacao administrativa, usa o mesmo
   lock. Se execucao confirmar primeiro, encontra confirmada. Se houve rollback,
   encerra a intencao como `encerrada_sem_claim`. Escritores atrasados encontram
   tombstone e nao executam. UUID ausente recebe tombstone tambem, impedindo
   uma admissao atrasada. Nao rotular ausencia simples/timeout como aborto.
6. O gate permanece pausado, inclusive apos sucesso. **Entre operacoes distintas
   esta entrega exige retomada SQL administrativa por revisao/CAS.** Nao e um
   fluxo automatico de alto throughput. Retry equivalente de retomada nao altera
   uma pausa posterior; nunca habilita protocolo/runner ou devolve saldo. Nao
   retoma com intencao pendente. Pausa e pendencia sobrevivem ao rollback da
   execucao porque a admissao foi previamente confirmada.

Se a reconciliação bloquear/abortar ou o banco estiver indisponivel, a pendencia
continua fechando a admissao. Nao inferir encerramento de lease, timeout HTTP,
PID ausente ou status generico 503. Um chamador futuro deve preservar o mesmo
UUID para repeticoes e nunca criar outro automaticamente apos resposta ambigua.
Reconciliar um resultado terminal nao escreve novamente nem altera outra
operacao/pausa posterior. Logout/exclusao nao apagam intencoes e recibos; a
administracao restrita ainda pode encerrar a pendencia sem restituir autorizacao.

## Limites e bloqueadores

- Recibo comprova somente o COMMIT da reivindicacao. Nao e ACK de flush Next,
  publicacao, notificacao, Diario ou exclusao da obrigacao da outbox.
- Nenhum evento, ID ou pendencia da outbox e apagado. Sem TTL/purga de intencoes,
  recibos, tombstones ou historico. Capacidade/retencao desse ledger precisa de
  politica aprovada antes de integrar um chamador automatico.
- Debitos confirmados nao sao reembolsados. Nova operacao apos lease vencido
  consome saldo novo; replay do recibo anterior nao reabre o lease.
- Um executor abortado pode ter gerado WAL mesmo sem recibo/debito. Nao ha
  contagem independente de todos os abortos ou limite fisico de WAL. Repetir
  continuamente a MESMA operacao abortada ainda custa; proibido retry cego.
- Falta integrar/provisionar o chamador e reconciliador independente com papel
  minimo, observacao/alertas e politica de tentativas. O monitor 6D5 continua
  somente leitura e nao ganha poderes de escrita/retomada.
- Nao ha endpoint, ativador, credencial, chamada periodica ou integracao parcial
  da UI. O caminho legado sem novo protocolo continua sem idempotencia por UUID;
  a aplicacao so podera usar a garantia nova apos uma fase propria de integracao.
- Restabelecer o protocolo nao implica certificar disco livre, WAL, backups,
  disponibilidade gerenciada ou entrega instantanea do cache/abas abertas.

## Validacao local

Node 22.23.4, CLI 2.116.0, PostgreSQL 17.6; exclusivamente descartavel
`6d5-verify`, sem migracao de producao. Numeros pequenos do saldo sao fixtures,
nao limites escolhidos para producao.

Primeira rodada pgTAP: 39/40. A assercao RLS tambem selecionava indices de
pg_class; corrigido somente o seletor para relkind=r. Rodada seguinte 40/40 e
regressao 6D10 40/40. pgTAP completo FINAL: **871/871, 30 arquivos**.
Integracao nova FINAL: **18/18**, serial e sem retries. Inclui disputa de ultima
admissao, execucao duplicada/resposta descartada apos COMMIT, rollback
por timeout apos o claim, terminacao real do backend antes de COMMIT, ambas as
ordens de reconciliacao/execucao, logout, UUID ausente, CAS e acessos negados.
Tambem prova expiracao da sessao DURANTE espera pelo saldo (sem debito/recibo),
SAVEPOINT na mesma transacao, recibo vazio mesmo apos novos eventos elegiveis,
retomadas concorrentes e bloqueio por saldo pausado. As disputas entre execucao
e reconciliacao aguardam segunda conexao realmente bloqueada em pg_stat_activity
antes de liberar a barreira; nao dependem apenas de Promise.all/iniciar processos.
Nao simula crash de disco/reinicio do cluster nem certifica o ambiente gerenciado.

- Regressoes Data API/outbox/#2257/6D10: **20/20**, sem retries.
- Advisors security local: **nenhum problema encontrado**.
- npm ci raiz/QA com lockfiles preservados; audit producao zero. Audit completo
  da instalacao continua com nove avisos dev (oito moderados e um alto), sem
  atualizar dependencias para mistura-los nesta fase.
- Lint, Typecheck e Build aprovados. Sessao **2.002/2.002**, paginacao **37/37**,
  pos-estatica **60/60**; **475** unitarios anteriores a estatica aprovados.
- Estatica do workspace **198/199**, exclusivamente pelo guard da migration ACL
  auxiliar preexistente. Worktree temporario com SOMENTE os arquivos da fase:
  **199/199**, removido depois. Nao alterou helper/guard nem descartou arquivos.
- Paginacao Data API **14/14**, anti-spam **5/5**. A primeira invocacao conjunta
  deixou o teste de progresso sem as variaveis E2E, falhando antes de autenticar
  ou consultar o banco (19/20). Corrigido somente o harness temporario para
  importar o ambiente das fixtures ja preparadas; progresso isolado **6/6**.
  Nao houve alteracao funcional, retry automatico ou nova preparacao de conta
  para esconder essa falha de invocacao.
- Playwright pertinente **5/5**, build de producao local, workers=1/retries=0,
  desktop/mobile e duas instancias Next: publicacao/Diario, consumidor legado,
  revisao, cache negativo, metadata, capitulos e sitemap. O novo protocolo
  permanece sem caller/UI; nao apresentar esse E2E como teste de endpoint novo.
  Ambiente local preparado ANTES do Build, URL/chaves de loopback explicitas.
- Nao repetidos suite Playwright inteira, harness Cron, Lighthouse, k6, ZAP,
  CodeQL ou Gitleaks locais. Checks automaticos da PR ainda precisam validar
  o commit; nao houve dispatch remoto manual ou certificacao de pipeline inteiro.

Supabase antigo pausado com autorizacao, sem remover volumes; 14 eventos e
runner=false conferidos antes e depois da pausa. Os mesmos 11 containers foram
restaurados; Vector ja apresentava reinicios antes da tarefa, sem correcao fora
do escopo. Descartavel parado COM backup: **53 eventos preservados**, gate novo
false/nao iniciado/pausado/revisao 1, saldo 6D10 false/NULL/zero, runner=false,
Cron ausente e nenhuma intencao sintetica restante. Ambiente E2E anterior
restaurado por hash; config.toml e migration auxiliar conferidos por hash,
inalterados. Scripts e backup temporarios removidos; logs ignorados em
`qa/reports/6d12-*`. Nao houve leitura ou escrita de producao nem acionamento
automatico. Validacao usou SQL no banco restaurado e deltas finais de duas
funcoes; o historico do CLI desse descartavel termina na 6D5. A CI ainda deve
confirmar instalacao completa da cadeia de migrations em banco novo.

A fixture integrada tem guard HTTP/DB loopback e restaura gates/saldos/leases
anteriores. Limpeza remove SOMENTE seus registros sinteticos de operacao e
retomada, sob owner SQL local, desabilitando/reabilitando transacionalmente os
quatro triggers de imutabilidade apenas para esse teardown; FKs e permissoes
permanecem. Assercoes conferem que registros anteriores e triggers ficam iguais.
Eventos novos da outbox sao conservados, sem ACK/purga. Esse procedimento de
fixture NAO e operacao administrativa de producao nem politica de retencao.

Fontes primarias: [locks PostgreSQL 17](https://www.postgresql.org/docs/17/explicit-locking.html)
e [transacoes PostgREST](https://docs.postgrest.org/en/stable/references/transactions.html).
