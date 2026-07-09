# HISTORIETAS

Plataforma web para descobrir, ler e publicar histórias, contos, webnovels, fanfics, mangás, HQs e conteúdos similares.

O projeto usa visual dark premium, navegação mobile, publicação de obras, capítulos, comunidade, notificações, perfis, painel do autor e integração com Supabase.

## Stack

* Next.js App Router
* React
* TypeScript
* Supabase
* CSS inline com `CSSProperties`
* localStorage para cache/fallback por usuário

## Requisitos

* Node.js instalado
* npm instalado
* Projeto Supabase configurado
* Variáveis de ambiente locais configuradas

## Instalação

Instale as dependências:

```bash
npm install
```

Rode o servidor de desenvolvimento:

```bash
npm run dev
```

Abra no navegador:

```txt
http://localhost:3000
```

## Scripts principais

```bash
npm run dev
```

Roda o projeto em modo desenvolvimento.

```bash
npm run build
```

Gera o build de produção.

```bash
npm run start
```

Roda o build de produção localmente.

```bash
npm run lint
```

Executa a verificação de lint.

```bash
npm run typecheck
```

Executa a verificação TypeScript, caso o script exista no `package.json`.

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto.

As variáveis públicas esperadas pelo código são:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

ou, dependendo da configuração usada no projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Arquivos `.env`, `.env.local` e `.env.production` não devem ser enviados para o GitHub ou compartilhados, pois podem conter chaves sensíveis.

## Supabase

O projeto depende do Supabase para:

* autenticação de usuários;
* cadastro e edição de obras;
* capítulos;
* perfis;
* comentários;
* comunidade;
* notificações;
* diário de atividades;
* storage de capas e arquivos;
* políticas RLS;
* RPCs e triggers.

Antes de publicar ou testar em produção, confirme que as migrations da pasta `supabase/migrations` foram aplicadas no projeto Supabase correto.

## Buckets necessários

Confirme no Supabase Storage se os buckets abaixo existem:

```txt
capas-obras
arquivos-obras
avatars
```

Também confirme se as policies desses buckets permitem apenas as ações necessárias para usuários autenticados.

## Segurança

Antes de divulgar o projeto publicamente, valide:

* RLS ativado nas tabelas sensíveis;
* usuário comum não consegue editar dados de outro usuário;
* usuário comum não consegue virar admin/moderador;
* notificações só aparecem para o próprio usuário;
* ações administrativas são protegidas no Supabase, não apenas na interface;
* uploads têm limite de tamanho e tipo de arquivo.

## Fluxos principais para testar

Antes de publicar uma nova versão, teste manualmente:

* cadastro;
* login;
* logout;
* publicar obra;
* editar obra;
* adicionar capítulo;
* abrir página pública da obra;
* ler capítulo;
* comentar;
* curtir;
* salvar;
* seguir;
* receber notificação;
* marcar notificação como lida;
* acessar painel do autor;
* acessar perfil;
* acessar comunidade;
* testar permissões de usuário comum;
* testar permissões de admin/moderador.

## Build de produção

Antes de enviar para produção, rode:

```bash
npm run typecheck
npm run lint
npm run build
```

Se algum desses comandos falhar, corrija antes do deploy.

## Deploy

O projeto pode ser publicado em plataformas compatíveis com Next.js, como Vercel.

No painel da plataforma de deploy, configure as mesmas variáveis do `.env.local`.

Depois do deploy, teste:

* login em produção;
* conexão com Supabase;
* upload de capa;
* publicação de obra;
* leitura de obra;
* notificações;
* navegação mobile;
* páginas protegidas.

## Arquivos que não devem ser enviados

Não envie para o repositório:

```txt
node_modules
.next
.env
.env.local
.env.production
dist
build
tsconfig.tsbuildinfo
```

Esses arquivos são dependências, cache, build ou dados sensíveis.

## Observação

Este projeto está em evolução. Antes de adicionar novas funcionalidades, priorize:

* build limpo;
* TypeScript sem erro;
* UX mobile;
* segurança no Supabase;
* RLS bem testado;
* performance;
* fluxos principais funcionando.
