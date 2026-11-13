# Etapa seguinte — quota e transporte privado sem ativacao

Branch filha da #2292. A migration acrescenta ledger de retencoes privado
sem produtor, RLS e REVOKE, inclui o quarto bucket na contagem global e por
usuario e compartilha o teto de 60 capas publicas/privadas. O helper antigo
continua a recusar admissao ao quarto bucket. Nao cria bucket, grant de escrita,
route handler ou upload.

O adaptador `lib/server/capas/storage-privado.ts` usa o download real do SDK
Storage apenas para fontes que um futuro autorizador devera comprovar. A rota
permanece fixamente 503 e o upload retorna `disabled`. O contrato SQL da #2290
permite jpg/png/webp; GIF foi recusado no protocolo preparatorio.

**Ainda nao ha garantia comprovada de quota fisica:** faltam produtor seguro
da retencao, fence no commit do Storage, contabilizacao sob transferencias
incertas/concorrentes inclusive service_role, validacao do backend gerenciado
e integracao com a exclusao de conta. As mudancas desta PR nao liberam a
entrada do fluxo, nao limpam dados e nao alteram a producao.

Validacao local focada registrada abaixo; a CI completa continua obrigatoria.
Nenhuma migration remota.

## Validacao local da #2293 sobre 4188895e

Em 13/11/2026, Node 22.23.4, CLI 2.116.0, PostgreSQL 17.6 e Storage API
v1.65.1, em projeto novo e descartavel `private-cover-quota`, separado do
Supabase `historietas`. Configuracao e auxiliar ACL da baseline somente locais,
sem versionamento. Nenhum upload real ou teste remoto.

A primeira execucao identificou dois erros de QA, nao defeitos comprovados
nas migrations:

- `capa_retencoes_quota.test.sql`: DELETE direto em `storage.objects` era
  recusado por `storage.protect_delete()`. A ausencia do objeto sintetico
  agora e simulada por SAVEPOINT/ROLLBACK, mantendo a retencao anterior e
  todas as assercoes. Nenhum byte fisico foi criado ou removido.
- `obra_capas_contrato.test.sql`: tres assercoes consultavam o estado privado
  sob `authenticated`, corretamente sem SELECT. Passaram a verificar a mesma
  versao pela RPC autorizada `consultar_contrato_capa`, sem ampliar grants.

Resultados, sem skips ou retries artificiais:

- Os dois pgTAP solicitados: **81/81** (15 de quota, 66 de contrato).
- Regressoes pgTAP diretamente ligadas ao ledger/helper: **151/151**, nos
  arquivos `storage_policies`, `capitulo_reservas`, `capitulo_tentativas` e
  `capitulo_recibos`.
- Data API local `private-cover-contract-supabase-real.test.mjs`: **10/10**,
  incluindo disputa de versao entre sessoes, escritor legado concorrente,
  rollback/timeout, resposta perdida, UUID idempotente, logout e isolamento.
- Unitarios `private-cover-integration.test.mjs`: **25/25**.
- Auditor de GRANT/REVOKE explicito e `git diff --check`: aprovados.

Comprovados no escopo testado: teto compartilhado de 60 capas, recusa da 61a
pela policy, substituicao legada sem aumentar contagem, retencao incerta de
2 MiB, uniao objeto/retencao pelo maior tamanho e compatibilidade da edicao
legada sem contornar o contrato gerenciado. O ledger segue privado; o helper
mantem SECURITY DEFINER/search_path vazio e a admissao apenas dos tres buckets
antigos. O bucket privado permaneceu ausente apos rollback, sem objetos ou
usuarios das fixtures. As migrations foram aplicadas somente ao descartavel,
sem backfill ou regravacao em massa das obras.

**Nao homologados:** fencing/terminalidade fisica, backend gerenciado, produtor
seguro de retencoes, entrega autorizada e exclusao de conta. A concorrencia
comprovada acima e a do contrato de obra, nao a conclusao fisica de uploads.
Nenhuma dessas evidencias autoriza ativar upload/entrega, transicao 18+ ou
migrations remotas. Build, Playwright e a CI inteira nao foram repetidos para
esta correcao restrita a QA. Preservar a ordem de integracao descrita abaixo.

## CI da composição

A PR documental e de infraestrutura foi apontada para `main` apenas para acionar
as verificações completas do GitHub (o workflow existente só executa para PRs
baseadas em `main`). A branch contém também a composição ainda não integrada
da #2292; **não mesclar diretamente sem resolver a ordem das PRs**.
A migration e os testes continuam restritos ao Supabase local descartável da CI.
