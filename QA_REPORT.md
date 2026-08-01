# Relatório de preparação dos testes — Historietas

Data da preparação: 01/08/2026

## Resultado executado neste pacote

- **24 de 24 verificações estáticas aprovadas.**
- **49 arquivos TypeScript/TSX analisados sem erro de sintaxe.**
- **29 rotas/páginas ou handlers identificados no App Router.**
- Nenhuma referência a chave `service_role` encontrada no código enviado ao navegador.
- Uploads da publicação limitados aos formatos declarados: PDF, TXT, MD, PNG, JPG, JPEG, WEBP e GIF.
- A exclusão de capítulo confirma a ação e filtra a operação por `capituloId`, `obraId` e `user_id`.
- `robots.ts`, `sitemap.ts`, Open Graph, Twitter Image e favicon estão presentes.

## Correção registrada

Foi adicionada a migração:

```text
supabase/migrations/20260801000100_progresso_leitura_capitulo_delete_cascade.sql
```

Ela registra no histórico do projeto a alteração de `progresso_leitura.capitulo_id` para `ON DELETE CASCADE`. Sem essa migração, um banco recriado a partir dos arquivos antigos poderia recuperar o erro que impedia excluir capítulos.

## Testes automatizados adicionados

A suíte contém:

- smoke test de **26 rotas**;
- verificação HTTP de páginas públicas e arquivos de SEO;
- busca da Home com resultado existente e vazio;
- categoria e filtros da página Explorar;
- verificação de rolagem horizontal no celular;
- alternância entre login, cadastro e recuperação de senha;
- proteção das áreas autenticadas;
- abertura das páginas principais com uma conta de teste;
- fluxo destrutivo opcional: publicar obra, criar capítulo, editar capítulo, excluir capítulo e excluir obra;
- captura automática de screenshot, vídeo e trace quando um teste falha.

## Limite desta análise

Os testes de navegador e as requisições ao domínio não foram executados dentro do ambiente de preparação porque ele não tinha acesso DNS ao site nem todas as dependências do projeto disponíveis. A estrutura e a sintaxe dos testes foram validadas, mas o resultado real de produção será gerado no computador do projeto ao executar:

```bash
npm run test:all
```

Os testes autenticados e destrutivos permanecem desativados até que uma conta exclusiva de testes seja configurada em `qa/.env.e2e`.
