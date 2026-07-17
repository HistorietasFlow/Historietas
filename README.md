# HISTORIETAS

Plataforma web para descobrir, ler e publicar histórias, contos, webnovels, fanfics, mangás, HQs e conteúdos similares.

O projeto utiliza visual dark premium, navegação responsiva, publicação de obras e capítulos, comunidade, notificações, perfis, painel do autor e integração com Supabase.

## Stack

- Next.js com App Router
- React
- TypeScript
- Supabase
- CSS inline com `CSSProperties`
- `localStorage` como cache e fallback por usuário

## Requisitos

- Node.js instalado
- npm instalado
- Projeto Supabase configurado
- Variáveis de ambiente locais configuradas

## Instalação

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra no navegador:

```txt
http://localhost:3000
```

## Scripts principais

### Desenvolvimento

```bash
npm run dev
```

### Verificação TypeScript

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Build de produção

```bash
npm run build
```

### Executar o build localmente

```bash
npm run start
```

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto.

O projeto espera a URL do Supabase e uma chave pública:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Algumas configurações podem usar a chave pública com o nome antigo:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Nunca envie arquivos como `.env`, `.env.local` ou `.env.production` para o repositório. Eles podem conter dados sensíveis.

## Supabase

O projeto usa Supabase para:

- autenticação;
- perfis;
- obras e capítulos;
- comentários e comunidade;
- notificações;
- diário de atividades;
- storage de capas, arquivos e avatares;
- políticas RLS;
- RPCs e triggers.

Antes de testar ou publicar em produção, confirme que todas as migrations da pasta `supabase/migrations` foram aplicadas no projeto Supabase correto.

## Buckets necessários

Confirme se estes buckets existem no Supabase Storage:

```txt
capas-obras
arquivos-obras
avatars
```

As policies devem permitir apenas as operações necessárias e impedir acesso indevido aos arquivos de outros usuários.

## Segurança

Antes de divulgar o projeto publicamente, valide:

- RLS ativado nas tabelas sensíveis;
- usuário comum não consegue alterar dados de outro usuário;
- usuário comum não consegue se tornar admin ou moderador;
- notificações só podem ser lidas e alteradas pelo destinatário;
- ações administrativas são protegidas no banco, não apenas na interface;
- uploads possuem limite de tamanho e validação de tipo;
- rotas protegidas validam a sessão no servidor;
- RPCs não confiam em IDs ou textos sensíveis enviados pelo cliente.

## Fluxos principais para testar

Antes de publicar uma nova versão, teste manualmente:

- cadastro, confirmação de e-mail, login e logout;
- publicação e edição de obra;
- criação e edição de capítulo;
- página pública da obra;
- leitura de capítulo;
- comentários, curtidas e itens salvos;
- seguir obras, autores e usuários;
- envio e leitura de notificações;
- painel e perfil do autor;
- comunidade;
- uploads de capa, arquivo e avatar;
- permissões de usuário comum;
- permissões de admin e moderador;
- navegação mobile;
- modo visual Original e Foco.

## Verificação antes do deploy

Execute:

```bash
npm run typecheck
npm run lint
npm run build
```

Corrija qualquer erro antes de publicar.

## Deploy

O projeto pode ser publicado em plataformas compatíveis com Next.js, como a Vercel.

No painel da plataforma, configure as mesmas variáveis usadas no `.env.local`.

Depois do deploy, valide:

- autenticação em produção;
- conexão com Supabase;
- uploads;
- publicação e leitura de obras;
- notificações;
- páginas protegidas;
- permissões e RLS;
- navegação em desktop e mobile.

## Arquivos que não devem ser enviados

Não envie ao repositório:

```txt
node_modules
.next
out
dist
build
coverage
.env
.env.local
.env.production
*.tsbuildinfo
*.zip
```

Esses arquivos são dependências, cache, build, cobertura, arquivos locais ou dados sensíveis.

## Prioridades do projeto

Antes de adicionar novas funcionalidades, priorize:

- build limpo;
- TypeScript sem erros;
- lint controlado;
- segurança no Supabase;
- RLS testado;
- UX mobile;
- acessibilidade;
- performance;
- fluxos principais funcionando.