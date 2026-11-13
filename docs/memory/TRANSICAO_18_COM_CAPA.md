# Transição para 18+ com capa existente — investigação e proposta

Data: 13/11/2026. Base examinada: `a5ac96c7` (`main`, #2285).
Branch: `investigation/safe-18plus-cover-transition`, sem commits da #2286.

**Resultado da investigação #2287: não havia solução comprovadamente segura nos contratos examinados.**
A entrega original foi documental. O bloqueio existente permanece; não foi implementada
uma transição, migration, serviço, limpeza ou ativação. As evidências abaixo
descrevem o código versionado, não o estado de produção.

## Contrato que precisa ser preservado

- Uma tentativa recusada, conflitante ou incerta não pode destruir a capa que
  a obra anterior ainda referencia, nem ser apresentada como sucesso.
- A confirmação de 18+ não pode depender de uma futura remoção best-effort de
  uma capa ainda servida publicamente. Ocultar a imagem no formulário ou limpar
  `capa_url` não revoga a URL conhecida.
- A autorização exige identidade/sessão, propriedade e termos atuais. Nenhum
  novo contrato pode ampliar RLS, grants ou acesso ao conteúdo 18+ bloqueado.
- Bytes já entregues ou copiados por terceiros não podem ser recuperados.
  A proteção de requisições futuras e o tratamento de respostas já autorizadas
  em trânsito precisam de limites explícitos; não prometer revogação retroativa.
- Não considerar timeout, aborto do cliente, ausência momentânea, logout ou
  lease vencido como prova de encerramento de uma transferência.

## Evidência no repositório

| Fonte | Contrato observado e consequência |
| --- | --- |
| [`editar-obra-save-assets-preparation.ts`](../../app/editar-obra/lib/editar-obra-save-assets-preparation.ts), `prepararEEnviarAssetsEdicaoObra` | Com bloqueio 18+ e caminho **ou referência remota** de capa, lança erro antes dos uploads e do UPDATE. A referência não reconhecida pelo parser também bloqueia. |
| [`editar-obra-current-assets-preparation.ts`](../../app/editar-obra/lib/editar-obra-current-assets-preparation.ts) | A referência remota continua disponível mesmo se o formulário marcar remoção manual; essa marcação não atesta exclusão física. |
| [`use-editar-obra-save-action.ts`](../../app/editar-obra/hooks/use-editar-obra-save-action.ts), `salvarEdicao` | Consulta propriedade, prepara assets, envia UPDATE e só depois de resultado confirmado chama a remoção dos antigos. O catch da preparação é anterior a qualquer UPDATE. |
| [`editar-obra-editorial-write.ts`](../../app/editar-obra/lib/editar-obra-editorial-write.ts), `escreverMetadadosObra` | Um UPDATE filtra ID/dono; acrescenta CAS apenas quando há mudança editorial deliberada. Zero linhas, SQLSTATE, transporte e contexto obsoleto têm resultados distintos. Não há recibo durável da tentativa. |
| [`20261113013249_proteger_versao_status_editorial.sql`](../../supabase/migrations/20261113013249_proteger_versao_status_editorial.sql) | O token muda em INSERT/recriação ou mudança efetiva de **status editorial**. Edições de capa/classificação não o renovam; não é versão geral dos assets. |
| [`editar-obra-remote-update.ts`](../../app/editar-obra/lib/editar-obra-remote-update.ts) | Preserva uploads nos resultados não confirmados. Leitura posterior não é recibo causal do PATCH. |
| [`editar-obra-remote-storage.ts`](../../app/editar-obra/lib/editar-obra-remote-storage.ts) | Upload da aplicação cria caminho novo, `upsert: false`, e produz URL pública. Remoção usa `Promise.allSettled` e apenas avisa sobre erro; não retorna atestado físico ou transacional. |
| [`storageUploads.ts`](../../lib/storageUploads.ts) | Capas recebem `cacheControl: "31536000"` (um ano). Alterar o TTL futuro não revoga respostas anteriores. |
| [`20260806000400_storage_baseline.sql`](../../supabase/migrations/20260806000400_storage_baseline.sql) e [`20261104225029_restringir_listagem_storage_ao_proprietario.sql`](../../supabase/migrations/20261104225029_restringir_listagem_storage_ao_proprietario.sql) | `capas-obras` é público. SELECT/listagem é restrito ao dono, mas isso não protege a entrega pela URL pública. As policies de escrita usam o prefixo do usuário, não uma versão da obra/transição. |
| [`20260806000300_schema_public_baseline.sql`](../../supabase/migrations/20260806000300_schema_public_baseline.sql), tabela/grants de `obras` | O proprietário pode atualizar classificação e capa sob os controles existentes. Não há CHECK que faça retirada física, nem vínculo exclusivo entre objeto e obra. |

O bloqueio investigado é uma proteção do fluxo de edição. **Não é uma garantia
global do PostgreSQL/Storage contra clientes antigos ou chamadas diretas.**
As policies de capa permitem UPDATE do próprio objeto, embora o helper atual
use caminhos novos. Não presumir imutabilidade ou exclusividade física por
causa do comportamento de um único cliente.

O diagnóstico anterior de Storage API v1.65.1 em
[`PROBLEMS_AND_SOLUTIONS.md`](PROBLEMS_AND_SOLUTIONS.md#storage-disputa-de-quota-entre-reserva-e-upload-legado)
mostrou admissão e conclusão de upload em fases distintas. É evidência histórica
local de que um lock na admissão não cerca a gravação física; não identifica a
versão ou a garantia do Storage gerenciado nesta tarefa.

## Por que reordenar as operações não resolve

| Tentativa | Interleaving/falha que impede a garantia |
| --- | --- |
| Remover antes do UPDATE/CAS | Storage confirma remoção; o PATCH tem zero linhas, falha em termos/CHECK ou reverte. A obra permanece no estado anterior apontando para bytes removidos. Rollback SQL não restaura Storage. |
| UPDATE 18+ antes de remover | O banco confirma; DELETE falha, o processo cai ou a resposta se perde. A capa continua pública com a obra já em 18+. |
| Transação SQL/lock envolvendo HTTP | Rollback SQL não desfaz IO externo, nem revoga caches. RLS na admissão não comprova que escritores já aceitos terminaram. HTTP sob locks aumenta o período de contenção sem criar commit distribuído. |
| Limpar a referência e usar outbox | A intenção pode ser durável, mas existe uma janela pública até o consumidor concluir. Outbox não é recibo de remoção nem revogação de cache. |
| Copiar para privado, depois remover/mover | A cópia não revoga a origem, aliases ou caches; falha parcial continua exigindo recuperação e prova do destino/origem. Não apagar a origem como compensação de resultado incerto. |
| Remover manualmente em um salvamento e selecionar 18+ no seguinte | O primeiro salvamento usa cleanup tolerante a erros, sem recibo durável de retirada. A ausência de `capa_url` no segundo não prova inacessibilidade da URL anterior. Não recomendar como contorno. |
| Backup e restauração compensatória | Restauração é outro IO falível; pode sobrescrever uma versão nova ou reexpor a capa após uma transição concorrente. Não equivale a rollback atômico. |
| Despublicar, reduzir TTL, trocar URL ou restringir SELECT | Essas ações não revogam uma URL pública já conhecida, nem uma resposta já cacheada. |
| Atualizar/apagar diretamente `storage.objects` | Altera metadados, não garante a retirada dos bytes. A documentação exige Storage API; não criar trigger SQL para simular remoção física. |

### Corridas adicionais que um protocolo precisa cobrir

1. A lê a capa X. B troca para Y sem mudar status editorial. O token editorial
   permanece igual. Um CAS só editorial não impede A de confirmar uma intenção
   baseada em X nem prova que Y foi retirada.
2. A observa ausência de capa. B publica uma capa entre essa leitura e o PATCH
   de A. A grava classificação 18+ e referência vazia; os bytes publicados por B
   podem continuar acessíveis. É uma lacuna do modelo atual, não resolvida pela
   preservação do guard do caso com capa observada.
3. Um escritor já admitido termina após DELETE ou após uma checagem de ausência.
   A referência pode reaparecer fisicamente sem passar pela decisão final da
   transição. Lease/timeout isolado não é fencing no ponto de commit.
4. X é referenciada por outra obra ou por uma versão anterior ainda relevante.
   Remover o caminho baseado apenas no prefixo do usuário não prova que ele é
   exclusivo da obra. URLs externas/não reconhecidas não autorizam fetch,
   exclusão ou inferência de propriedade.
5. Obra/conta é excluída e o mesmo ID reaparece enquanto há IO pendente. Sem
   geração e evidência durável independente de cascatas, uma resposta antiga
   pode atingir o novo estado. Leitura coincidente não identifica qual tentativa
   confirmou uma mudança.

Esses casos são contraexemplos de ordenação deduzidos dos contratos examinados;
não foram reproduzidos contra Storage nesta sessão.

## Documentação oficial consultada

Conteúdo obtido em 13/11/2026 pelo conector GitHub, no repositório oficial
`supabase/supabase`. Os hashes abaixo identificam os blobs lidos, não a versão
implantada em produção:

- [Buckets / fundamentos](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/buckets/fundamentals.mdx),
  blob `c8254be3d7a0f2624d13d9fb345018a3a213d39e`: bucket público ignora
  controles de acesso na entrega; outras operações continuam autorizadas.
- [Servir assets](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/serving/downloads.mdx),
  blob `b58c61dad8dfb0fb21c3310888f006e22852687c`: URLs públicas e formas de
  acesso privado. Uma URL assinada é uma capacidade temporal, não uma consulta
  da classificação atual a cada acesso.
- [Excluir objetos](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/management/delete-objects.mdx),
  blob `03c102d3628e327c5cc1bc66c10772b687d76408`: exclusão permanente via
  Storage API; DELETE SQL deixa bytes órfãos.
- [Smart CDN](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/cdn/smart-cdn.mdx),
  blob `8b3ef192121a386a72fa34107bf4f7d22e280fbc`: descreve propagação de
  invalidação de até 60 segundos e persistência no cache do navegador. Também
  distingue validade de token e cache de URLs assinadas/autenticadas. Smart CDN
  é descrito como recurso Pro ou superior: não presumir esse plano, SLA ou
  comportamento aplicado ao projeto sem homologação própria.

O índice `https://supabase.com/changelog.md` retornou HTTP 403 no ambiente.
Não foi possível verificar breaking changes por esse índice. As fontes acima
não fornecem um commit compartilhado entre o PATCH da aplicação e a retirada
global do objeto/cache. Não alegar impossibilidade de toda arquitetura futura;
a conclusão é a ausência de prova para o desenho atual.

## Proposta técnica — pré-condições, sem autorização de execução

### 1. Definir precisamente a garantia de leitura

Separar: (a) nova autorização no servidor após o commit de 18+;
(b) transferência já autorizada antes do commit; (c) cópia/cache já entregue.
O desenho deve negar (a), explicitar o tratamento de (b) e não prometer revogar
(c). Uma aceitação de risco diferente desse contrato exige decisão expressa do
responsável; não inferi-la nem reduzir a proteção para liberar o fluxo.

### 2. Preferir autorização de leitura vinculada ao estado transacional

Para novas capas, avaliar armazenamento privado desde a origem, referências
imutáveis e um caminho de entrega controlado pelo servidor que valide o estado
atual da obra no primário a cada nova autorização. O commit SQL pode então
alterar classificação/visibilidade e recibo juntos **sem apagar bytes**.
O desenho precisa impedir URLs públicas/diretas, URLs assinadas reutilizáveis
ou caches de resposta que contornem essa decisão. Apenas marcar um bucket como
privado ou acrescentar RLS não comprova esse caminho completo.

Essa direção exige projeto e testes próprios para identidade, visibilidade,
cache, concorrência, carga e todos os consumidores de capa (catálogo, perfis,
Obra, metadata/imagens e estado cliente). Não criar endpoint, serviço ou
mudança de bucket nesta tarefa. Não reutilizar o namespace ou liberar os
uploads ilustrados suspensos.

**Legado público continua bloqueado:** uma cópia privada não resolve URLs
anteriores. Seria necessária uma etapa administrativa separada que inventarie
referências e prove a desativação da entrega pública/aliases e o tratamento de
caches, sem apagar arquivos. Se o backend não oferecer essa garantia compatível
com o contrato escolhido, manter o caso legado indisponível. Nenhum backfill,
mudança global de bucket ou exclusão está autorizado por esta proposta.

### 3. Proteger todos os escritores, não apenas o formulário

Projetar uma geração da obra e versão específica de capa/classificação, geradas
e protegidas no banco, com comparação sob lock na decisão final. Proteger também
INSERT/recriação, clientes antigos, chamadas Data API diretas e mudanças somente
de capa. O token editorial atual e a revisão pública não são substitutos sem
um novo contrato dedicado (a projeção pública não cobre drafts/18+).

Qualquer intenção durável deve vincular chave idempotente, geração, versão
esperada, dono/sessão e identidade imutável do objeto. Uma chave deve ter um único
resultado. O recibo causal e a mudança lógica devem ser persistidos na mesma
transação. A consulta de recuperação só pode atestar aquela tentativa; igualdade
do estado atual, timestamp ou sucesso HTTP isolado não bastam.

### 4. Se ainda houver IO externo indispensável, exigir prova do backend

Antes de implementar uma saga de retirada, obter contrato verificável de:

- fencing no ponto de gravação/conclusão do Storage, incluindo transferências
  já admitidas e caminhos de escrita alternativos;
- identificação de objeto/versão e retirada condicional sem atingir versão ou
  referência de outra obra, inclusive sob exclusão/recriação;
- conclusão durável e consultável da operação específica, com semântica de
  resposta perdida e de revogação em origem/CDN compatível com a garantia;
- preservação de evidências e capacidade durante IO incerto, sem liberar quota
  ou declarar sucesso por expiração, ausência, retry ou cascata.

Depois dessas provas, desenhar estados explícitos de intenção preparada,
IO iniciado, resultado incerto, retirada comprovada e conclusão SQL. Não
confirmar 18+ no estado incerto, não restaurar/excluir automaticamente e não
permitir cancelamento que finja desfazer IO irreversível. A obra não pode ficar
no estado anterior apontando para objeto retirado: um eventual estado de
transição com capa indisponível precisa de contrato de produto e recuperação
aprovado **antes** de qualquer IO. Uma lista de estados/outbox por si só não
comprova essas propriedades nem torna a proposta pronta para implementação.

## Critérios de aceitação de uma futura implementação

| Camada | Provas exigidas antes de liberar o caso |
| --- | --- |
| pgTAP / ACL / RLS | Dono, sessão ativa, termos, classificação/avisos, versão/geração, ABA/recriação, rollback, grants mínimos e ausência de bypass por DML direto/cliente antigo. |
| Data API com duas sessões | Troca de capa sem mudança editorial; ausência → capa concorrente; duas transições; resultado ambíguo; reconsulta por chave estável; zero efeitos parciais em conflito. |
| Storage real descartável | Escritor pausado antes/depois da admissão e conclusão; revogação/retirada concorrente; substituição e referência compartilhada; resposta perdida; recuperação após crash/logout/cascata. Testar a versão real, sem assumir semântica do mock. |
| Entrega e cache gerenciados | URL antiga, origem, aliases, CDN, transformações, assinatura, navegador quente/frio e leitores concorrentes. Prova do limite de requisições após commit; testes locais não homologam o CDN gerenciado. |
| Aplicação / E2E | Desktop/mobile, PT/EN/ES, foco/teclado/axe, intenção preservada, pendência/incerteza distintas de sucesso, logout/troca de conta/rota e ausência de reenvio ou cleanup destrutivo. |
| Recuperação / operação | Recibo causal idempotente, crash em cada fronteira, inventário de referências, evidência sem cascatas, nenhuma liberação de quota ou limpeza sem prova. Sem ativação automática. |

Sem as pré-condições, o critério de aceitação desta investigação é preservar
o bloqueio atual e entregar o diagnóstico. Não transformar a matriz em testes
simulados que declarem garantias do backend inexistentes.

## Validação desta entrega

Ambiente sem containers ativos (`docker ps` somente leitura), sem Supabase CLI
disponível no PATH e sem Supabase local preparado. Nenhum Docker/Supabase,
servidor web ou navegador foi iniciado; nenhum navegador foi instalado.

Runtime padrão observado: Node 24.22.1. Para respeitar o contrato Node 22 do
repositório, foi usado Node **22.23.5**, extraído em `/workspace/work/` do
artefato oficial com SHA-256 conferido contra `SHASUMS256.txt`. Dependências
preexistentes foram usadas, sem reinstalação ou alteração de lockfiles.

**39/39 testes existentes aprovados**, zero falhas/skips/retries, com:

```sh
node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/editar-obra-current-assets-preparation.test.mjs \
  qa/unit/editar-obra-save-assets-preparation.test.mjs \
  qa/unit/editar-obra-remote-update.test.mjs \
  qa/unit/editar-obra-remote-storage.test.mjs \
  qa/unit/editar-obra-save-preparation.test.mjs \
  qa/unit/editar-obra-storage-path-utils.test.mjs \
  qa/unit/editar-obra-update-payload.test.mjs \
  qa/unit/editorial-status-lifecycle.test.mjs \
  qa/unit/storage-select-policies.test.mjs \
  qa/unit/obra-content-18-access.test.mjs
```

Essa bateria confirma regressões da recusa, preparação, CAS, resposta incerta,
ausência de cleanup no wrapper, cache de upload e isolamento estrutural da
listagem. Usa mocks/análise de fontes; **não prova** atomicidade, terminalidade,
exclusão física ou revogação de CDN.

Não executados: pgTAP, integrações Data API/Storage
(`editorial-status-application-supabase-real`, `editorial-status-version-supabase-real`,
`storage-policies-supabase-real`) e Playwright (`editorial-status.spec.mjs`)
por falta da infraestrutura local preparada e proibição de iniciá-la.
Não executar esses harnesses destrutivos contra projeto remoto. Build,
Typecheck e Lint da aplicação não se aplicam ao diff exclusivamente documental;
nenhum gate de CI foi alterado. Os resultados históricos da #2284 não são uma
nova execução desta tarefa nem homologação de produção.

Revisão documental: diff completo revisado, 12 referências locais da proposta
e dois links de entrada do Memory Bank conferidos; quatro fontes externas
oficiais lidas. `git diff --check` aprovado. Somente os três documentos desta
investigação fazem parte do commit.

## PR 1 — contrato transacional privado (13/11/2026)

Base: `98be8c31`; branch remota existente
`feat/private-cover-transaction-contract`. Migration dedicada:
`20261113190105_contrato_transacional_capas_privadas.sql`.
Esta etapa prepara somente SQL, sem backfill, bucket, upload, entrega,
assinatura, retirada fisica ou desbloqueio da interface/18+.

### Identidade e escritores

- `historietas_privado.obra_capas_estado` guarda geracao UUID, versao bigint
  propria, autoria, tombstone, vinculo privado e marca conservadora de origem
  publica/incerta. Nao reutiliza token editorial ou geracao da projecao publica.
- INSERT gera identidade no banco. DELETE/TRUNCATE conservam tombstones;
  recriacao e mudanca administrativa de ID/autoria invalidam geracao e vinculo.
  Nenhuma FK/cascata elimina evidencias. A administracao nao pode alterar
  identidade e capa/classificacao no mesmo UPDATE deste contrato.
- Sem preenchimento em massa: a primeira consulta/mutacao relevante de uma
  obra anterior inicializa apenas seu registro privado sob lock da obra, como
  origem incerta. Nao regrava tuplas, publica dados nem certifica capa ausente.
- Escritores legados continuam funcionando para obras nao gerenciadas e
  invalidam a versao ao alterar capa/nome/classificacao/avisos. A marca de
  possivel exposicao publica nunca e limpa por remocao da URL ou recriacao.
  Transicao 18+ com essa marca e recusada no banco, inclusive via Data API.
- Depois de vinculo privado, apenas operacao versionada altera esses campos;
  retirar o vinculo nao reabre DML legado. Sinopse, titulo, status editorial,
  publicacao e contadores conservam seus contratos. O trigger de UPDATE e
  limitado as colunas relevantes, sem acionar o ledger por visualizacoes.

### Operacoes, autorizacao e recibos

Wrappers publicos `SECURITY INVOKER`, sem EXECUTE de anon/service_role:

- `consultar_contrato_capa(p_obra_id)` retorna somente contexto do proprietario:
  identidade, geracao, versao decimal em string, referencia opaca, classificacao,
  avisos e indicadores de origem/gerenciamento. Nenhum caminho ou URL.
- `aplicar_operacao_capa(p_operacao_id,p_obra_id,p_geracao,p_versao,
  p_capa_privada_id,p_classificacao,p_avisos)` persiste alteracao, versao e recibo
  causal na mesma transacao. Parametros sao exatos; nao normaliza avisos nem
  contorna CHECKs. Vinculo sem mudanca dos campos publicos tambem avanca a
  revisao logica publica, sem flush, outbox ou ACK.
- `consultar_operacao_capa(p_operacao_id)` recupera somente o recibo da mesma
  identidade/sessao. Recibo passado nao e autorizacao nem snapshot atual;
  continua identificando a geracao original depois de excluir/recriar a obra.

O nucleo privado definer tem `search_path` vazio, ownership postgres e grants
explicitos; revalida usuario, sessao real em `auth.sessions`, exclusao pendente,
propriedade e termos vigentes. Revalida expiracao depois das esperas por locks
e antes de concluir o recibo, revertendo inclusive o UPDATE ja executado.
Ordem de locks: usuario, sessao, perfil, UUID da
operacao, obra, estado. O lock de UUID serializa repeticoes; o lock da obra e
CAS descartam concorrentes/ABA. Uma sessao diferente nao assume uma operacao
antiga. Nenhum NULL de `auth.uid()` autoriza execucao.

Parametros e recibos sao privados e imutaveis; apenas preencher o recibo na
mesma transacao e permitido. Zero linhas, CHECK, erro ou aborto revertem tudo.
Retry exato de operacao confirmada devolve o recibo original sem nova alteracao;
UUID confirmado com parametros diferentes e conflito. Operacao revertida nao
deixa recibo. Ausencia retorna `terminal=false`: nao prova que uma requisicao
atrasada terminou e nao autoriza substitui-la por uma nova chave. Nao ha
cancelamento/reconciliacao de IO, pois nao existe IO externo nesta etapa.

### Referencias internas e limites ainda bloqueados

`obra_capas_referencias` possui UUID, obra, geracao, autor, bucket/caminho
imutaveis e data, sem grants de tabela ou produtor autorizado. O caminho tem
estrutura exata de autor/geracao/asset e e unico. A operacao so aceita referencia
interna pertencente a mesma obra/geracao/autor e sem origem publica/incerta.
As tres tabelas privadas tem RLS e REVOKE explicitos, sem acesso direto pelos
clientes ou service_role. Nenhuma coluna/grant/policy de obras foi ampliada.

O nome reservado `capas-obras-privadas` e somente contrato de referencia:
nenhum bucket foi criado. Fixtures SQL internas nao comprovam bytes, privacidade
fisica, quotas ou validacao de imagens. Registro seguro de referencias,
capacidade durante upload incerto, entrega server-only, exclusao do otimizador,
consumidores/cache e revogacao do legado publico continuam em fases futuras.
Nao usar SQL administrativo para popular essa tabela como atalho de upload.

Retencao: conservar estados, referencias e recibos integralmente nesta fase.
Nao ha TTL, purga, liberacao de quota ou orcamento arbitrario. Custo de retencao,
admissao operacional e exclusao de conta precisam de contrato antes de uso
amplo. Este ledger nao certifica capacidade fisica nem terminalidade do Storage.
O bloqueio da interface e a suspensao dos uploads ilustrados nao mudam.

### Evidencias locais da PR 1

Node 22.23.4 e CLI 2.116.0. Banco novo `private-cover-contract`, API em loopback
63421 e PostgreSQL 63422; nenhuma consulta/migration remota. Config e auxiliar
ACL locais nao versionados. O primeiro start sem schema Storage falhou na
baseline; a configuracao local foi corrigida antes de aplicar as migrations.
Nenhum container antigo foi pausado, nenhum volume foi removido.

- pgTAP completo: **38 arquivos, 1.143 assertions aprovadas**, incluindo
  **60** do contrato de capas; sem omissoes ou retries. Comando:
  `supabase test db --workdir <worktree-descartavel>`.
- Data API focada: **10/10 contagens TAP** (9 cenarios e suite), com
  `node --test --test-concurrency=1 qa/integration/private-cover-contract-supabase-real.test.mjs`.
  Inclui duas sessoes Auth reais, disputa de versao, UUID duplicado, resposta
  HTTP perdida depois do commit, rollback/timeout, escritores legados nas duas
  ordens, snapshot Repeatable Read antigo, ABA/recriacao, referencia imutavel,
  autoria, termos/logout e expiracao durante espera na revisao publica.
- Cadeia de projecao publica/editorial/Storage legado aprovada (38 contagens
  TAP na entrada `public-work-projection-supabase-real.test.mjs`). A rodada
  conjunta contou 47/47 porque tambem incluiu diretamente o arquivo novo.
  A ultima ampliacao da revalidacao de expiracao foi retestada no arquivo
  focado e no pgTAP completo, sem repetir toda essa cadeia.
- Regressoes unitarias existentes da #2287: **39/39**, sem retries, incluindo
  recusa 18+, assets, resposta incerta, isolamento de identidade e policies.
- ESLint focado nos dois arquivos JS, syntax check, regra de GRANT/REVOKE e
  `git diff --check` aprovados. Nenhuma dependencia/workflow alterado.
- Lint SQL focado no novo nucleo privado via `plpgsql_check_function_tb`, em
  transacao revertida: sem erros. O `supabase db lint --local --schema
  historietas_privado --level error --fail-on error` global encontrou **cinco**
  erros por ausencia de `cron.job`/`cron.job_run_details` em funcoes de
  monitoramento nao alteradas neste diff. Nao instalar/ativar Cron nem mudar
  essas funcoes para aprovar lint; a verificacao global nao foi declarada verde.

Falhas corrigidas antes da entrega: o primeiro guard de identidade recusava
mudancas administrativas de autoria usadas em dois pgTAP existentes; agora
elas invalidam geracao/referencia sem ampliar grants. Na nova fixture, logout
do cliente clonado de resposta perdida revogava a sessao compartilhada; esse
cleanup indevido foi retirado, mantendo o teste real de logout separado.
Uma regressao adicional comprova zero linhas sem falso sucesso. As assercoes
originais nao foram relaxadas e nenhum timeout/retry foi ampliado.

Sem alteracao de aplicacao: Build, Typecheck e Playwright nao repetidos nesta
PR de backend/QA; todos os gates completos permanecem na CI. O arquivo novo
e importado pela integracao publica ja executada na CI, sem mudar workflows.
Essas provas sao do PostgreSQL/Auth/Data API locais, nao do Storage/CDN
gerenciado. PR em draft nao autoriza implantacao nem as proximas fases.
