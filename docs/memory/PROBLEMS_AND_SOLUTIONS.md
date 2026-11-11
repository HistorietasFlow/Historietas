# Problemas conhecidos e soluções

## CI #2267: DNS do mirror Azure antes do Playwright

As tentativas 1 e 2 de `43034526557` falharam no APT com
`Temporary failure resolving 'azure.archive.ubuntu.com'` e codigo 100,
antes de executar Playwright. Faltavam nove pacotes de fontes/X fonts; as
bibliotecas do Chromium ja estavam instaladas, mas remover `--with-deps`
omitiria dependencias e poderia mudar a renderizacao dos testes.

Remover somente Azure da lista de mirrors oficiais tambem falhou: a execucao
`43043680245` comprovou DNS indisponivel para `archive.ubuntu.com`. Essa
tentativa foi retirada, sem manter alteracoes de APT ou de DNS do runner.

Solucao: [Playwright Server em Docker](https://playwright.dev/docs/docker#remote-connection),
com Chromium/fontes/bibliotecas ja incluidos na imagem oficial MCR Noble
1.62.1, correspondente ao lockfile e fixada por digest SHA-256. Apenas o
navegador usa o container; Node 22, app, fixtures, CLI/Docker e Supabase continuam
no host. Compartilhar rede permite manter localhost e URLs dos testes; servidor
ouve somente 127.0.0.1:3001. O container nao recebe secrets, socket Docker ou
repositorio: somente node_modules QA read-only. Usuario pwuser, cap-drop=ALL e
no-new-privileges, sem --privileged. Cleanup sempre remove somente seu container.

Smoke obrigatorio antes do banco comprova launch, texto pt-BR, screenshot e
transferencia de video remoto; testes usam a variavel publica documentada
PW_TEST_CONNECT_WS_ENDPOINT. Configuracao dos testes, assercoes, retries,
timeouts e scans permanecem iguais. A espera limitada e somente por startup,
nao repete teste ou falha de navegador. Drift de versao/digest falha fechado.
Lighthouse continua no Chrome preinstalado do host, sem mudar seu contrato.

Validacao local: sete testes do contrato/startup e 67 regressoes de instalador/
monitor/Sentry aprovados. Smoke real cliente/servidor no Windows aprovado,
incluindo screenshot e video, com Chromium 151.0.7922.34; servidor encerrado.
Docker Engine indisponivel nesta sessao Windows;
a instalacao Linux e o E2E completo devem ser comprovados na CI do commit novo,
sem reutilizar checks anteriores. Evidencias finais ficam na propria PR #2267.
Ainda depende da disponibilidade do MCR; falha de download bloqueia, nao ha
fallback para navegador arbitrario nem omissao de dependencias/gates.

## Storage: disputa de quota entre reserva e upload legado

Na execução CI `42620166032` da #2245, o cenário de duas reservas passou,
mas uma reserva e um upload legado concorrentes ocuparam a última vaga juntos.
A reprodução local sem retries confirmou o mesmo resultado; antes deste ajuste
de cleanup, teste e migrations envolvidos eram idênticos à `main` `62bbb0b3`.

No Storage API v1.65.1 efetivamente instalado, `canUpload` usa `testPermission`
em uma transação desfeita por rollback. O advisory lock de quota é liberado
antes da transferência; `completeUpload` grava os metadados via `asSuperUser`.
Logo, compartilhar o lock na admissão não garante a quota até o commit final
do upload legado. É uma corrida real preexistente, não regressão da Obra nem
prova de contaminação prévia da fixture. Não extrapolar a versão local à produção.

Na versão que falhou, a primeira asserção interrompia o cleanup do cenário,
deixando 30 objetos e uma reserva; disso decorriam a contagem 31 no teste de
expiração e os erros `54000` posteriores. O cenário agora registra sua reserva
antes da asserção e usa `t.after` com `finally` para remover os objetos mesmo
se a liberação falhar. A asserção da última vaga permanece intacta.
O teardown geral removeu as fixtures locais ao terminar a reprodução original.
pgTAP direcionado (174 assertions) e recibos privados passaram, mas não provam
a atomicidade entre admissão HTTP e gravação física.

A execução local após o ajuste de cleanup passou 18/18, sem retries. Como o
ajuste não altera a ordem de admissão/commit, esse passe não comprova correção
da corrida; não tratar um resultado favorável isolado como garantia de quota.
Uma injeção de falha na asserção, somente em memória, comprovou o teardown:
expiração, isolamento de sessão, ledger/quotas e pré-validação passaram depois
da falha intencional, sem alterar o teste versionado nem aplicar retries.

Não afrouxar quotas, RLS, locks ou a asserção para aprovar a CI. A correção da
garantia de quota no fluxo legado exige avaliação dedicada do backend/ponto de
commit; não improvisar escrita em `storage.objects` ou upgrade de Storage.
Uploads ilustrados e sua publicação/limpeza continuam suspensos. A garantia
exigida pelo teste permanece uma pendência, independentemente de passes ocasionais.

## Vercel: Deployment was blocked

### Sintoma

Deploys novos aparecem como `Blocked`.

### Causa encontrada em 2026-11-03

O projeto estava pausado após atingir a configuração de Spend Management.

### Solução aplicada

1. Ajustar conscientemente Spend Management.
2. Retomar o projeto com `Resume Project` no Project Overview.
3. Fazer novo redeploy.
4. Usar Deployment Protection, não project pause, quando a intenção for esconder o site do público durante desenvolvimento.

## Vercel: esconder o site sem bloquear deploy

Usar:

- Deployment Protection
- Vercel Authentication
- All Deployments

Não pausar o projeto apenas para deixá-lo privado.

## Speed Insights gerando erro em E2E local

### Sintoma

Playwright registrava 404 de endpoint da Vercel em ambiente local e falhava por console error.

### Solução

Renderizar `<SpeedInsights />` somente quando `process.env.VERCEL === "1"`.

## ESLint react-hooks sem plugin registrado

### Sintoma

Lighthouse PR revelou falha de lint porque regras `react-hooks/*` eram usadas sem plugin registrado no bloco correspondente.

### Solução

Adicionar `eslint-plugin-react-hooks` explicitamente e registrar o plugin na configuração ESLint.

## Windows e CRLF

Testes estruturais que transformam módulos TypeScript por texto falhavam no
Windows quando o checkout convertia LF para CRLF. A substituição deixava imports
relativos no módulo `data:`, e o Node respondia `ERR_UNSUPPORTED_RESOLVE_REQUEST`.

Essas suítes carregam `qa/scripts/test-source-newlines.mjs`, que normaliza apenas
retornos textuais de `readFileSync`; leituras em `Buffer` permanecem intactas.
Listas muito longas usam `run-node-test-script.mjs` com `shell: false`, evitando
o limite de linha do `cmd.exe` sem reduzir a cobertura.

O Supabase CLI instalado via npm é um wrapper `.cmd`, que não pode ser aberto
diretamente por `execFileSync` no Node 22 para Windows. O preparo local usa uma
invocação fixa por `cmd.exe` somente nessa plataforma; Linux continua executando
`supabase` diretamente. As fixtures geradas ficam em arquivo ignorado e são
carregadas por último, evitando credenciais/IDs obsoletos em Playwright.

Não assumir regressão funcional apenas por esse sintoma. Comparar com GitHub Actions e investigar o diff real antes de alterar código.

## Leitor: troca de conta sem desmontar a página

### Sintoma

Ao trocar de A para B com o leitor aberto, respostas assíncronas e estado de
progresso/interações carregados para A podiam continuar em memória e alimentar
ações executadas já na sessão de B.

### Padrão aplicado

- manter a identidade autenticada com uma versão monotônica;
- invalidar `getUser`, loaders e ações quando usuário ou versão divergirem;
- associar o estado aplicado à identidade que concluiu o carregamento;
- remover imediatamente dados privados e interações da conta anterior,
  preservando apenas o conteúdo público enquanto a nova carga termina;
- confirmar o usuário esperado novamente na fronteira de persistência.

Esse padrão deve ser preservado em novos fluxos assíncronos do leitor. As
preferências visuais de leitura continuam em um lifecycle separado.

### Preferências visuais durante troca de conta

O lifecycle de preferências mantém a identidade/versionamento autenticado como
fonte de validade, mas registra separadamente qual identidade teve suas
preferências efetivamente aplicadas. Ao trocar de conta, as preferências deixam
de ser consideradas carregadas antes da nova leitura, timers antigos são
invalidados e a persistência só é permitida quando identidade autenticada,
identidade aplicada e usuário de destino coincidem. No logout, apenas os
valores padrão do visitante são aplicados e nenhuma chave privada é escrita.

Não remover essa associação explícita: usar apenas um booleano de
“preferências carregadas” permite que um render intermediário grave valores da
conta anterior na chave da conta nova.

### Erro temporário não é conteúdo inexistente

O carregamento inicial do leitor diferencia ausência confirmada da obra ou do
capítulo de falhas temporárias de Auth, rede, Data API ou paginação. Consultas
com erro devem propagar a falha ao lifecycle; retornar `null` ou uma lista vazia
fica reservado a respostas válidas sem conteúdo.

O retry usa uma versão monotônica própria, além da versão da identidade. Assim,
uma resposta anterior não pode sobrescrever uma tentativa mais recente nem uma
troca de conta. Em falhas, conteúdo público/local já disponível é preservado,
mas a identidade só é marcada como aplicada depois de uma carga completa, para
que ações privadas não persistam dados de uma carga incompleta.

### Back/Forward entre capítulos

A navegação interna do leitor continua usando `history.pushState`, mas cada
entrada preserva o estado do Next e registra explicitamente os IDs da obra e do
capítulo. A entrada inicial também é identificada com `replaceState`, e o estado
de rota do leitor escuta `popstate` para restaurar esses IDs.

Não derive a identidade de uma rota canônica a partir de query params durante
Back/Forward: os dados iniciais canônicos continuam tendo prioridade absoluta.

A navegação externa por `pushState` envia somente a identidade do leitor. O
patch do Next copia os campos internos necessários; repassar `__NA` manualmente
faz o router tratar a chamada como interna e ignorar a nova URL. Um commit
posterior do Next pode então restaurar a URL anterior e apagar a identidade da
entrada, deixando URL e conteúdo divergentes. A comparação repetida reproduziu
esse problema tanto com React 19.2.4 quanto com 19.3.1.

Antes de sair de uma entrada, a ação de troca confirma sua identidade com
`replaceState` quando necessário. Isso cobre commits iniciais do Next que podem
ter removido a marcação feita pelo effect de montagem; sem essa confirmação,
Voltar chega à URL anterior sem os IDs necessários ao listener de `popstate`.

Os IDs canônicos já inicializados no estado da rota não são reaplicados pelo
timer do carregamento inicial: isso poderia desfazer uma seleção de capítulo
feita antes da conclusão da carga. O leitor interno por query mantém sua
inicialização adiada e os guards de identidade/cancelamento existentes.

### E2E de rolagem após navegação do leitor

Confirmar conteúdo/`aria-busy` não confirma o fim do scroll suave iniciado por
`trocarCapitulo`. Na #2234, o teste posicionava `window` em 600 px durante essa
animação: o trace registrou 600 → 454 px, apesar de o documento ter altura
suficiente. A animação também podia alterar a posição salva antes do retry.
O teste agora aguarda o topo da navegação, verifica o alcance de 600 px e só
então provoca a falha/retry, exigindo restauração exata e nenhum reload. O
arquivo exercita scroll suave nativo explicitamente, inclusive no Windows.
Não aumentar timeouts, remover a animação de produção ou trocar o contêiner
de scroll para contornar essa corrida de sincronização do teste.


## OWASP ZAP: `Potential XSS` em `/login?redirectTo=/publicar`

### Sintoma

O baseline passivo do ZAP marcou `User Controllable HTML Element Attribute (Potential XSS)` para o parâmetro `redirectTo`, apontando um `a[href]` com valor `/publicar`.

### Investigação

O relatório do ZAP mostrou a rota `/login?redirectTo=%2Fpublicar` e associou o valor `/publicar` a um atributo `href`.

A revisão do código mostrou que o `href="/publicar"` vem do link fixo da navegação inferior em `app/layout.tsx`; ele não é construído com o parâmetro `redirectTo`.

A proteção do login passa por `obterRedirectToSeguro`, e a cobertura foi reforçada em duas camadas:

- teste unitário para esquemas perigosos, URLs externas e caracteres que poderiam quebrar atributos HTML;
- teste Playwright no DOM real para confirmar que `redirectTo` não cria `href` executável, URL externa ou handler HTML.

### Conclusão

Falso positivo por coincidência de valor entre `redirectTo=/publicar` e o link estático `/publicar`.

Não alterar a lógica funcional do app para “corrigir” esse alerta. Manter os testes de regressão unitário e E2E.

## Diálogos interativos devem compartilhar o contrato completo de foco

Sheets que se comportam como modal precisam expor `role="dialog"`, `aria-modal="true"` e nome acessível, além de foco inicial previsível, contenção de Tab/Shift+Tab, fechamento por Escape e restauração do foco ao acionador. O leitor reutiliza os helpers de foco já adotados pela página pública de obra; gestos, body lock e regras funcionais permanecem em seus lifecycles próprios.

## Eventos Auth sem mudança de identidade não recarregam a Comunidade

O lifecycle da Comunidade compara o identificador efetivo do usuário antes de
resetar a conta e recarregar o feed. O evento `INITIAL_SESSION` estabelece a
identidade inicial; `SIGNED_OUT` para um visitante que já está anônimo e
`SIGNED_IN`/`TOKEN_REFRESHED` para a mesma conta não iniciam outra carga.

Somente transições reais (visitante para conta, conta para logout ou troca entre
contas) invalidam a versão atual e recarregam. Eventos recebidos antes da
resolução de `getUser()` ficam pendentes, e timers antigos verificam novamente a
identidade antes de aplicar resultados. Não voltar a decidir a recarga apenas
pelo nome do evento Auth: em sessão ausente, o Supabase pode emitir
`SIGNED_OUT(null)` sem que tenha ocorrido uma troca real de identidade.

## Aceite dos termos com conta Auth sem profile

### Sintoma

`aceitar_termos_publicacao` respondia HTTP 500/SQLSTATE `P0002` quando uma conta
confirmada existia em `auth.users`, mas a sincronização cliente não havia criado
`public.profiles`.

### Solução

O núcleo privado `SECURITY DEFINER` preserva autenticação e versões, atualiza
perfis existentes e, somente na ausência, insere atomicamente um perfil mínimo
com `id = user_id = auth.uid()`, tipo `leitor` e nome sanitizado. `ON CONFLICT DO
NOTHING` seguido de reconciliação torna chamadas concorrentes e retries
idempotentes. O wrapper público, grants e RLS permanecem restritos, e metadata
editável serve apenas como texto de exibição.

## Gate de publicação: erro temporário não é aceite ausente

A leitura de `status_aceite_termos_publicacao` diferencia uma resposta válida
`false` de uma falha de transporte/Data API. Antes de decidir o gate, uma falha
recebe uma única nova tentativa; sucesso ou `false` legítimo nunca geram uma
segunda consulta. Isso evita enviar um autor com aceite atualizado para a tela
de termos por uma indisponibilidade transitória, sem relaxar a RPC, RLS, grants
ou as versões legais exigidas pelo banco.

## Explorar: filtros compartilháveis sincronizados com a URL

Os filtros públicos `tipo`, `categoria`, `busca`, `ordenacao` e `formato` são lidos na
abertura e restaurados em `popstate`, mantendo URL, controles e consulta do
catálogo alinhados em recarga, links compartilhados e Voltar/Avançar. Mudanças
discretas criam uma entrada de histórico; a digitação da busca substitui a
entrada atual para não gerar histórico excessivo.

Filtros pessoais de coleção e a confirmação local de conteúdo adulto não devem
ser serializados na URL. Parâmetros desconhecidos ou inválidos usam os valores
padrão, e links antigos contendo somente `tipo` e `categoria` permanecem
compatíveis.

## Explorar: resultados full-text não devem ser refiltrados por substring

Quando `listar_obras_catalogo` responde uma busca, os IDs retornados pela RPC
são a fonte autoritativa para a correspondência textual. Reaplicar no cliente
um `includes` sobre título, autor e metadados descarta correspondências válidas
do PostgreSQL, como stemming em português e variações singular/plural.

O cliente ainda aplica os filtros explícitos de publicação, conteúdo,
classificação, formato, categoria e coleção. A comparação local por substring
fica restrita ao fallback em que a consulta remota não produz uma página de
catálogo. Resultado remoto vazio (`[]`) é diferente de fallback (`null`), e a
paginação acumula somente IDs da consulta ativa para preservar os guards contra
respostas antigas.

## Obra: snapshot inicial de métricas não pode desfazer interação posterior

O carregamento de métricas da página pública pode permanecer em voo enquanto o
usuário segue, curte, favorita ou conclui a obra. A resposta foi iniciada antes
da ação e, portanto, não pode voltar a aplicar os campos de interação daquele
snapshot sobre o estado otimista e o cache local mais novos.

As interações mantêm versões independentes. O lifecycle ainda aproveita da
resposta remota as métricas que não foram alteradas, mas preserva estado,
contadores e storage dos campos cuja versão avançou durante a requisição. Os
guards de identidade e o cancelamento por cleanup continuam sendo a autoridade
para login, logout, troca de conta e navegação entre obras.

## Explorar: falha temporária não é catálogo vazio

O loader do catálogo pode preservar obras do cache local ou de uma amostra
pública quando a RPC paginada fica temporariamente indisponível. Esse fallback
deve carregar um sinal explícito de falha: uma lista vazia obtida com sucesso e
uma lista vazia causada por erro de infraestrutura são estados diferentes.

Enquanto houver falha, a interface identifica os dados preservados como
fallback, não exibe o estado vazio normal e oferece retry da consulta atual sem
recarregar a página. Falhas ao carregar mais preservam resultados e cursor já
visíveis e repetem somente a paginação. A versão da consulta continua sendo a
autoridade para impedir que respostas antigas sobrescrevam um retry mais novo.

## Explorar: coleções pessoais não podem depender da amostra inicial

Os filtros `Lendo agora`, `Na lista`, `Concluídas` e `Sem leitura` precisam usar
os identificadores completos da identidade autenticada. Aplicar esses filtros
somente sobre `obrasLocais` oculta obras que estão fora da primeira página do
catálogo.

O lifecycle das coleções combina o cache isolado por usuário com os registros
remotos paginados e invalida respostas antigas em login, logout e troca de
conta. A consulta do catálogo continua sendo a fronteira de visibilidade: ela
percorre somente páginas de IDs com os filtros públicos atuais até reunir a
página pessoal solicitada, sem baixar o catálogo inteiro e sem expor IDs
privados na URL. Falhas preservam o cache disponível, exibem indisponibilidade e
permitem retry somente das coleções da identidade atual.

## Explorar: autores não podem depender do nome ou da página inicial da obra

### Sintoma

A busca podia omitir um autor após a alteração do nome público, porque a RPC
consultava somente o nome histórico salvo na obra. Além disso, a aba Autores
derivava perfis apenas da amostra inicial de obras.

### Solução

`listar_obras_catalogo` preserva seu contrato e passa a comparar a busca com o
nome atual exposto por `profiles_publicos`. No modo Autores, o cliente ativa a
paginação por cursor já existente e acumula as páginas solicitadas, mantendo a
deduplicação por `autorId`. Assim, novos autores ficam alcançáveis sem carregar
todo o catálogo e perfis bloqueados ou privados continuam sujeitos à view
pública, RLS e filtros vigentes.

## Progresso de leitura deve convergir entre dispositivos

### Sintoma

O leitor persistia `lido=true` com `upsert` e `lido=false` com `delete`
incondicionais. Uma resposta atrasada de outro dispositivo podia, portanto,
apagar uma leitura mais nova ou ressuscitar uma marcação depois de o usuário a
ter removido.

### Solução

A ação gera um único timestamp no momento da interação e o envia à RPC
`salvar_progresso_leitura`. A função, executada como `security invoker`, aplica
o evento somente quando ele não é anterior ao estado armazenado. Desmarcações
ficam como registros `lido=false` (tombstones), invisíveis para os consumidores
de progresso, mas capazes de rejeitar marcações antigas que cheguem depois.

Não voltar a usar `delete` ou `upsert` incondicional nesse fluxo. RLS continua
isolando a identidade autenticada; Home, Biblioteca e Leitor consideram apenas
registros `lido=true`, e retries idempotentes mantêm o estado mais recente.

## Histórico persistido sem acesso no painel de moderação

### Sintoma

O banco registrava criação, mudanças de status, arquivamento, restauração e
exclusão de denúncias em `moderacao_historico`, incluindo responsável e
observação interna, mas o painel mostrava somente o estado final da denúncia.
Decisões anteriores e denúncias já removidas do painel não eram auditáveis pela
equipe na interface.

### Solução

O painel administrativo carrega o log apenas quando solicitado, em páginas de
tamanho limitado, e resolve o nome público do moderador sem transferir a
responsabilidade do controle de acesso para o cliente. RLS e grants continuam
exigindo papel administrativo; a interface comum não recebe o histórico.

Preservar a consulta sob demanda e paginada. Não duplicar o log em estado local
persistente nem ampliar `SELECT`, `INSERT`, `UPDATE` ou `DELETE` para usuários
comuns.

## E2E: revisão pública da seed e raiz final do leitor

Na CI da #2233, a seed de paginação executada após as migrations mantinha
`session_replication_role = replica` ao inserir obras/capítulos. Isso impedia os
triggers da revisão pública: obras legíveis por `anon` não tinham ledger e eram
corretamente excluídas da projeção/sitemap. A seed restaura `origin` antes dessas
inserções; não preencher revisões manualmente nem afrouxar RLS ou a barreira.
A regressão Data API percorre o manifesto e seus capítulos além de 1.000 obras.
No smoke do leitor, usar a raiz identificada do leitor e validar título/texto,
não um `main` genérico que também pode encontrar o loading transitório.

## E2E: foco adiado e fixtures de progresso compartilhadas

Na CI da #2226, `selectOption()` seguido imediatamente de Escape podia anteceder
o foco inicial adiado do painel do Explorar. Os testes devem confirmar o foco
real no diálogo e seu fechamento antes de interagir com os resultados atrás dele.
Não resolver interceptação de clique com `force`, timeout maior ou retry.

Testes que alteram/apagam progresso não podem compartilhar a mesma identidade,
obra e capítulo entre workers. A suíte de spoilers usa um leitor exclusivo,
criado e removido somente no Supabase local, e aguarda a resposta de confirmação
do navegador; consultar o banco por outro cliente não sincroniza o lifecycle da UI.

O baseline axe da Comunidade deve aguardar os controles do feed no `main` final: o shell
de loading também é um `main`, e o rótulo da bottom nav pode estar oculto no
desktop. Não usar esse rótulo nem o título exclusivo do desktop como prontidão.
O estado vazio legítimo também é um feed carregado, não um skeleton.

Os downloads oficiais de k6 e Gitleaks tiveram HTTP 504/503, conexão interrompida
e timeout antes de executar as ferramentas. O instalador compartilhado usa
arquivos oficiais com versão, tamanho e SHA-256 fixos, cache separado por
ferramenta e checksum revalidado em todo cache hit. No cache miss, tenta a API de
assets do GitHub e, apenas em falha de transporte/HTTP, a URL oficial da release,
com orçamento limitado por tentativa. Integridade inválida continua bloqueante.
O cache contém somente arquivos verificados, nunca credenciais ou binários
extraídos. Instalar k6 antes da suíte evita gastar toda a execução quando o
download está indisponível. Scans/baselines continuam obrigatórios; falha na
instalação nunca significa aprovação de k6, ZAP ou Gitleaks.
