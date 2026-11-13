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

## Bloqueador identificado na Etapa 1 — histórico

Na entrega da #2282, não existia token de edição utilizável pelo autor em todos os casos:

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
era proposta pendente naquela entrega. A etapa de versão abaixo foi autorizada
posteriormente; a interface e sua adoção obrigatória do CAS continuam pendentes.

## Proteção de versão editorial — base `ad9a0188` (#2282)

Migration `20261113013249_proteger_versao_status_editorial.sql`, gerada pela CLI
2.116.0. Acrescenta somente `status_editorial_versao uuid` nullable, sem default
volátil na coluna, backfill ou UPDATE em massa. Valores anteriores de status e
versão NULL legada permanecem intactos na instalação. O token é opaco, somente
para igualdade; não é contador ordenável, timestamp, segredo ou autorização.

Uma função privada de trigger, `historietas_privado.definir_versao_status_editorial`,
é SECURITY INVOKER, search_path vazio, sem EXECUTE efetivo para PUBLIC/anon/
authenticated/service_role. Não existe RPC de escrita nem SECURITY DEFINER novo.
O trigger BEFORE da própria linha:

- Sempre gera token no INSERT, substituindo qualquer UUID/NULL fornecido,
  inclusive na recriação do mesmo ID.
- Usa `IS DISTINCT FROM` para gerar outro UUID em mudança efetiva do status,
  incluindo de/para NULL e várias mudanças dentro da mesma transação.
- Preserva o token anterior no mesmo status ou ao editar outros campos.
- Não faz UPDATE recursivo. Token/status confirmam e revertem juntos.

Nenhum grant foi acrescentado. UPDATE(status_editorial) e INSERT existentes
permanecem; authenticated/anon não possuem UPDATE efetivo da coluna de versão,
inclusive por herança. O token é visível pelos SELECTs já autorizados na tabela
somente nas linhas permitidas pela RLS: obra pública visível também permite
leitura do token por anon; proprietário pode lê-lo nos próprios drafts/18+.
Não é segredo e não foi acrescentado ao DTO público, projeção JSON ou catálogo.

Ordem existente: guard de termos (`e...`), token (`obras_status...`), timestamp
(`trigger_obras...`); revisão é AFTER. Os guards não foram alterados. A mudança
de status e token produz um único incremento da revisão existente; no-op não
produz outro. CHECK/termos/RLS recusados não deixam alterações parciais.

Aplicação usa INSERT + UPDATE explícitos de obras; não foi encontrado upsert de
obras nos caminhos auditados de publicar/editar/painel. INSERT ON CONFLICT com
UPDATE somente do status respeita a geração no caminho efetivo: no-op mantém
token, mudança gera outro, sem usar o token descartado do BEFORE INSERT.
Upsert Data API contendo colunas sem UPDATE, inclusive versão, continua recusado;
não ampliar permissões para fazê-lo funcionar.

### Contrato obrigatório da futura Etapa 2

O exemplo executável está em
`qa/integration/editorial-status-version-supabase-real.test.mjs` (`cas`).
O formulário ainda NÃO o consome. Na identidade atual, carregar status e versão
na mesma resposta remota, verificando presença explícita de ambos os campos.
Falha, cache isolado e campo ausente não confirmam versão NULL nem habilitam edição.

```ts
// `confirmado` vem da resposta remota atual, nunca do cache/formulário antigo.
// Confirmar propriedade/identidade atual antes de consumir essa resposta.
let escrita = supabase.from("obras")
  .update({ status_editorial: escolhaDeliberada })
  .eq("id", confirmado.id)
  .eq("user_id", usuarioAtualId);
escrita = confirmado.status_editorial_versao === null
  ? escrita.is("status_editorial_versao", null)
  : escrita.eq("status_editorial_versao", confirmado.status_editorial_versao);
const resultado = await escrita.select("id,status_editorial,status_editorial_versao");
```

- Comparação e UPDATE são uma instrução atômica. Enviar somente campos
  deliberadamente alterados, nunca a versão como coluna a escrever.
- Sucesso exige ausência de erro e exatamente uma linha retornada. Guardar o
  status/token retornados pelo banco, não presumir o valor do formulário.
- Zero linhas não é sucesso e não identifica sozinho conflito, exclusão ou
  perda de acesso. Não reler versão e reaplicar intenção antiga automaticamente.
- Resposta perdida/erro de rede é resultado incerto, não rollback nem sucesso.
  Reconciliar com leitura autenticada atual e intenção preservada; uma leitura
  posterior não é recibo causal. Sem recibos, retry automático ou rebase nesta fase.
- Token NULL confirmado é estado legado inicial. No-op e outros metadados não
  o preenchem; primeira mudança efetiva gera UUID e invalida CAS NULL anterior.
- UUID novo na recriação impede reutilizar token antigo ou CAS NULL legado.

**Fronteira:** o banco NÃO obriga todo UPDATE direto a usar CAS. Escrita legítima
sem condição continua possível, renova o token ao mudar status e invalida
snapshots antigos, mas não protege a própria escrita contra sobrescrita. A
proteção não versiona todos os metadados e não resolve automaticamente respostas
perdidas. Contrato seguro preparado; adoção/identidade/lifecycle na interface da
Etapa 2 ainda obrigatórios. Não declarar CAS geral ou interface pronta.

### Validação da versão

Somente Supabase descartável `editorial-status-version`, API 60421/DB 60422,
Node 22.23.4, CLI 2.116.0, PostgreSQL 17. Configuração e helper ACL não versionados.
pgTAP completo: **36 arquivos / 1.039 assertions**, incluindo 37 novas.
Data API + regressões da #2282: **27/27**, serial, sem retries (11 da nova
bateria e 16 anteriores). Nova bateria novamente **11/11** após fortalecer a
fixture 18+ como publicada, provando classificação independentemente de draft.
Unitários do snapshot da #2282: **14/14**. Lint focado, auditoria estática direta
**199/199** e diff check aprovados. Nenhum arquivo TypeScript de aplicação ou
interface mudou: Typecheck, Build e Playwright não foram repetidos. Sem instalar
dependências ou alterar confiança/configuração do NVM; suíte completa fica na CI.

Lint SQL público passou. `plpgsql_check_function_tb` do trigger novo, com contexto
de `public.obras`, passou sem erros/avisos em transação revertida. O lint de todo
o schema privado não passou: cinco funções antigas referenciam `cron.job` ou
`cron.job_run_details`, indisponíveis porque pg_cron não está instalado nesse
descartável. Funções de `20261109194305_observabilidade_privada_runner_capitulos.sql`
e `20261110014753_snapshot_monitor_externo_agendamento.sql` não foram alteradas;
nenhum objeto Cron foi instalado para mascarar os apontamentos. Não declarar
o lint privado global aprovado.

O teste incremental reconstitui somente o delta novo em transação revertida no
banco descartável, deixando o schema da #2282 com quatro obras preexistentes
(NULL e três estados). Aplica o corpo real da migration sem seus delimitadores
externos de transação. Confere todos os dados, xmin, relfilenode, revisões e
definições/ACL das RPCs: sem rewrite, backfill ou efeitos de instalação. Rollback
restaura o schema original antes de usar a Data API.

Para o cenário HTTP de legado NULL, fixture específica é inserida com somente
o trigger novo suspenso e restaurado dentro do mesmo lock/transação DDL local.
Nenhuma janela externa desprotegida; não suspende RLS, termos ou revisão. Isso
modela o estado legado cuja preservação foi comprovada no upgrade anterior;
novos INSERTs normais nunca podem obter NULL. Não usar esse procedimento em produção.

As primeiras execuções detectaram erros de fixture (identidade sem termos no
rollback pgTAP e coluna avisos_conteudo omitida em INSERT HTTP heterogêneo),
corrigidos sem flexibilizar guard, CHECK, RLS ou asserções.

### Implantação e recuperação da versão

Aplicar #2282 e esta migration antes da interface. Rollback de aplicação não
remove/reinicializa status ou versões e não desabilita o trigger. Correção de
schema deve ser forward-only revisada, preservando tokens existentes; não
restaurar NULL nem reutilizar UUID para contornar conflito. Nenhuma aplicação
remota ou ativação foi autorizada/executada nesta tarefa.

## Evidências locais da Etapa 1 (#2282)

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

## Implantação e recuperação da Etapa 1

Banco antes da aplicação; esta fase não entrega controles de criação/edição,
status visual, URL ou filtro cliente. Etapa 2 depende também do token aprovado
e de seus testes (ABA, recriação, concorrência, identidade e respostas antigas).
Em rollback da aplicação, preservar coluna, valores e contratos compatíveis;
não remover dados preenchidos nem reverter o schema destrutivamente.

Suíte completa e checks finais pertencem à CI; não homologam produção gerenciada
ou capacidade física. Não ativar agendamento, Cron, runner, uploads ilustrados
ou abertura pública. Nenhuma migration aplicada em produção.
