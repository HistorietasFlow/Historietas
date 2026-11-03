# Contexto do projeto

## Produto

Historietas é uma aplicação web de publicação e leitura de obras, capítulos e conteúdo de comunidade.

O projeto possui fluxos públicos e autenticados, incluindo áreas de leitura, descoberta, publicação, perfil de autor, comunidade, listas, notificações e administração.

## Stack principal

- Next.js 16
- React 19
- TypeScript
- Supabase
- Vercel
- Sentry
- Playwright
- Lighthouse CI
- GitHub Actions
- CodeQL
- Dependabot

## Princípios permanentes

- Preservar comportamento, visual, URLs, autenticação, storage, Supabase, RLS e regras de negócio durante refatorações.
- Fazer alterações pequenas e revisáveis.
- Não confiar apenas no resultado de um agente: revisar diff, CI, testes e estado da PR.
- Não mesclar PR sem autorização explícita do usuário.
- Testes destrutivos e integrações devem usar Supabase local descartável, nunca o projeto remoto.

## Estado de acesso público

Em 2026-11-03, o projeto Vercel foi retomado após ter sido pausado por Spend Management.

Depois disso, o projeto foi configurado com Vercel Authentication em **All Deployments**, para que inclusive os domínios de produção exijam autenticação Vercel enquanto o produto ainda está em desenvolvimento.

Antes de abrir o produto ao público, revisar essa proteção e trocar conscientemente para a configuração pública desejada.
