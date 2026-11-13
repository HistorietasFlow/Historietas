# Entrega privada de capas — base HTTP desativada

Data: 13/11/2026. Base: `98be8c31` (`main`, #2286).
Branch existente: `feat/private-cover-authorized-delivery`.

Esta fase implementa a base HTTP solicitada após a investigação
[`TRANSICAO_18_COM_CAPA.md`](TRANSICAO_18_COM_CAPA.md). **Não implementa a
transição 18+, não migra capas e não habilita entrega de bytes em produção.**
A PR 1 transacional foi informada como em desenvolvimento; nenhum contrato dela
foi presumido ou chamado. Não há novo schema, RPC, bucket ou grant nesta fase.

## Composição de produção e dependência pendente

`app/api/capas-obras/[[...obraId]]/route.ts` mantém `disponivel: () => false`.
Não há env que abra esse gate. O adaptador `autorizar` também lança erro de
indisponibilidade: mudar apenas o gate não basta para entregar bytes.
GET, HEAD, POST, PUT, PATCH, DELETE e OPTIONS retornam 503 antes de invocar as
dependências da entrega. O catch-all opcional controla também a raiz e caminhos
incompletos/inválidos da namespace. Métodos desconhecidos são recusados pelo
Next; as regras de headers da namespace se aplicam também a essa resposta.

`FonteCapaAutorizada` é uma **interface interna de composição e teste**, não um
contrato SQL nem atestado de que a infraestrutura já existe. O futuro adaptador
deve vincular a fonte imutável à obra e à sessão exata da requisição e conferir
novamente essa autorização no primário após a leitura. Não há campos de banco,
assinatura RPC, identificadores de Storage ou nomes de bucket inventados.

Antes de conectar o adaptador e mudar o gate, validar o contrato real da PR 1:

- Sessão ativa, propriedade/visibilidade, classificação e publicação atuais;
  usuário validado por Auth sozinho não comprova existência de `auth.sessions`.
- Identidade/geração da obra, troca/ABA de capa e exclusão/recriação, vinculando
  a decisão final aos mesmos bytes privados lidos. Não usar o token editorial.
- Imutabilidade, integridade/formato dos bytes, fonte privada sem URL pública,
  assinatura reutilizável ou redirecionamento, e ausência de caminho alternativo
  que permita contornar autorização ou reintroduzir dados pelo cache.
- Leituras no primário e sem cache, falha fechada e tratamento documentado de
  respostas em trânsito. A última conferência é um ponto de autorização; não
  cerca escritores físicos nem revoga bytes/respostas já entregues.
- Provas reais de pgTAP/Data API/Storage/concorrência e homologação da entrega
  gerenciada; aprovação desta base HTTP não substitui essas provas.

## Fluxo da camada HTTP, exercitado com dependências controladas

1. Exigir gate explicitamente verdadeiro e GET/HEAD; aceitar somente UUID na
   rota, sem query de URL/caminho/credencial. Recusar Range, origem externa e
   `Sec-Fetch-Site: cross-site`.
2. Autenticar, autorizar a obra e abrir uma fonte interna vinculada à requisição.
   Recusa/autoria/ausência não abre fonte. Não compartilhar decisões entre
   requisições ou usuários e não oferecer fallback público.
3. Ler com `cache: no-store`, `redirect: error`, AbortSignal e prazo global de
   dez segundos. Buffer isolado de até 2 MiB/4.096 partes; nenhum streaming de
   bytes para o cliente antes da conferência final. HEAD percorre as mesmas
   verificações, incluindo leitura, mas devolve corpo vazio.
4. Autenticar de novo e exigir revalidação explícita da mesma fonte/autorização;
   erro, mudança de usuário, negação, aborto ou fechamento do gate descarta o
   buffer. Não repetir IO, rebasear versão ou fazer cleanup.
5. Construir resposta própria. Permitir MIME PNG/JPEG/WebP/GIF do futuro leitor
   confiável; recusar SVG/HTML e resposta upstream diferente de 200. O buffer/MIME
   não são um decoder nem comprovam integridade: isso pertence ao adaptador
   pendente, não a headers ou hashes enviados pelo navegador.

O helper de autenticação usa os cookies SSR da requisição e `auth.getUser()`
com chave pública e fetch `no-store`/sem redirects. Não usa `getSession()` como
prova, claims de metadata editável ou service role. Credencial ausente/rejeitada
nega acesso; indisponibilidade de Auth não vira visitante autorizado. Nesta base
não há consumidor de UI, bearer auth para a imagem nem decisão de acesso
anônimo: o núcleo exige identidade antes de autorizar.

## Política de cache e otimização

Todas as respostas do núcleo, inclusive erros e HEAD, usam:

- `Cache-Control: private, no-store, max-age=0, must-revalidate`;
- `CDN-Cache-Control`, `Vercel-CDN-Cache-Control` e `Surrogate-Control: no-store`;
- `Pragma: no-cache`, `Expires: 0`, `Vary: Cookie, Authorization`;
- `Cross-Origin-Resource-Policy: same-origin`, `nosniff`, `Accept-Ranges: none`.

Não copiar ETag, Last-Modified, Set-Cookie, Location, cache ou metadados da fonte.
Não retornar 304 por condicionais do navegador. O Route Handler declara
`force-dynamic`, `revalidate: 0`, `fetchCache: force-no-store`; regras de headers
da namespace no `next.config.ts` cobrem recusas geradas pelo framework.

A versão instalada, Next **16.4.5**, acrescenta permissões de assets compilados
a `images.localPatterns` durante o build. Portanto, só configurar essa lista
não basta para rejeitar toda fonte dinâmica/codificada antes do cache:

- Lista explícita de quatro ícones públicos conhecidos em `localPatterns`.
- Matcher específico de `/_next/image` e recusa no início do Proxy: fontes
  locais precisam ser um desses ícones ou nome simples de imagem sob os
  namespaces estáticos compilados. Não aceitar encoding, query, fragmento,
  subdiretório, recursão ou barra invertida nesses caminhos. Erro/HEAD dessa
  recusa tem `no-store`, sem corpo no HEAD e sem ETag.
- URLs absolutas seguem o validador `remotePatterns` existente, limitado ao
  Supabase configurado e ao bucket **público legado**. A API privada não está
  nessa permissão. O validador do Next executa antes da busca de seu cache.
- Os avatares/anexos existentes já são `unoptimized`; a capa hero só otimiza
  URLs públicas reconhecidas. Não há uso atual de import estático de imagem
  alterado. A UI e os consumidores existentes não foram conectados à API nova.

Fontes locais dinâmicas futuras precisam manter entrega direta sem o otimizador.
O Service Worker existente já limita seu cache aos quatro ícones estáticos;
não foi modificado. Nenhum desses controles revoga capas públicas antigas,
caches já entregues ou resolve a migração do legado.

## Evidências e limites desta fase

Node **22.23.5**, dependências preexistentes, lockfiles preservados. Next build
e next start em loopback, com URL Supabase `http://127.0.0.1:9`, chave pública
inerte e service role vazia; nenhum banco/projeto remoto usado.

- **14/14** unidades novas em `npm run test:private-covers`, incorporadas ao
  `pretest:static` existente, sem retirar qualquer teste/gate anterior.
- **31/31** regressões relacionadas: capas/hero, recusa 18+, UPDATE editorial,
  listagem Storage, redirect seguro e barreira pública. As três de redirect
  foram reexecutadas após a mudança do Proxy; não contar como casos novos.
- **4/4 Playwright HTTP**, workers=1/retries=0, contra o build final: três
  cenários novos em `private-cover-http.spec.mjs` e a regressão existente de
  redirect protegido em `security-headers.spec.mjs`. Usam somente a fixture
  `request`; nenhum navegador instalado ou iniciado. Guard de loopback impede
  que os testes novos sejam executados contra produção.
- Lint focado, Typecheck, Build, auditoria estática **199/199** e diff check.

Diagnósticos, sem retries para esconder falhas: a primeira rodada HTTP foi 2/3
porque a raiz da API caía no 404 estático com ETag. A seguinte foi 1/3: a nova
expectativa de método desconhecido era 405, mas o Next retorna 400 com `no-store`;
e o namespace estático adicionado pelo Next deixava uma fonte codificada chegar
ao fetch interno (404, sem bytes privados), em vez de rejeitá-la na validação.
O catch-all e a recusa no Proxy corrigem os dois caminhos; a expectativa do
método foi corrigida com inspeção HTTP, mantendo a exigência de `no-store`.
Nenhum timeout, retry, gate ou asserção de proteção foi relaxado.

Uma inicialização local encontrou EADDRINUSE em servidor desta própria tarefa;
o servidor antigo foi encerrado e a rodada final usou a porta 3198.

**Pendentes:** autenticação/sessão reais integradas à PR 1, pgTAP, Data API e
Storage reais, autorização de bytes privados em ambiente gerenciado e testes
de cache/CDN/navegador desse fluxo conectado. Sem adaptador transacional nem
Supabase local preparado, não há como atestar essas garantias nesta base.
Não foram iniciados Supabase/Docker, serviços externos ou uploads ilustrados.
Sem migration, backfill, mudança de buckets, remoção de arquivos, produção,
merge ou ativação. Testes controlados não são homologação das dependências.
