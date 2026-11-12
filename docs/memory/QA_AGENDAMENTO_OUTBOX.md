# QA — agendamento/Diário e lotes da outbox

## PR #2273 — fixture de notificacoes ativa interferia no runner (12/11/2026)

Primeira falha do run `43140137033`: `chapter-scheduling-capacity-supabase-real.test.mjs:167`,
zero notificacoes em vez de duas. pgTAP passou 954/954 e a integracao anterior
de notificacoes passou; nao era falha da nova migration nem de lock/limite.

O teardown preservou obra/conta para nao apagar recibos por cascata, mas deixou
o capitulo 2 da fixture em erro, vencido e elegivel ao runner global. Depois de
restaurar o limite de notificacoes, o runner da suite seguinte publicou ESSE
capitulo e consumiu a ultima vaga de outbox antes dos capitulos do proprio teste.
As falhas posteriores de pausa/CAS/Cron/runner seguiram o estado interrompido.

Reproducao serial em descartavel inicialmente vazio, antes da correcao:
13/17; mesmo `0 !== 2` na linha 167. Captura SQL na propria ocorrencia:
Obra orcamento/capitulo 2 publicado com quatro notificacoes; Obra runner/
capitulos 1 e 2 ainda agendados e zero notificacoes.

Correcao exclusivamente QA: encerrar somente as intencoes ativas da propria
obra/autor pela RPC autenticada `cancelar_agendamento_capitulo`, com a revisao
esperada. Nao excluir obra/conta, eventos ou recibos, nao resetar debitos,
nao mudar datas/prioridades, runner, medicao, limites, timeouts, RLS ou gates.
Snapshots integrais antes/depois exigem preservacao de toda a outbox, recibos,
saldo e configuracao fisica. O encerramento idempotente tambem e exercitado
como regressao e pelo teardown, inclusive se algum subteste anterior falhar.

Validacao do isolamento em OUTRO descartavel novo (CLI 2.116.0, Node 22.23.4):
pgTAP completo **954/954** antes das fixtures; sequencia notificacoes ->
capacidade **18/18**, concurrency=1, sem retries. O subteste que falhava e os
cenarios seguintes de medicao/retomada passaram sem alterar suas assercoes.
Gates completos e suites posteriores devem ser conferidos nos checks da #2273;
esta evidencia nao autoriza ativacao nem certifica capacidade fisica PH-1.

## PR #2255 — integração Data API com backlog global (10/11/2026)

`chapter-cache-outbox-supabase-real.test.mjs:79` exigia dois eventos de uma
reivindicação GLOBAL de até cinco. Com pendências anteriores, cinco era uma
resposta válida. A premissa de que os dois consumidores receberiam somente
eventos da fixture também foi removida, sem perder a validação de concorrência.

- Identidades, capítulos, slug e sessão da fixture agora são exclusivos por
  execução; nenhum snapshot antigo precisa ser excluído para reutilizar IDs.
- As duas chamadas simultâneas continuam exigindo dois eventos e leases
  distintos. Depois, o teste localiza os dois IDs reais da fixture entre lotes,
  com limite de ceil(eventos elegíveis / 5), sem espera ou retry de falha.
- Cada lote precisa progredir, conter até cinco e não repetir IDs com lease
  ativo. Ausência de um alvo, lote vazio ou falha interrompe o teste. A seleção
  final exige exatamente os dois eventos e os dois capítulos corretos.
- A expiração controlada continua limitada aos leases da própria fixture.
  Lease antigo retorna 55000; os dois IDs voltam com leases novos. Solicitação
  persistida não significa ACK. Recibos, Diário e outbox continuam únicos.
- Cleanup remove somente obra/conta sintéticas, NÃO a outbox. Compara todos os
  IDs/snapshots antes/depois e confirma que nenhuma pendência anterior mudou de
  identidade ou foi apagada. Leases podem mudar pelas reivindicações legítimas.

Validação no descartável existente, CLI 2.116.0 e Node 22.23.4:
focado **6/6**, com **24 eventos anteriores** preservados e dois lotes adicionais
para localizar a fixture, inclusive após expiração; integrações completas de
agendamento/orçamento/cache/projeção **52/52**, serial e sem retries; testes
relacionados de cache **10/10**. Consumidor, executor, orçamento, migrations,
RLS, permissões e demais arquivos de produção não foram alterados.

## Causa comprovada

Na main `ebcd7d5d`, `scheduled-chapter-diary.spec.mjs` presumiu que o primeiro
POST ao consumidor incluiria o evento recém-publicado. A auditoria local
completa ficou em 135/136 sem retries: sete pendências anteriores ocuparam o
lote de cinco; o retorno foi HTTP 202, solicitadas=5, confirmadas=0.

## Contrato preservado pela correção

- Cada POST pode reivindicar até cinco eventos elegíveis, ordenados por
  tentativas, data e ID, incluindo solicitações anteriores com lease vencido.
- O helper de QA percorre no máximo ceil(eventos elegíveis iniciais / 5) lotes.
  Não usa espera artificial, retry de falha, alteração de leases ou reordenação.
- Cada resposta deve manter o contrato sem ACK e registrar progresso no lote.
  Falha, lote vazio ou limite esgotado interrompem o teste, sem tentativas infinitas.
- A solicitação do evento alvo é verificada diretamente na outbox privada LOCAL;
  HTTP 202 ou contagem agregada não bastam. Os IDs da fila antes/depois devem
  permanecer iguais. Não há purga de pendências anteriores.
- Permanecem as verificações de conteúdo público, sitemap, capítulo antes 404,
  registro único do Diário, retry, despublicação e renomeação. O cleanup legado
  continua restrito aos snapshots criados pela própria fixture; não foi ampliado.
- Consumidor, runner, RPCs, migrations, RLS, grants e código de produção intactos.
  Automatização e uploads ilustrados continuam bloqueados; não há confirmação
  verificável de flush nem autorização de ativação decorrente desta correção QA.

## Validação

Testes focados de cache: 10/10, incluindo seis novos casos comportamentais de QA
com 0, 7 e 12 pendências anteriores, limite de chamadas, falha, lote vazio,
contrato inválido e ausência de registro do evento alvo.

Node 22.23.4, CLI 2.116.0, Supabase descartável em 127.0.0.1:54521,
next build/start. E2E focado: **5/5**, workers=1/retries=0, desktop/mobile;
o desktop percorreu DOIS lotes reais, o mobile um, preservando os IDs da fila.
O harness existente de capacidade criou sete pendências adicionais sem alterar
as sete anteriores; as 14 foram preservadas após os cenários.

Lint, Typecheck, Build, audit de produção (zero vulnerabilidades), estática
(199 verificações mais 534 unitários), paginação (37) e sessão (2.002) passaram.
Integração de capacidade 9/9, anti-spam 5/5 e paginação Data API 14/14 na
execução isolada. A primeira paginação recebeu 57014/statement_timeout durante
verificações concorrentes de CPU; não houve mudança de timeout/código ou retry
automático. A execução posterior isolada passou; não declarar causa conclusiva
da falha inicial somente por esse passe.

Suíte Playwright completa: **135/136**, 11,8 minutos, workers=1/retries=0,
nenhum ignorado. Os cinco testes de agendamento/Diário passaram novamente,
assim como Leitor, progresso entre dispositivos, cache, sitemap, BFCache e axe.
Única falha fora do escopo: home-explore.spec.mjs:288, Autores desktop, não
encontrou Carregar mais em 12 s. Trace: sete RPCs do catálogo HTTP 200; DOM
exibia carrosséis de autores, sem o botão esperado. O cenário mobile passou.
A falha ocorreu antes de executar o helper alterado, e os arquivos desse fluxo
permanecem idênticos à main. Causa ainda não isolada; não repetir para obter
passe, não mascarar nem corrigir silenciosamente nesta PR. Suíte não está verde.

Containers/imagens/volumes antigos e variáveis locais restaurados; configuração
e migration auxiliar anteriores preservadas por hash. Descartável parado com
backup e 14 eventos; ambiente antigo mantém seus 14 eventos. Runner false,
sem instalação/ativação de Cron ou publicação automática. Notas locais da
auditoria anterior preservadas fora deste commit; nenhuma alteração de produção.
