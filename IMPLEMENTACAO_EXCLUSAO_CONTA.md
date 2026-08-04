# Implementação da exclusão de conta

## O que foi adicionado

- `Configurações → Zona de risco → Excluir minha conta`.
- Confirmação obrigatória com senha atual.
- Confirmação digitada (`EXCLUIR`, `DELETE` ou `ELIMINAR`, conforme o idioma).
- Route Handler seguro para excluir o usuário pelo Supabase Admin.
- Remoção dos arquivos do usuário nos buckets `avatars`, `capas-obras` e `arquivos-obras`.
- Página pública `/excluir-conta` para usuários que não conseguem entrar.
- Fila privada `solicitacoes_exclusao_conta` para solicitações públicas.
- Atualização da Política de Privacidade e do sitemap.

## Configuração obrigatória

### 1. Aplicar a migration

No Supabase, execute a migration:

```text
supabase/migrations/20260804000100_exclusao_conta.sql
```

Você pode aplicar com o Supabase CLI ou copiar o conteúdo para o SQL Editor do projeto.

### 2. Adicionar a variável na Vercel

Adicione somente no servidor:

```env
SUPABASE_SERVICE_ROLE_KEY=cole_a_chave_service_role_aqui
```

Não use o prefixo `NEXT_PUBLIC_`. A chave administrativa nunca pode aparecer no navegador, no GitHub ou em capturas de tela públicas.

Depois de salvar a variável, faça um novo deploy.

## Teste recomendado

Use uma conta criada apenas para teste:

1. Publique uma obra e envie uma capa/arquivo.
2. Faça um comentário, uma avaliação e siga outro usuário.
3. Abra Configurações → Zona de risco.
4. Digite a senha e a confirmação solicitada.
5. Confirme que o login deixou de funcionar.
6. Verifique no Supabase se o usuário, perfil, conteúdo relacionado e arquivos foram removidos.
7. Abra `/excluir-conta` sem estar conectado e envie uma solicitação de teste.
8. Confirme que ela apareceu em `public.solicitacoes_exclusao_conta`.

## Comandos locais

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
```

Todos devem terminar sem erros antes do deploy.

## Observação sobre solicitações públicas

A página pública registra o pedido, mas não apaga automaticamente uma conta apenas com o e-mail informado. Isso evita que outra pessoa solicite a exclusão de uma conta alheia. O pedido deve ter a identidade verificada antes do processamento manual.
