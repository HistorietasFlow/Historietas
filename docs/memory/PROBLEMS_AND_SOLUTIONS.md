# Problemas conhecidos e soluções

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

Alguns testes locais podem divergir do Ubuntu da CI por diferenças de final de linha CRLF/LF.

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
