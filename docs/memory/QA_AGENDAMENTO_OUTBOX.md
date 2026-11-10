# QA — agendamento/Diário e lotes da outbox

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
