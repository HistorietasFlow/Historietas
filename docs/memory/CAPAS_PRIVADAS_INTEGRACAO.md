# Novas capas privadas — preparação desativada

Data: 13/11/2026. Base: `98be8c31`. Branch existente:
`feat/private-cover-upload-integration`.

## Estado e limites

Preparação isolada em `lib/private-covers/`, sem consumidor de aplicação,
endpoint, SDK ou credencial. `uploadPrivateCover` retorna sempre `disabled`;
não há variável de ambiente que o habilite. Os fluxos legados não mudaram.
O guard de 18+ com capa remota permanece. Nenhuma migration, bucket remoto,
backfill, remoção, upload, ativação, produção ou merge faz parte desta entrega.

As branches `feat/private-cover-transaction-contract` (PR 1) e
`feat/private-cover-authorized-delivery` (PR 2) foram consultadas por Git:
ambas apontavam para `98be8c31`, sem diff na consulta inicial. Não havia PR
de capa privada localizada na busca inicial do GitHub. Isso não garante que
outro trabalho paralelo permaneça inalterado. Nenhum arquivo de aplicação,
rota de entrega, cache, migration ou tipo gerado dessas frentes foi editado.

## Contratos preparados

- `reference.ts`: referência opaca versionada, canônica e congelada, contendo
  obra, geração e asset. É um **formato provisório local**, sem contrato de banco
  implantado. Nunca contém caminho, URL pública, assinatura ou token de acesso.
  O discriminador privado prevalece sobre URL antiga; referência ausente,
  inválida ou de versão desconhecida resulta em indisponibilidade. O resolvedor
  também recusa registro misto legado com referência privada preenchida.
  Ele não gera URL nem autoriza leitura. Consumidores existentes ainda não o usam.
- `upload-protocol.ts`: portas explícitas de reserva, armazenamento e commit.
  O núcleo é interno e server-only, sem implementações concretas das portas;
  não deve ser importado por rotas antes de resolver os bloqueadores abaixo.
  Reserva deve vincular chave, obra, geração, versão e sessão no servidor.
  Asset novo, `upsert: false`, cache solicitado `0`, MIME de imagem e até 2 MiB.
  A checagem de MIME declarada é somente pré-validação; decoder real é pendente.
  Essas opções não comprovam imutabilidade física, privacidade ou revogação.
- O núcleo só expõe referência após commit confirmado com recibo coincidente.
  Recusa, conflito, recibo divergente, resposta perdida ou contexto obsoleto
  não expõem referência. A chave é preservada para recuperação futura.
  Não há retry, delete, restauração ou liberação de quota, inclusive após
  upload confirmado e commit recusado/incerto. A recuperação causal ainda
  depende de PR 1; o adaptador não infere sucesso por leitura do estado atual.
- `quota.ts`: modelo puro de reconciliação de inventário completo, nunca uma
  autorização de upload. Une objetos e reservas retidas pela identidade
  `(bucket, path)`, cobra o maior tamanho e usa máximo do bucket sem metadata.
  Caminhos iguais em buckets diferentes contam separadamente. Proprietários
  divergentes, inventário incompleto, bucket desconhecido ou números inválidos
  falham fechados. Holds de IO incerto devem continuar no inventário mesmo
  após expiração, logout ou cascata. Substituição cobra antigo e novo.

## Quotas e dependências transacionais

Nome **provisório** do quarto bucket no modelo: `capas-obras-privadas`.
Não existe criação ou alteração de bucket nesta branch.

| Limite preservado | Contabilização proposta |
| --- | --- |
| 2 MiB por capa | Pública e privada, com MIME de imagem permitido |
| 60 capas por usuário | Soma dos dois buckets, sem dobrar o limite |
| 5 avatares / 30 anexos por usuário | Mesmos limites legados |
| 100 objetos / 100 MiB por usuário | Todos os quatro buckets e holds retidos |
| 5.000 objetos / 700 MiB globais | Todos os quatro buckets e holds retidos |

**O SQL atual ainda conta somente três buckets.** Atualizar na PR 1 o helper
`upload_storage_dentro_cota`, o ledger de reservas/tentativas ilustradas e
todos os escritores sob o mesmo lock `historietas:storage:cota:v1`. Fontes:
`20260826162505_proteger_storage_contra_esgotamento_cota.sql`,
`20261107235846_reservar_capacidade_capitulos_ilustrados.sql` e
`20261108012821_registrar_tentativas_upload_ilustrado.sql`.
Unir objeto/hold sem contar duas vezes, incluir objetos privados órfãos e
manter capacidade durante resultados incertos. A corrida de admissão/conclusão
descrita em [PROBLEMS_AND_SOLUTIONS.md](PROBLEMS_AND_SOLUTIONS.md#storage-disputa-de-quota-entre-reserva-e-upload-legado)
continua pendente. O modelo puro não a resolve e `withinLimits` não autoriza IO.

## Checklist de integração pendente

1. **PR 1:** definir contrato final de referência, geração e versão de
   capa/classificação protegidas para todos os escritores, sessão/propriedade/
   termos e recibo causal idempotente. Proteger ABA/recriação e concorrência.
   Fornecer portas autenticadas, fencing na conclusão física e recuperação por
   chave. Não reutilizar token editorial como versão geral dos assets.
2. **Quotas no banco/Storage:** incorporar privado sem ampliar limites, impedir
   bypass por service role/cliente antigo, testar admissão e commit reais em
   concorrência, resposta perdida, crash e exclusão de conta.
3. **PR 2/entrega:** autorização no primário a cada nova requisição, identidade,
   visibilidade/18+, cache/aliases/otimizador e respostas em trânsito. Não servir
   via URL pública nem assinatura reutilizável. Cache `0` no upload não prova
   esse contrato. Referência sozinha nunca concede acesso.
4. **Consumidores:** migrar discriminador e referência por todo o
   [inventário](CAPAS_PRIVADAS_CONSUMIDORES.md). Remover fallbacks de URL antiga
   quando o modo for privado, inclusive em normalizadores, mesclas locais,
   cache compartilhado, CSS, `next/image`, SEO e JSON-LD. Falha de entrega deve
   mostrar placeholder. Não tentar buscar a URL pública em onError/retry.
5. **Ciclo de vida:** integrar exclusão de conta e limpeza com inventário de
   referências e evidências retidas, sem liberar capacidade por cascata ou
   ausência momentânea. `lib/server/exclusaoConta.ts` ainda lista três buckets.
6. **Homologação:** pgTAP/ACL/RLS, Data API com duas sessões, Storage real
   descartável, E2E desktop/mobile/PT/EN/ES/foco/axe e entrega/CDN gerenciados.
   Só depois, revisão separada para ativação. Legado público continua bloqueado
   segundo [TRANSICAO_18_COM_CAPA.md](TRANSICAO_18_COM_CAPA.md); copiar não revoga
   URLs já entregues. Uploads ilustrados continuam suspensos.

## Validação

Os testes novos exercitam os módulos reais transpilados com portas simuladas,
sem substituir a flag de desativação e sem rede/Storage. Há cenários de resposta
perdida em cada fronteira, conflito/recusa/incerteza após upload, recibo de outro
asset, reserva de outra obra/geração, logout/troca de contexto, validação de
entrada, referências e quotas. A bateria integra o gate `pretest:static` por
importação de `storage-select-policies.test.mjs`, preservando o pipeline.

Não alegar atomicidade, imutabilidade física, homologação de RLS, Storage ou CDN
com base nesses testes. Evidências locais finais e CI são registradas na PR.

Execução local no Node **22.23.5** (artefato oficial com SHA-256 conferido),
usando dependências preexistentes, sem reinstalar ou alterar lockfiles:

- Novos casos: **22/22** aprovados; guarda de desativação, protocolo simulado,
  fallback público, quotas e ausência de importadores ativos.
- Bateria nova + regressões: **96/97** aprovados, zero skips/retries.
  Única falha em `obra-page-metadata-utils.test.mjs:95`, asserção estrutural que
  exige `<ObraDinamicaClient />` literal. Reproduzida com **4/5** em cópias de
  `98be8c31` do teste, página e helper, verificadas byte a byte idênticas ao
  checkout atual. A página usa props; nenhum desses três arquivos foi alterado.
  A falha permanece explícita, sem enfraquecer a asserção ou ampliar esta PR.
- Typecheck e Lint focado aprovados. Inventário de **181 fontes** e referências
  locais revisados; diff completo e `git diff --check` conferidos antes do commit.
- Não executados Build/Playwright: nenhum fluxo ativo ou interface foi alterado.
  pgTAP/Data API/Storage e CDN privados aguardam PR 1/entrega e implementações
  concretas; o modelo não substitui essas provas. Nenhum serviço foi iniciado.

Comando da bateria de 97 testes (inclui os novos pelo import do gate):

```sh
node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/storage-select-policies.test.mjs \
  qa/unit/editar-obra-current-assets-preparation.test.mjs \
  qa/unit/editar-obra-save-assets-preparation.test.mjs \
  qa/unit/editar-obra-remote-update.test.mjs \
  qa/unit/editar-obra-remote-storage.test.mjs \
  qa/unit/editar-obra-save-preparation.test.mjs \
  qa/unit/editar-obra-storage-path-utils.test.mjs \
  qa/unit/editar-obra-update-payload.test.mjs \
  qa/unit/editorial-status-lifecycle.test.mjs \
  qa/unit/obra-content-18-access.test.mjs \
  qa/unit/public-content-json-ld.test.mjs \
  qa/unit/public-work-snapshot.test.mjs \
  qa/unit/obra-page-metadata-utils.test.mjs
```

Documentação Supabase conferida pelo conector no repositório oficial:
[`standard-uploads.mdx`](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/uploads/standard-uploads.mdx),
blob `bc9f68a87e3e85a39dfc5e40e610141a9bd3072b`: caminho novo e `upsert: false`
evitam substituição pelo cliente; URLs assinadas individuais não são revogáveis.
O fetch do índice `https://supabase.com/changelog.md` falhou (curl 56/HTTP 000)
neste ambiente; não foi possível verificar novidades pelo índice.
