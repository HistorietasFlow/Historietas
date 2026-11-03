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
