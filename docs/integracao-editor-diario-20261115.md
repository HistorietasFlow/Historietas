# Integração #2316 → #2307 → #2321

Base: `deeb839bceb9cefefac3389172034ad98c4378ab` da `main`.
Branch isolada: `integration/diario-editor-2316-2307-2321-20261115`.

## Histórico e escopo

| Origem | Head integrado | Merge local |
| --- | --- | --- |
| #2316 | `e2c30b5d7d1f4cca01f122caf751dacf06f03f50` | `f9307fd9` |
| #2307 | `53893883b5cb291fc6fd9ca114157bb0fea55942` | `5508f903` |
| #2321 | `28e0e2abd63e3c32a3cea8ef54d395aa08d0be6d` | `db1a85ba` |

Os três heads são ancestrais da integração; a ancestralidade compartilhada da
#2321 com a #2307 não foi reaplicada por cherry-pick. Conflitos somente nos finais
de `docs/refatoracao-comunidade.md` e `docs/memory/CURRENT_STATUS.md`: mantidas as
seções de Capas privadas, contrato do Diário e ponte RPC.

O editor integrado é idêntico ao head da #2321. A migration e seu pgTAP são
idênticos ao head da #2316. Não houve correção adicional da aplicação ou SQL.
Além dos merges, foram adicionados este registro, atualização de contexto e
`qa/tests/editor-diario-integration.spec.mjs`.

## Ambiente e gate

Node 22.23.4, Next 16.4.5, Supabase CLI 2.116.0 e PostgreSQL 17 local.
Reutilizados dependências e o único stack descartável `pr2293-prod-state`,
API loopback 65421 / PostgreSQL 65422, com o baseline local das 88 versões
anteriores. O SQL da #2316 foi carregado somente nesse descartável, sem mudança
de histórico remoto. Fixtures novas e sessões Auth reais; cookies SSR no browser.
Sem reset, exclusão de containers, volumes, contas existentes ou dados anteriores.

O gate `historietas_privado.diario_edicao_config.habilitado` permaneceu `false`
fora da transação pgTAP. Casos SQL positivos habilitam-no somente na transação
revertida. O harness de concorrência que faz COMMIT com gate ligado não foi
executado. Nenhuma aplicação/ativação remota foi feita.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| Unitários `qa/unit/editar-capitulo-*.test.mjs`, concorrência 1 | 244/244, zero falhas/skips |
| pgTAP `diario_edicao_evento_seguro.test.sql` | 52/52, rollback e gate falso confirmados |
| Build integrado `next build --webpack` | aprovado, incluindo TypeScript |
| `tsc --noEmit` | aprovado |
| ESLint do editor e novo spec, zero warnings | aprovado |
| Data API/Auth real: CAS, isolamento, anon, DML direto e gate | aprovado, 3,4 s |
| Playwright CAS concorrente desktop/mobile | aprovado, 5,8 s / 3,1 s |
| Playwright save publicado/gate fechado desktop/mobile | aprovado, 5,1 s / 5,1 s |
| `git diff --check` | aprovado |

SQL cobre sessão revogada, autoria/termos, RLS, bloqueios e preferências,
despublicação/classificação, grants, token não forjável, idempotência, tombstones
e atomicidade. Data API real confirma que anon/segunda conta não leem o draft,
segunda conta não o altera, CAS obsoleto não grava, INSERT direto é negado e RPC
autenticada recebe `55000` com gate fechado; anon não executa a RPC.

Browser usa a UI real nos dois tamanhos: um PATCH para clique duplo, conteúdo,
ordem e publicação preservados, intenção de Diário guardada e recuperação manual
somente por RPC, sem repetir PATCH, notificação ou INSERT legado. CAS concorrente
preserva texto remoto e buffer local. Cada invocação usou `--workers=1 --retries=0`;
timeouts originais de 45 s / expect 12 s, sem alterações.

Ocorrências de preparo/harness, sem ocultar falhas:

- Primeiro pgTAP não encontrou a tabela porque o comando de carga apontou um
  caminho relativo ausente. Corrigido o caminho absoluto, SQL carregado e 52/52
  aprovados. Não foi necessário alterar a migration.
- Primeira rodada browser: três passes; dois saves reprovaram exclusivamente na
  expectativa do novo harness de HTTP 400. Gate fechado retorna HTTP **500** com
  SQLSTATE **55000**. Corrigida a asserção para conferir ambos e corrigido o nome
  observado do endpoint de notificação. Executados novamente somente esses dois
  casos, ambos aprovados. Não houve retry automático, aumento de timeout ou
  repetição dos três cenários aprovados.
- Host de 8 GB apresentou memória livre na faixa de poucos MiB e boot local
  lento. Stack pausado durante build; antes dos testes, Auth respondeu HTTP 200
  e PostgreSQL confirmou gate falso e zero recibos. Não classificar HTTP 500
  `55000` como indisponibilidade ambiental: é a rejeição intencional do contrato.

Relatórios brutos permanecem locais em `qa/reports/` (incluindo a primeira
execução); não são anexados nem enviados. Diagnóstico do novo spec registra
somente fases fixas e contagens, nunca credenciais/cookies ou respostas completas.

## Parecer e limites

**APTO para revisão da integração em PR draft com gate desligado.** Não é
autorização de merge, deploy, migration remota ou ativação do Diário. Suite ampla,
concorrência com gate persistente ligado e checks remotos não fazem parte desta
homologação local focada. A implantação da migration mais antiga que o último
timestamp remoto exige preflight e autorização separados; não executar push de
migrations indiscriminadamente.
