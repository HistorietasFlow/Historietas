# Compartilhamento de avaliações nos Stories — etapa 1

Somente dados/segurança; sem UI, exportação de imagem, endpoint, ativação ou SQL.
Fonte preparada: `lib/server/stories/carregar-story-avaliacao.ts`, para futura
ação na página da obra. Não reutilizar o resolver visual de perfil: ele admite
fallback para metadata/e-mail do próprio usuário, inadequado para exportação.

## Contrato e segurança

- Identidade do solicitante validada no servidor por getUser do cliente SSR
  existente, usando cookies da requisição. ID recebido deve coincidir com o
  usuário confirmado pelo Auth; ausência, erro ou outra conta negam sem payload.
  A consulta da avaliação usa o ID confirmado, não apenas o parâmetro recebido.
  getUser é reconfirmado antes do retorno; não confiar em getSession/metadata.
- Dados exportáveis continuam no cliente público anônimo separado, sem cookies,
  sessão ou service role. Autenticação não amplia sua visibilidade.
- Projeção pública existente exige publicação e mantém bloqueio 18+/RLS.
- Avaliação individual em `obra_avaliacoes`, por obra/leitor e
  `visibilidade=publico`. RLS continua verificando preferências/biblioteca.
  A leitura privada do dono ou parcial do seguidor não autoriza story público.
- Perfis exclusivamente `profiles_publicos`: user_id para resolver vínculo,
  nome, avatar_url e username. O DTO não serializa IDs, bio, metadata ou e-mail.
- `username` do autor é selecionado explicitamente e chega ao payload.
  Ausente/inválido: username/handle null, mostrarHandle/mostrarSeparador false;
  UI futura deve ocultar também o símbolo “&”. Nunca gerar @ a partir do nome.
- Nota válida de 0,5 a 5 em passos de 0,5, sem arredondamento ou média substituta.
- Texto limitado por grafemas: nomes/crédito 80, título 120, com flag truncado.
  Tratar como texto, nunca HTML. Elipse é indicação de corte, não dado inventado.
- Mídia aceita somente URLs sem assinatura/credenciais/query/fragmento, da mesma
  origem Supabase, nos buckets públicos conhecidos avatars/capas-obras. URLs
  externas ou desconhecidas ficam null com flag de ausência; não baixar nem
  assinar mídia privada. Suporte futuro a outra origem exige contrato público.
- Campo ausente permanece null, sem placeholder. Nome/título ausente mantém
  compartilhavel=false e estado dados_incompletos; mídia e @ são opcionais.
- Leituras no-store; revalidar avaliação e revisão pública antes de retornar.
  Falha/alteração fecha sem payload e sem mensagens livres de backend.

Não é snapshot transacional único entre tabelas: cada consulta é real e atual,
com reconferência. Mudança após a resposta e imagem já exportada não podem ser
revogadas por este loader. Futuro consumidor deve solicitar dados ao gerar o
story e não persistir payload como prova permanente de autorização.

## Assets e escopo

Correção da investigação inicial: existe símbolo da identidade visual em
`public/icon-512.png` (H branco com dobra), referenciado por `app/manifest.ts`.
Origem Git: `891868c9`, “atualizar ícones da identidade visual (#1526)”.
Há variantes icon-192, maskable-icon-512, apple-touch-icon e favicon; elas não
são um arquivo de wordmark horizontal. A marca textual da Home é composta em
`components/HomeHeader.tsx` (H + istorietas, desktop/mobile), com estilos em
`app/lib/home-shell-header-styles.ts` e overrides em `app/lib/home-page-css.ts`.
As imagens OG/Twitter têm composição própria em app/opengraph-image.tsx e
app/twitter-image.tsx. Não presumir que sejam equivalentes ao design aprovado
para Stories. Nenhum asset foi criado, redesenhado, substituído ou integrado.

Testes dedicados: `npm run test:story:data` e
`npm run test:story:integration` (somente Supabase local; fixtures novas retidas).
Resultados e bloqueios da execução devem ser consultados no relatório local,
não inferidos da existência dos testes ou deste documento.

## Conclusão focada — identidade e auditoria

A primeira versão validava publicidade, mas não a identidade do solicitante.
Essa lacuna foi reproduzida por testes negativos e corrigida com Auth SSR,
mantendo todas as restrições públicas. Testes específicos: 18 unitários e
oito cenários de integração com Auth/cookies SSR/RLS locais reais aprovados.

A falha 198/199 era “ajuste de ACL do baseline fica restrito ao ambiente de
testes”, em qa/scripts/static-audit.mjs. O contrato exige ausência do helper
local dentro de supabase/migrations. Um arquivo NÃO versionado nesse caminho,
presente antes da etapa, causa a falha. Main limpa remota 9a79b0c1 passa no
mesmo contrato; seus hashes de contrato/helper são iguais aos do checkout
atual. Simular somente a presença desse caminho faz a main falhar. Portanto,
é contaminação local preexistente, não falha da main nem regressão dos Stories.
O arquivo foi preservado e o teste não foi enfraquecido. Não repetir suítes
amplas para esse diagnóstico. Evidências detalhadas ficam no relatório local.

## Forma do payload (contrato, não dados fictícios)

```ts
{
  versao: 1,
  compartilhavel: boolean,
  leitor: { nome: TextoStory, foto: string | null },
  obra: { titulo: TextoStory, autor: TextoStory, capa: string | null, href: string },
  autor: {
    nome: TextoStory, foto: string | null, username: string | null,
    handle: string | null, mostrarHandle: boolean, mostrarSeparador: boolean
  },
  avaliacao: { nota: number, escala: 5, estrelasInteiras: number, meiaEstrela: boolean },
  ausencias: {
    titulo: boolean, nomeLeitor: boolean, fotoLeitor: boolean, nomeAutor: boolean,
    fotoAutor: boolean, usernameAutor: boolean, creditoObra: boolean, capa: boolean
  }
}
// TextoStory = { texto: string | null; truncado: boolean }
```

Resultado do loader: disponivel ou dados_incompletos com esse payload;
indisponivel retorna somente motivo predefinido e payload null. O consumidor
não deve habilitar compartilhamento quando compartilhavel=false.
