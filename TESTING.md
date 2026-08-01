# Testes automatizados do Historietas

Este pacote evita testar cada botão manualmente. Ele combina quatro camadas:

1. **Auditoria estática**: arquivos obrigatórios, SEO, segurança básica, uploads e migração do Supabase.
2. **Smoke HTTP**: rotas públicas, `robots.txt`, `sitemap.xml`, favicon e erros 5xx.
3. **Playwright público**: Home, busca, Explorar, filtros, login, rotas e responsividade.
4. **Fluxo autenticado opcional**: publica uma obra de teste, cria e edita um capítulo, exclui o capítulo e apaga a obra.

## Rodar tudo

No terminal, na pasta principal do projeto:

```bash
npm run test:all
```

Na primeira execução, o Playwright instala o Chromium. As execuções seguintes reutilizam a instalação.

O relatório visual fica em:

```text
qa/playwright-report/index.html
```

Para abri-lo pelo comando:

```bash
npm run test:e2e:report
```

## Testar produção ou servidor local

Por padrão, os testes públicos usam:

```text
https://www.historietas.com.br
```

Para testar o projeto localmente, crie `qa/.env.e2e` a partir de `qa/.env.e2e.example` e use:

```env
E2E_BASE_URL=http://127.0.0.1:3000
```

O Playwright iniciará `npm run dev` automaticamente quando o endereço for local.

## Testes autenticados

Crie uma conta exclusiva para automação. Não use sua conta principal. No arquivo `qa/.env.e2e`:

```env
E2E_USER_EMAIL=email-da-conta-de-teste
E2E_USER_PASSWORD=senha-da-conta-de-teste
E2E_ALLOW_DESTRUCTIVE=true
```

Com `E2E_ALLOW_DESTRUCTIVE=true`, o teste cria conteúdo temporário e o remove no final. Se a opção estiver ausente ou for `false`, essa parte é pulada com segurança.

## Comandos úteis

```bash
npm run test:static
npm run test:smoke
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
npm run test:all
```

## Relatórios gerados

- `qa/reports/static-audit.json`
- `qa/reports/http-smoke.json`
- `qa/reports/playwright-results.json`
- `qa/playwright-report/index.html`
- capturas, vídeos e traces de falhas em `qa/test-results/`

## Migração incluída

A migração abaixo registra no projeto a correção feita no banco para permitir a exclusão de capítulos:

```text
supabase/migrations/20260801000100_progresso_leitura_capitulo_delete_cascade.sql
```

Ela altera a chave estrangeira de `progresso_leitura.capitulo_id` para `ON DELETE CASCADE`, evitando o conflito com a regra que exige `capitulo_id` preenchido.
