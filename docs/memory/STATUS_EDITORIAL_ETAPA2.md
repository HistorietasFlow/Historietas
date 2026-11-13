# Status editorial — Etapa 2, aplicação

Base: `8e25279c` (#2283), após #2282. Implementação para revisão em draft,
sem migration nova ou aplicação remota. Esta etapa não certifica produção.

## Integração entregue

- `/publicar`: escolha opcional, neutra inicialmente, encaminhada pelo controller
  ao INSERT existente. Sem UPDATE editorial posterior, token no payload ou retry
  novo. Publicação, importação e prévia usam seus fluxos anteriores.
- `/editar-obra`: consulta existente passa a retornar ID, dono, status e versão
  juntos. Confirmação transitória separada do formulário/cache, com geração de
  carga, identidade e rota. NULL explícito não equivale a campo ausente/inválido.
  Logout, outra conta/obra, A→B→A e desmontagem invalidam respostas anteriores.
  O loading anterior é reutilizado no Suspense necessário ao useSearchParams.
- `escreverMetadadosObra` é usado pelo salvamento real e pela integração local.
  Mudança editorial deliberada protege todo o UPDATE por ID, dono e versão:
  igualdade UUID ou IS NULL legado. Outros metadados sem mudança editorial
  omitem o status. A versão nunca é enviada como coluna a escrever.
- Sucesso exige uma única linha válida, sem erro, retornando status e versão
  reais. SQLSTATE de rejeição, zero linhas, transporte/retorno incerto e contexto
  obsoleto são resultados distintos. Zero linhas não identifica sozinho a causa.
  Controles ficam desabilitados durante envio; ref impede duplo submit.
- Falha não reenvia PATCH nem troca o token automaticamente. O autor solicita
  consulta, vê estado atual separado da intenção e decide se mantém a escolha
  ou usa o estado atual antes de salvar novamente. Outros campos permanecem.
  Leitura posterior não vira recibo causal nem mensagem de sucesso da tentativa.
- Página de Obra: usa `statusEditorial` do snapshot versionado existente, somente
  quando a confirmação pública está válida. NULL mostra “Não informado”; ausência
  não inventa esse rótulo. Sem token público, consulta dedicada ou cache paralelo.
- Explorar/Obras: select, `statusEditorial` na URL e sexto indicador removível.
  Valor explícito usa todos os 15 argumentos; neutro mantém variantes 10–14.
  IDs precisam da confirmação da consulta/identidade atual. Preserva cursor,
  debounce, retry, coleções pessoais, filtros combinados e descarte de respostas
  antigas. Autores neutraliza o status e não oferece o controle/indicador.
  PT/EN/ES, teclado e foco reutilizam o painel e os indicadores anteriores.

## Arquivos e limitação explícita de 18+

O catch antigo de `editar-obra-remote-update.ts` removia uploads novos inclusive
após commit com resposta perdida. Agora nenhum resultado não confirmado autoriza
essa compensação. Remoção de arquivos antigos, persistência, Diário e sucesso
só ocorrem depois de uma linha válida confirmada. A compensação da preparação
continua limitada à fase anterior a qualquer UPDATE da obra.

**Impedimento de atomicidade:** a preparação antiga também apagava a capa pública
antes do UPDATE ao selecionar 18+. Com CAS, um conflito deixaria a obra anterior
apontando para arquivo destruído. Mover a exclusão para depois e aceitar falha
permitiria confirmar 18+ com a capa ainda pública. Não há transação compartilhada
entre Storage e Data API, nem contrato de recuperação durável autorizado aqui.

Por isso, alteração com classificação 18+ e capa remota existente **falha fechada
antes de upload, DELETE ou UPDATE**. Preserva formulário, objeto e obra; mensagem
explica a recusa em PT/EN/ES. Obras sem capa continuam no contrato permitido.
Não ampliar permissões, apagar antes do CAS, remover o objeto para contornar
o conflito ou apresentar a transição como resolvida. É uma limitação funcional
explícita da entrega, a avaliar antes de aprovar merge/deploy; retomada desse
caso exige contrato separado de remoção/recuperação, fora desta etapa.

Uploads de tentativas não confirmadas podem ficar retidos consumindo a quota
existente. Não há limpeza automática, recibo novo, prova de ausência por timeout
ou reenvio automático. Bytes/URLs públicas já entregues não são revogáveis pelo
formulário. Uploads ilustrados continuam integralmente suspensos.

## Evidências locais

Somente descartável `editorial-status-application`, API 61421/DB 61422,
Node 22.23.4, CLI 2.116.0, PostgreSQL 17, Auth/Data API/Storage. Configuração,
helper ACL e credenciais E2E ignoradas não fazem parte do commit.

- pgTAP completo: **36 arquivos / 1.039 assertions**, sem omissões.
- Data API/Storage com código real da aplicação: **7/7**, incluindo duas sessões
  HTTP sob barreira de lock, exclusão/recriação, ABA, NULL legado, autoria/termos,
  rollback, metadados sem perda do status concorrente e PATCH real cuja resposta
  é descartada após commit. Arquivos novos/antigos continuam com bytes íntegros.
  Também comprova recusa 18+ com capa sem alterar obra ou remover objeto.
- Regressões da versão #2283: **11/11**, executadas serialmente com a nova
  bateria (**18/18** combinados). Sem retries artificiais.
- Unitários focados: **156/156**, com normalizador de fontes Windows existente.
  Incluem payload/CAS/cardinalidade, identidade/rota/reconciliação, URL/RPC,
  preservação de variantes, confirmação de IDs e regressões pertinentes.
- Playwright: **14/14** no primeiro conjunto corrigido (10 editoriais e quatro
  regressões dos indicadores), desktop/mobile, build de produção, um worker e
  retries=0. Inclui duas sessões de navegador, falha de rede/retry, resposta
  antiga, PATCH real seguido de perda da resposta com Storage real, página
  seguinte, Back/Forward/reload, chip por teclado, traduções, overflow e axe.
  A rodada final no build atualizado passou **4/4**: dois casos adicionais de
  recusa 18+ e dois casos de criação/edição ampliados com NULL confirmado na
  página pública. São **16 cenários distintos** aprovados entre as duas rodadas;
  os dois casos de criação foram executados novamente pela ampliação pertinente.
- Lint focado, Typecheck, Build e auditoria estática direta 199/199 aprovados.
  O auxiliar ACL foi temporariamente movido e restaurado para a auditoria:
  o guard continua proibindo seu versionamento. Sem alteração de gates.

As primeiras execuções encontraram fixtures/assertions novas incorretas
(valor undefined substituído pelo default do helper, legado sem autor válido,
contagem dos dois links de cada card, seletor alcançando cópia SSR oculta e
`Response.ok` tratado como método). Corrigidas com inspeção, sem relaxar regras,
timeouts ou retries. Cópias ativas duplicadas não são aceitas como prontas.

Ampliação diagnóstica de unitários antigos encontrou 12 falhas também na base
#2283, com app/lib/qa idênticos a `origin/main` e mesmo normalizador Windows:
`editar-obra-save-auth-identity`, `explorar-catalog-error-notice`, `explorar-categories`,
`explorar-category-titles`, `explorar-creative-work-sections`,
`explorar-filtered-works-section`, `explorar-genre-work-sections`,
`explorar-list-route-utils` (três casos), `explorar-theme` e
`publicar-page-decoration-style`. Não integram os gates atuais pre/static/session;
não foram corrigidas nem ocultadas nesta etapa. Não declarar todos os unitários
históricos do repositório aprovados. Expectativas efetivamente afetadas pelo
novo contrato foram atualizadas preservando as garantias e a cobertura executável.

O wrapper npm está bloqueado pelo NVM4306 nesta sessão. Não foi alterada confiança,
versão ou configuração do NVM: usaram-se os executáveis Node dos comandos do
projeto e uma instalação anterior reproduzível com lockfile SHA-256 idêntico,
copiada para o worktree isolado. Suíte completa permanece para a CI obrigatória.

## Consultas e implantação

| Fluxo | Antes → depois |
| --- | --- |
| Criação | Mesmo INSERT e fluxo existente de publicação; zero UPDATE editorial extra |
| Carregamento da edição | Uma consulta da obra → uma, com duas colunas adicionais |
| Salvamento | SELECT de propriedade + UPDATE existentes; zero rebase/consulta extra |
| Reconciliação solicitada | Uma leitura da obra + verificação de usuário; nenhum PATCH |
| Obra pública | Mesmo snapshot/barreira; zero consulta exclusiva de status |
| Explorar | Seis seleções iniciais preservadas; uma RPC por consulta/página personalizada |
| Renderização/chip | Zero chamadas; remoção executa uma consulta normal, como o painel |

Evidência de contagem por operação/inspeção e E2E, não benchmark/SLA de latência.
Nenhum ranking, limite, cursor, RLS, grant, schema, workflow ou dependência mudou.

**Pré-requisito administrativo de merge/deploy, em ordem:** comprovar aplicação
de `20261113002736_adicionar_status_editorial_obras.sql` e
`20261113013249_proteger_versao_status_editorial.sql` antes desta aplicação.
Este chat não aplicou nem comprovou migrations em produção. Merge e CI verde
não substituem essa confirmação. Sem fallback que ignore versão. Recuperação
preserva status, tokens, trigger e assinaturas; não fazer rollback destrutivo.

Não houve produção, deploy manual, merge, Cron, runner, abertura pública ou
ativação ilustrada. Arquivos e volumes anteriores foram preservados; os onze
containers antigos foram restaurados e o descartável parado, sem remoção de
volumes. Na conferência final, dez serviços estavam ativos (os que têm healthcheck,
saudáveis) e `supabase_vector_historietas` estava em `Restarting`; não foi alterado
nem investigado esse serviço independente nesta etapa. Checks finais: consultar uma vez
após o push, informar estado conhecido e parar, sem polling.

## Correção QA da CI da #2284

CI `43361919558`, job `131677189748`, artefato `14009656015`: 186 aprovados,
uma falha definitiva e uma recuperada no retry. Banco, integrações e preparo
passaram; Lighthouse, k6 e ZAP posteriores não executaram nessa rodada.

- `author-workflow`: as três tentativas pararam em `selects.nth(3)`, resolvido
  como `select#publicar-tag`, que não contém a opção Livre. O campo editorial
  tornou inválida a dependência posicional. QA usa os IDs existentes de formato,
  gênero e classificação e confirma seus valores; também exige status editorial
  neutro. Preserva criação, edição/exclusão do capítulo, exclusão da obra e cleanup.
  O mesmo cenário completo agora cobre desktop e mobile.
- Axe do Leitor desktop: `document-title` encontrou documento sem título naquele
  instante. O artefato contém trace somente da tentativa recuperada, não da falha
  original; portanto não permite reconstruir a causa exata daquela ocorrência.
  A RPC/barreira não foi alterada. A metadata canônica existente fornece
  `Capítulo 1 — Obra Pública E2E | Historietas`; inspeção local via MutationObserver
  no build da PR capturou título no body aos 92 ms, Leitor presente aos 93 ms e
  título movido ao head aos 428 ms. São observações de uma navegação, não SLA.
  Isso demonstra que conteúdo pronto não confirma metadata no head. QA agora
  exige o texto exato no `head > title` e no documento antes do axe, como já faz
  o teste da Obra. Título ausente, incorreto ou antigo continua falhando; axe
  permanece na página inteira, incluindo document-title. Não declarar uma execução
  verde como prova de ausência absoluta de instabilidade ou da causa da CI.

Validação econômica no descartável existente `editorial-status-application`
(API 61421), reutilizando next build/next start da aplicação no commit `88359587`:
**4/4** afetados (autor completo e axe canônico, desktop/mobile), workers=1 e
retries=0, em 29,5 s; **3/3** regressões relacionadas (termos transitórios, HTML
inicial com metadata e hidratação canônica), mesmas condições, em 5,0 s.
Lint focado dos dois arquivos e `git diff --check` aprovados. Somente QA e este
registro mudaram; não repetidos banco, Storage, Build ou cenários editoriais
já aprovados. A suíte completa continua obrigatória na CI, sem gates alterados.

Permanecem os pré-requisitos administrativos de comprovação das migrations
em produção na ordem indicada acima e o bloqueio 18+ com capa existente.
Esta correção não consulta produção nem comprova instalação remota.
