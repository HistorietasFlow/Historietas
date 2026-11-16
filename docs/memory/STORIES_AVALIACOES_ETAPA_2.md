# Stories de avaliações — etapa 2, geração de PNG

Somente backend/geração: sem endpoint público, botão, download/compartilhamento
ou UI da etapa 3. Entrada server-only: gerarStoryAvaliacao({slug,leitorId}). Não
aceita DTO, URL ou nota do navegador. Obtém tudo pelo loader seguro da etapa 1
e o chama novamente APÓS gerar para revalidar Auth, privacidade e dados atuais.
Mudança/falha descarta os bytes. Resultado gerado contém PNG, 1080×1920,
contentType image/png, cacheControl private/no-store e flags de fotos ausentes.
Consumidor futuro deve manter esses headers e não persistir resultados privados.

## Composição autorizada

- Modelo fornecido em qa/references/Historietas_Modelo_Stories_Aprovado.png:
  942×1670, normalizado por escala UNIFORME 1080/942 e margem vertical simétrica
  de aproximadamente 2,68 px; não esticar imagens para corrigir diferença de razão.
- Coordenadas medidas ficam no renderer story-avaliacao-layout.tsx. Fundo
  preto, capa central, fotos, título, autoria, estrelas, duas linhas cinzas,
  handle/separador e wordmark mantêm a composição aprovada.
- Geist está explicitamente autorizado para dados dinâmicos. Usa a Geist
  regular já empacotada no Next 16.4.5, sem dependência, download de fontes ou
  alteração da tipografia do site. O título conserva caixa alta e hierarquia.
- Wordmark copiado byte a byte do PNG extraído/autorizado. Não usa o ícone PWA
  no lugar da marca completa. Asset raster 331×72, escalado proporcionalmente
  para aproximadamente 379×83; não alegar que se tornou um logo vetorial.
- Rótulos fixos “Minha avaliação”, “Por” e “&” são pixels do próprio modelo,
  extraídos pelo script prepare-story-static-assets.mjs. Não redesenhados nem
  compostos com uma fonte inventada. Não modificar as referências originais.
- Nota individual define cinco estrelas; meia estrela mostra a metade esquerda
  branca e a outra metade cinza, sem arredondamento ou número extra no design.
- Handle ausente oculta tanto @ quanto & sem mover o wordmark/linhas.
- Nomes/títulos longos reduzem fonte dentro de caixas fixas e quebram por
  palavras, sem reordenar a composição. Texto já truncado na etapa 1 ou sem
  encaixe é recusado, nunca silenciosamente cortado de novo.
- Glifos fora da faixa latina/pontuação suportada são recusados nesta versão,
  evitando fallback remoto automático de fontes/emoji com conteúdo de nomes.

## Mídia e segurança

Somente URLs da origem Supabase configurada e buckets públicos conhecidos,
revalidadas pelo util da etapa 1. Fetch sem cookies/Authorization, no-store,
redirects proibidos, prazo máximo de 5 s por arquivo, corpo limitado a 5 MiB,
decoder Sharp existente limitado a 20 MP e um frame. Aceita apenas PNG/JPEG/
WebP reais; rejeita SVG, HTML, erros de rede e imagem inválida. Cancela corpo
rejeitado. Não assina URLs ou lê Storage privado.

Capa usa contain e margens pretas quando necessário; nunca esticada. Foto usa
cover proporcional, com recorte central, sem deformação. Fotos ausentes/erro
mantêm moldura vazia e flag; não inventar rosto/avatar. Sem capa válida, recusar
a exportação com motivo capa_indisponivel, sem alterar design com placeholder.
Nenhuma fixture visual ou rosto do modelo é fallback de produção.

## Validação e limites

Comandos dedicados test:story:image e test:story:image:integration; exemplos
em qa/reports/story-stage2 (ignorados pelo Git). A comparação visual usa recortes
do modelo SOMENTE como fixture. A integração cria perfis, avaliação, obra e
uploads públicos novos LOCAIS e executa os clientes SSR/público, Auth, RLS,
fetch de mídia, decoder e ImageResponse reais. Fixtures anteriores preservadas.
Não há dados inventados no caminho de produção: todos passam pelo loader.

Essa etapa não publica nem exporta conteúdo sem sessão proprietária. Não é uma
garantia de revogação de uma imagem já devolvida. Testes/build e parecer final
devem ser consultados no relatório local; nenhum merge/deploy/produção aqui.
