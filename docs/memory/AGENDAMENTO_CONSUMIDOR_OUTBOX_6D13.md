# Agendamento — 6D13: consumidor UUID, sem ativacao

Base `c35b54af` (#2259). Migration
`20261110163339_integrar_consumidor_operacoes_cache.sql`.
**Capacidade fisica continua NAO APTA.** Nenhum gate, runner, Cron, upload ou
publicacao automatica e habilitado. Nenhuma migration remota.

## Fronteira de autorizacao

A API publica `operar_cache_capitulos(UUID,text)` e INVOKER; delega somente ao
adaptador privado DEFINER de mesmo nome, owner postgres/search_path vazio.
Somente authenticated recebe EXECUTE nesta entrada, nunca anon/service_role.
O adaptador deriva usuario e session_id do JWT autenticado pelo PostgREST e
revalida as linhas reais de Auth/admin sob os locks da 6D12. Nao recebe IDs de
usuario/sessao, limite, eventos, lease, hash, tags ou slugs como autorizacao.
Metadata editavel e claims antigas de papel administrativo nao autorizam.
Os contratos privados da 6D12 e suas tabelas continuam sem grants de API.

As constraints diferidas INVOKER da 6D12 devem ser conferidas depois das escritas
completas e ainda dentro do adaptador, antes de devolver autoridade ao papel
PostgREST. A integracao Data API revelou 42501 no COMMIT sem essa conferencia;
nao corrigir concedendo SELECT no ledger nem tornando triggers DEFINER.

## Consumidor manual server-only

`POST /api/admin/cache-capitulos` preserva Origin/Host, getUser no servidor e
autorizacao administrativa SQL antes do cliente administrativo. Nao ha UI ou job.

- Cabecalho `Idempotency-Key`: UUID estavel escolhido pelo chamador, nao segredo
  nem prova de identidade. Retentativas devem preservar a chave. O servidor nao
  gera UUID, nao repete RPC automaticamente e nao escolhe outro ID apos falha.
- Sem protocolo iniciado/habilitado/pendente, preparar retorna legado sem criar
  intencao. O claim/registro antigo, lotes e respostas permanecem. Ha uma RPC
  administrativa adicional para decidir o modo com lock; se o gate mudar antes
  do claim legado, o guard da 6D12 nega, nao contorna a transicao.
- No protocolo, chave ausente bloqueia. Preparar admite e confirma em uma RPC;
  executar e OUTRA transacao. Somente admissao nova inicia execucao no fluxo
  normal. Intencao ja admitida exige reconciliacao, nao retry cego.
- Preparar UUID confirmado seguido de executar le o recibo imutavel sem novo
  claim, lease ou debito. Conferir ID/debito/lote e leases atuais antes do Next.
  Lease expirado/substituido bloqueia efeitos; nao renova nem reembolsa.
- `X-Cache-Operation: reconciliar`, com a MESMA chave e sessao original, usa os
  locks da 6D12: encontra recibo confirmado ou sela intencao/UUID ausente sem
  reivindicar. Tombstone impede admissao/execucao atrasada.
- Falha/timeout/resposta perdida retorna 503/reconciliacao_necessaria, sem
  fallback legado. Gate permanece pausado. Nova operacao exige retomada SQL
  administrativa por revisao/CAS, inclusive apos sucesso, como na 6D12.
- Sessao revogada, conta excluida ou outra sessao/identidade nao assume recibo.
  Recuperacao apos perda da sessao original continua exclusivamente SQL
  administrativa restrita, sem credencial nova nem acesso para service_role.
- Revalidar sessao antes do registro administrativo no caminho com chave.
  Registro #2257 permanece idempotente e valida lease. Invalidacoes repetidas
  podem ser solicitadas com o mesmo recibo; NAO se promete exactly-once do Next.

HTTP 202 segue `solicitado_sem_confirmacao`, confirmadas=0; recibo prova somente
commit da reivindicacao. Nao e ACK de flush/cache nem permite apagar outbox.
Nenhum evento/ID e excluido. Instalar migration antes de implantar o consumidor;
RPC ausente falha fechada, sem fallback para driblar o protocolo.

## Limites restantes

- Nao ha chamador automatico, reconciliador independente ou politica aprovada
  de retencao/tentativas. Pausa duravel nao mede todos os abortos/WAL.
- Falha antes de a admissao chegar ao banco pode nao deixar intencao. O chamador
  deve preservar a chave e reconciliar; nao se afirma pausa global duravel para
  uma chamada que nunca chegou ao banco. Nenhum mecanismo remoto pode inferir
  esse commit apenas pela conexao HTTP.
- SQL owner e administradores reais sao fronteiras de confianca. O adaptador
  pode ser chamado diretamente pela Data API por um admin autorizado, sem
  conferir poderes gerais de SQL ou permitir alterar saldo/retomar/ativar.
- Sem ACK de outbox, certificacao fisica/WAL, acionador gerenciado ou ativacao.
  Uploads ilustrados permanecem suspensos e nenhuma quota e liberada.
- Nao revoga bytes ja entregues nem atualiza abas continuamente abertas sem
  eventos. Efeitos Next e registro nao constituem transacao distribuida.

## Evidencias

Ambiente exclusivamente Supabase local descartavel `6d5-verify`, PostgreSQL
17.6, Node 22.23.4/CLI 2.116.0, sem retries artificiais.
Os controles podem ser habilitados APENAS como fixtures desse descartavel e sao
restaurados ao estado anterior no teardown. Isso nao e ativacao operacional.

- pgTAP completo **892/892, 31 arquivos**. Adaptador focado final **21/21**.
- Recuperacao/concorrencia/timeout/rollback/backend interrompido + novas provas
  Data API com login real: **25/25**. Regressoes legadas outbox/#2257/saldo:
  **20/20**. Primeira rodada nova revelou falha no COMMIT por constraint INVOKER
  diferida (18 passes/7 falhas, incluindo pais). Correcao acima comprovada sem
  grants de tabela. Nao ocultar a falha inicial nem chamar isso de retry verde.
- Unitarios do consumidor **18/18**. Pre-estatica **482/482**, pos-estatica
  **60/60**, paginacao **37/37**, sessao **2.002/2.002**.
- Playwright final **7/7**, build de producao/next start, workers=1/retries=0,
  desktop/mobile. Resposta HTTP abortada DEPOIS de obter resposta do servidor:
  repetir mesmo UUID conserva recibo, lease, tentativas, timestamp e debito.
  Tombstone, gate, logout, duas instancias, cache negativo, metadata, sitemap e
  Diario cobertos. Novos casos importados pelo MESMO spec do consumidor legado
  para nao disputar controles globais entre workers na CI. Nao e suite completa.
- Lint completo e afetado final, Typecheck, Build e diff --check aprovados.
  Primeira tipagem apontou Json|undefined no parser, corrigida e revalidada.
  npm ci raiz/QA reproduziveis; lockfiles/dependencias inalterados.
  Audit de producao **zero vulnerabilidades**. A instalacao continua mostrando
  nove avisos dev preexistentes (oito moderados/um alto), sem audit fix.
- Advisors security LOCAL: **nenhum problema**.
- Estatica do workspace **198/199**, pelo helper ACL local preexistente nao
  versionado. Worktree temporario com somente o diff: **199/199**, removido ao
  final. Helper/config/guard preservados, nao se declarou workspace verde.
- Paginacao Data API **14/14**. Anti-spam original falhou no banco reutilizado:
  UUID fixo c000...0001 ja tinha contador de seguimentos diario **100/100**;
  todos os 25 retornaram 429/HISTORIETAS_RATE_LIMIT. Probe instrumentado com a
  MESMA identidade confirmou limites ainda consumidos, inclusive de posts e
  comentarios. Recriar Auth nao apaga o ledger do limitador. Sem limpar contadores,
  o MESMO teste/as mesmas assercoes com UUID/email novos em loader TEMPORARIO
  passou **5/5** (seguimentos: vinte HTTP 200/cinco HTTP 429). Nenhuma alteracao
  permanente de anti-spam ou permissao; validar fixture fixa em banco novo na CI.
- Suite E2E inteira, harness Cron, Lighthouse/k6/ZAP e scans CodeQL/Gitleaks
  locais nao repetidos. Pipeline remoto deve validar a cadeia de migrations em
  banco novo; neste restaurado, historico CLI termina na 6D5 e deltas seguintes
  foram aplicados por SQL. Nao houve dispatch manual ou polling de CI.

O teardown local remove SOMENTE intencoes/recibos sinteticos desta fixture sob
owner SQL, desabilitando/reabilitando transacionalmente os triggers imutaveis
como no harness 6D12. Nao e contrato de purga operacional. Eventos novos da
outbox sao conservados; registros/leases anteriores e gates sao restaurados.
Supabase antigo pausado com consentimento para liberar memoria, sem remocao de
containers/volumes, e os mesmos onze containers reiniciados ao final. Descartavel
parado COM backup: **68 eventos preservados**, zero intencoes restantes, protocolo
false/nao iniciado/pausado/revisao 1, saldo false/NULL/zero, runner=false e sem
Cron. Ambiente E2E anterior, config.toml e migration ACL auxiliar conferidos por
hash e preservados, assim como os demais arquivos locais do usuario.
Nenhum segredo e incluido neste documento, testes ou relatorio.

Fontes: [transacoes PostgREST](https://docs.postgrest.org/en/stable/references/transactions.html)
e [seguranca de funcoes Supabase](https://supabase.com/docs/guides/database/functions).
