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
