# Listas — identidade, rota e carregamento

Base: `98be8c31`. Branch: `codex/listas-identidade-carregamento-v2`.
Registro da investigação e validação local de 13/11/2026.

## Problemas reproduzidos

Os três testes iniciais de `listas-identity-concurrency.test.mjs`, executados
com o loader copiado de `98be8c31`, falharam **3/3**:

- Avaliação do Diário de A pendente, navegação para B concluída, resposta de A:
  o ramo de bloqueio antigo limpava as listas de B e ativava `bloqueado`.
- Recomendações de uma rota pendentes, catálogo de outra concluído, resposta
  antiga: `setObrasPublicas` substituía o catálogo atual pelas recomendações.
- Cleanup durante o perfil autenticado: uma consulta de catálogo era iniciada
  depois da desmontagem. As checagens não cercavam todas as fronteiras async.

O primeiro harness de reprodução tinha uma inicialização incompleta do estado
mock de avaliação; isso foi corrigido antes de repetir os três casos sobre a
base. A reprodução válida não teve rejeições não tratadas do harness.

A página também mantinha cabeçalho, contagens, estados de identidade, menus e
comentários na mesma instância ao mudar de rota. O loading só era alterado no
efeito; não mascarava todos esses dados durante renderização. Não havia
inscrição Auth que invalidasse a própria página de Listas no logout.

## Contrato da solução

`useListasSessionScope` observa mudanças reais de identidade e mantém uma
versão monotônica. Eventos de refresh sem mudança de ID não recarregam;
`INITIAL_SESSION` não substitui uma validação já iniciada ou uma mudança mais
recente. Cada carga continua validando `getUser`. Evento Auth serve para
invalidar a vista, não como autorização para carregar dados pessoais.
Ausência normal de sessão (`AuthSessionMissingError`) é visitante; falhas de
validação reais terminam em erro, sem inferir visitante ou perfil próprio.
Respostas de Auth incompatíveis com o ID observado não são aplicadas.

A chave combina a versão de identidade e os mesmos campos que já recarregavam
o loader: modo, origem, usuário-alvo, seção e gênero. O escopo anterior fica
oculto já na renderização, antes do cleanup. O conteúdo inteiro é montado com
essa chave: os hooks de identidade/perfil, dados, permissões, avaliação,
contagens e overlays pertencem àquela instância. Não é necessário alterar o
hook de estado puro `useListasIdentityProfileState`: a instância é descartada,
em vez de reaproveitar seus valores para outro contexto.

Categoria, ordenação e foco de obra não mudam a chave. Seus filtros, favoritos,
leitura e navegação local continuam com os hooks existentes. O usuário validado
é passado ao loader dessa instância, evitando duplicar o `getUser` que já era
feito em cada carga. Não há sessão global nova, cache pessoal compartilhado,
novas chaves de storage, consultas SQL/RPC adicionais ou mudança de filtros.

Os guards interrompem continuações após perfil, privacidade, permissões,
avaliação e recomendações. Cleanup antigo não termina o loading da nova carga,
nem pode bloquear/apagar/substituir os dados atuais. Consultas já emitidas
podem terminar, mas o resultado antigo não é aplicado ao novo contexto.

Falhas de transporte/Data API ou formato inválido nas coleções e na consulta
principal de obras propagam erro. `[]` continua reservado a resposta vazia
válida (e ao ID inválido que já não consultava). Não substituir uma lista por
um vazio silencioso ou por seis coleções parcialmente carregadas. Fallbacks
auxiliares de capítulos, métricas e perfis permanecem com seus contratos.
Permissões próprio/terceiros, leitura de storage apenas próprio, visibilidade
de registros, RLS e bloqueios 18+ não foram modificados.

## Evidências locais

Node **22.23.5**, dependências preexistentes dos lockfiles, sem reinstalação.

- Reprodução válida na base: **0/3 passes**; os mesmos casos passam corrigidos.
- Bateria final afetada: **33/33**, zero skips/retries. Inclui concorrência,
  Auth em voo, logout, A → B → A, resposta fora de ordem, refresh, ausência de
  sessão, falha remota, desmontagem, unsubscribe e preservação de filtros.
  A nova bateria integra o gate existente por importação do teste de reuso de
  perfil, sem modificar package.json ou workflows.
- Expansão dos unitários Listas: **153/155** na primeira execução. Uma falha era
  o formato do import de rota alterado, adaptado e validado na bateria final.
  A outra permanece: `use-listas-diary-comments-state.test.mjs:44` exige o texto
  literal `event.key === "Escape"` no lifecycle, que delega o teclado a helper.
  Reproduzida **1/2** em cópias de todos os seis arquivos da base `98be8c31`;
  o teste e os quatro hooks de comentários não foram alterados. Não remover
  nem afrouxar a asserção para aprovar esta tarefa. Limitação explícita da
  regressão ampliada, independente da #2298 e da Home.
- **Playwright 8/8**, build de produção, workers=1/retries=0. Desktop 1440×900 e
  mobile 390×844: destino privado com Auth retido, ausência de título anterior
  em frames pintados, A → B → C com perfil atrasado, logout e troca de conta sem
  navegação, Favoritas sem consultas novas, falha remota distinta de vazio e
  loading encerrado. Axe da página privada sem violações serious/critical.
- Typecheck, Build, Lint focado e diff check aprovados. Servidor de testes
  encerrado ao concluir; nenhum Docker ou Supabase real foi iniciado.

```sh
node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/listas-page-data-loader-profile-reuse.test.mjs \
  qa/unit/listas-read-orchestration-hooks.test.mjs \
  qa/unit/listas-loaders.test.mjs qa/unit/listas-route-utils.test.mjs

node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/listas-*.test.mjs qa/unit/use-listas-*.test.mjs
```

Navegador: `listas-identity-loading.spec.mjs`, com API/URL de loopback e HTTP
controlado no SDK real. Sessões, permissões e dados são fixtures, não prova de
Auth/RLS num backend real. A suíte recusa URL de teste remota. Config temporário
fora do repositório reutilizou o config Playwright, Chromium do ambiente e
FFmpeg oficial já instalado, mantendo vídeo/timeouts/retries. Build e servidor
usaram somente URL/key fictícias locais; sem credenciais de produção.

```sh
npm --prefix qa test -- --config=/workspace/work/home-playwright.config.mjs \
  listas-identity-loading.spec.mjs --workers=1 --retries=0
```

Escopo: somente `app/listas/**` e testes próprios. Por essa restrição explícita,
Memory Bank e `docs/refatoracao-comunidade.md` não foram editados; evidências
ficam neste registro e na PR. Sem alterações à Home/#2298, SQL, produção,
branches alheias, merge ou ativação. A CI completa permanece no pipeline;
consultar uma vez após abrir a PR draft, sem polling ou rerun.

## Correção da fixture após a primeira CI — 14/11/2026

A execução `43530623107` teve **7 falhas** nesta spec e **196 passes** no
Playwright; dois testes alheios recuperaram em retry. Typecheck, Lint, Build,
static/session e integrações Supabase passaram. Não alterar testes alheios
para resolver esta falha.

O trace mostrou um prefetch RSC de `/obra/fixture-1` recebendo
`Set-Cookie: sb-127-auth-token=; Max-Age=0`. O cookie sem assinatura é válido
somente para o HTTP interceptado do navegador. O proxy Next consultava o Auth
local real, rejeitava essa sessão e apagava o cookie. As validações seguintes
terminavam em erro ou visitante; em mobile, a corrida podia ocorrer antes da
primeira lista. O resultado local anterior com backend indisponível não cobria
essa rejeição, apesar dos 8/8 registrados.

A fixture agora remove apenas o cookie Auth fictício (inclusive chunks) das
requisições ao servidor da aplicação. Usa o fixture `request` isolado do
Playwright: redirects não podem restaurar o cookie do navegador, como ocorre
com `route.fetch`. Servidor/proxy e respostas reais continuam executando;
Auth/Data API do navegador continuam interceptados. Service workers ficam
bloqueados somente nesta spec para respeitar a fronteira de interceptação.
O cleanup libera respostas retidas e aguarda handlers antes de desmontar,
sem suprimir erros de rotas. Nenhuma mudança no código funcional, no Auth
compartilhado, na CI ou nos contratos de privacidade.

O cenário de privacidade em desktop/mobile também emite prefetch explícito e
verifica que o cookie continua presente antes de trocar a rota. As asserções
de privacidade, loading, dados anteriores, quantidade de consultas e Axe permanecem.
Sem timeouts maiores, retries extras, skips ou diminuição da cobertura.

Reprodução sem Docker: proxy HTTP temporário diante do build existente, em
loopback `3110 → 3100`, adicionando expiração do cookie quando uma requisição
`/obra/*` carrega a sessão fictícia. A spec original falhou **1/1** como na CI;
o cenário corrigido passou **1/1**. Bateria final **8/8**, desktop/mobile,
com o proxy de rejeição ativo, `--workers=2 --retries=0` (um worker efetivo para
esta spec serial), **33,6 s**. Lint focado e `git diff --check` aprovados.
Evidências em `/workspace/work/listas-ci-repro.log` e
`/workspace/work/listas-ci-fix-suite.log` durante esta sessão. O build existente
foi reutilizado porque somente QA/documentação foram alterados. Sem Docker,
backend real ou homologação de RLS local; CI completa continua necessária.
