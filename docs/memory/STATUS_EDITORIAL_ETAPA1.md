# Status editorial — Etapa 1, contrato de banco

Base: `c6acd4cf` (#2281). Implementação local, sem aplicação remota ou interface.

## Contrato autorizado

- Migration `20261113002736_adicionar_status_editorial_obras.sql`, criada pela
  CLI 2.116.0: `obras.status_editorial text`, nullable, CHECK exato para
  `em_andamento`, `concluida` e `pausada`. Sem default, backfill ou inferência.
  NULL significa não informado; vazio, aliases e caixa diferente são inválidos
  na persistência. Não altera publicação, leitura pessoal ou agendamento.
- Única ampliação de escrita: `UPDATE(status_editorial)` para `authenticated`.
  INSERT reutiliza o grant existente. Sem UPDATE amplo, mudanças de RLS,
  credencial privilegiada no cliente ou alteração de outras colunas.
  O guard de termos de edição publicada preserva seus 15 campos e acrescenta
  o novo campo. Rascunhos/18+ continuam sujeitos à propriedade e visibilidade
  existentes; status nunca concede acesso público.
- Variante de 15 argumentos de `listar_obras_catalogo`, adicionando
  `p_status_editorial`. Todos os argumentos são obrigatórios na nova assinatura:
  NULL ou `''` são neutros; três estados explícitos aceitos; demais entradas
  recebem 22023. Não há filtro “Não informado”. Predicado em obras antes de
  agregação, ranking, cursor e limite. Sem fallback para consulta ampla.
- As cinco assinaturas de 10–14 argumentos não são substituídas. A migration
  compara definições completas/defaults/ACL antes e depois da criação da nova
  variante. A nova função é STABLE/SECURITY INVOKER/search_path vazio, sem
  EXECUTE para PUBLIC, com os mesmos destinatários das variantes do catálogo:
  anon, authenticated e service_role. Nenhum auxiliar público é criado.
- `obter_projecao_publica_obra` recebe somente a chave JSON aditiva
  `obra.statusEditorial`, na consulta/revisão do mesmo snapshot. O trigger
  de revisão existente já cobre colunas futuras: não duplicar invalidações,
  outbox ou notificações. Assinatura, ACL, tombstones e barreiras preservados.
- `SnapshotObraPublica` preserva propriedade ausente (legado), NULL remoto e
  estados explícitos. Valor inválido presente gera erro, não NULL. Falhas
  continuam propagadas, sem cache pessoal/404 falso. Chave do cache leve
  versionada para `obra-leve-status-editorial-v2`: entradas do DTO anterior
  não certificam o campo novo na mesma revisão. Sem consultas adicionais.

## Bloqueador comprovado de concorrência — Etapa 2 NÃO habilitada

Não existe hoje um token de edição utilizável pelo autor em todos os casos:

- O ledger privado avança inclusive em alterações de obras em rascunho, mas
  a RLS não permite ao autor consultar suas revisões privadas/18+. A Data API
  não expõe o schema privado (PGRST106). Não ampliar esse acesso por conveniência.
- `atualizado_em` recebe `now()` no trigger e é um timestamp de transação,
  não uma revisão monotônica por edição. Duas atualizações na mesma transação
  retornaram exatamente o mesmo timestamp no teste local.
- Duas sessões reais: a segunda aguardou o lock de linha da primeira; um
  UPDATE condicional pelo valor antigo alterou zero linhas após o commit da
  primeira. Entretanto, a sequência A → B → A permitiu o UPDATE obsoleto.
  Isso comprova a insuficiência do valor anterior; não certifica CAS completo.

A Etapa 1 não cria coluna extra de versão nem função de escrita. Para avançar,
aprovar separadamente um token de versão editorial selado pelo banco (por
exemplo UUID novo na inserção e em cada mudança efetiva de status, imposto por
trigger, sem UPDATE pelo cliente). A futura escrita deverá condicionar ID,
proprietário e token na mesma instrução, verificar uma linha afetada e rejeitar
conflito. O token precisa mudar também em A → B → A e na recriação da obra;
comparação prévia no cliente ou somente `id + user_id` não atende. Essa opção
é proposta pendente, não contrato aprovado/implementado nesta entrega.

## Evidências locais

Somente Supabase descartável `editorial-status-database`, API 59421/DB 59422,
PostgreSQL 17, Node 22.23.4 e CLI 2.116.0. Configuração e normalização ACL de QA
permanecem fora do commit. Os onze containers antigos foram temporariamente
parados para liberar memória e restaurados após os testes. O descartável foi
parado, sem remover volumes. Arquivos e dados preexistentes preservados.

- pgTAP completo: 35 arquivos / 1.002 assertions aprovadas, incluindo 48 novas.
  Valores/legados, grants efetivos com herança, autoria/terceiro/anon, termos,
  drafts/18+, filtros combinados, paginação, revisão e rollback.
- Data API/projeção/snapshot: 16/16 testes, serial, sem retries. Chamadas reais
  às cinco assinaturas antigas e à nova, 13 aliases de ordenação, cursor,
  resultados fora da primeira página ampla, autorização, edição sem perda,
  NULL, falhas e duas sessões concorrentes. Incluídos no gate de integração
  já existente por extensão de `public-work-projection-supabase-real.test.mjs`;
  nenhum workflow alterado.
- Unitários de snapshot: 14/14, incluindo legado/NULL/erro/valores inválidos,
  separação da chave de cache anterior e regressões de versões concorrentes.
- Bloco final de criação/checagem da RPC validado em transação revertida,
  confirmando identidade de definição/defaults/ACL das cinco variantes antigas.
- Lint SQL público: sem erros. Lint focado, Typecheck e Build aprovados.
  Primeiro Build bloqueado pela junction de dependências fora da raiz do
  Turbopack; resolvido com `npm ci` isolado/lockfile intacto, sem mudar config.
- Auditoria estática direta: 199/199. O helper ACL local foi temporariamente
  retirado de `migrations` e restaurado após a verificação: sua presença ali
  reprova corretamente o guard contra versionar fixtures de QA. O wrapper
  `npm run test:static` foi recusado pelo NVM (NVM4306); executado somente o
  auditor `node qa/scripts/static-audit.mjs`, sem alterar a confiança do NVM.
  Os demais unitários desse gate ficam para a CI; não declarar o gate inteiro
  executado localmente. `git diff --check` aprovado.

EXPLAIN ANALYZE/BUFFERS das chamadas reais, mesma fixture local, com Build em
paralelo (amostra diagnóstica sob contenção, não benchmark nem SLA):

| Variante | Linhas | Shared hit blocks | Execução |
| --- | --- | --- | --- |
| 14 argumentos | 24 | 2.631 | 94,770 ms |
| 15, status neutro | 24 | 2.631 | 107,489 ms |
| 15, pausada | 24 | 3.153 | 43,144 ms |

Neutro retorna exatamente os mesmos dados/cursor da antiga. Predicado confirmado
antes da agregação/cursor/limite; nenhum índice acrescentado. Os tempos isolados
não comprovam melhora/regressão; não extrapolar para produção. Não há consultas
novas no snapshot: somente campo JSON e namespace do cache aditivos.

As primeiras execuções identificaram erros nas novas fixtures/assertions
(posição do CTE, nomes dos parâmetros de aceite e expectativa de schema privado),
corrigidos antes da rodada verde. Não houve alteração de RLS/contrato para
aceitar esses erros. O teste antigo de gênero agora delimita sua garantia às
cinco variantes anteriores; a sexta recebe suas próprias verificações.

## Implantação e recuperação

Banco antes da aplicação; esta fase não entrega controles de criação/edição,
status visual, URL ou filtro cliente. Etapa 2 depende também do token aprovado
e de seus testes (ABA, recriação, concorrência, identidade e respostas antigas).
Em rollback da aplicação, preservar coluna, valores e contratos compatíveis;
não remover dados preenchidos nem reverter o schema destrutivamente.

Suíte completa e checks finais pertencem à CI; não homologam produção gerenciada
ou capacidade física. Não ativar agendamento, Cron, runner, uploads ilustrados
ou abertura pública. Nenhuma migration aplicada em produção.
