# Ranking Geral — interface e acesso ao deploy protegido

## Estado atual (17/11/2026)

Interface/SQL integrados pela #2355, main `758e3fd`, duas migrations aplicadas após
autorização e CI da main aprovada. A ativação chegou a READY/API 200, mas a seção
falhou no navegador protegido. Recuperação concluída: deployment anterior e flag
production false, domínio principal com endpoint 404/desativado. Não considerar
o recurso ativado. Ver [estado e evidências](memory/CURRENT_STATUS.md).

Correção dedicada: o fetch do navegador para a rota relativa usa `same-origin`
para levar o cookie de acesso do gateway Vercel. A rota continua ignorando
cookies/JWT recebidos e usando exclusivamente cliente Supabase anônimo; enviar
cookie ao próprio Next não personaliza a classificação. Playwright inclui cookie
HttpOnly sintético/gateway simulado e mantém o ensaio real de sessão ignorada.

## Origem da preparação

Base: main `77beb0e4`. Branch independente `feat/ranking-geral-interface-etapa3`.
Dependência não incorporada: #2348, SQL `20261116230000_listar_ranking_geral.sql`
no commit `5aac2c3ceb6bf5795b27606113285d21119251c1`.

## Contratos

- Todos os rankings anteriores permanecem intactos. A seção nova é aditiva.
- `NEXT_PUBLIC_RANKING_GERAL_PREVIEW` ausente/desligado oculta a seção e faz o
  endpoint retornar 404 antes de consultar. Definir true em produção exige autorização própria.
  É gate de implantação, não autorização de usuário. A ativação exige aprovação
  própria, disponibilidade da RPC e resolução da ressalva de desempenho.
- Somente o loader server-only chama a RPC, com `criarSupabasePublicClient`,
  cliente novo, anônimo e fetch no-store. Cookies/JWT recebidos não são encaminhados.
- Página fixa de 20; cursor UUID + assinatura, sem offset, limite arbitrário,
  usuário-alvo ou ordenação local. Nota exibida é `nota_media`, nunca `pontuacao`.
- Metadados mínimos (`id,slug,titulo`) consultados sob RLS anônima, publicados,
  classificação permitida. Obra ausente entre consultas invalida toda a página.
- Sem cache persistente, polling ou retry automático. Próxima página substitui
  a anterior. Cursor obsoleto limpa a página e exige reinício explícito.
- Revogação é observada em novas consultas; não promete remoção instantânea de
  bytes já entregues nem snapshot transacional entre RPC e metadados.
- Falha da RPC/migration ausente vira 503 sanitizado, nunca fallback ao ranking
  antigo, amostra local ou avaliações particulares. Títulos são texto React.
- Renderização usa estilos/tokens existentes, lista ordenada semântica, controles
  nativos, status/alert, cancelamento no unmount e foco no título após paginação.

## Validação e limitações

Testes unitários: `node --test --test-concurrency=1 qa/unit/ranking-geral-interface.test.mjs`.
Integrados ao `posttest:static`, sem remover gates anteriores. Cobrem parser,
loader, no-store, whitelist de metadados, revogação, falhas sanitizadas, gate,
contagens 1–4/5+, meia estrela, posição, texto literal e estados acessíveis.
Usam mocks de transporte; **não comprovam RLS nem sessão real**.

Playwright preparado em configuração separada, desktop/mobile, 1 worker e zero
retries. Um cenário consulta endpoint real; outro controla apenas a resposta da
nova seção para exercitar estados/teclado. O smoke real aceita catálogo vazio e
não substitui testes de privacidade da #2348 nem fixture populada.

Para homologar, em máquina com recursos suficientes:

1. Usar o workflow integrado em `.github/workflows/ranking-geral-interface-integrada-qa.yml`,
   com Supabase **descartável**, exclusivamente loopback, e as duas migrations do
   mesmo checkout. Não copiar SQL de outra branch nem usar projeto vinculado.
2. Executar os testes de contrato Data API/pgTAP nesse descartável,
   com as fixtures públicas sintéticas de mais
   de 20 obras, votos 1–4/5+, privadas, 18+ e revogações.
3. Construir o app com URLs/chaves descartáveis e
   `NEXT_PUBLIC_RANKING_GERAL_PREVIEW=true` apenas no ambiente de teste.
4. `node qa/scripts/run-playwright-local.mjs --config=playwright.ranking-geral.config.mjs --workers=1 --retries=0`.
5. Conferir navegação real por duas páginas, revogação de avaliação/obra entre
   páginas, anonimato mesmo com sessão autenticada, regressões dos rankings
   existentes, axe, screenshots e fidelidade visual desktop/mobile.

## Histórico da preparação original da #2352

No notebook: Docker Engine indisponível (pipe dockerDesktopLinuxEngine ausente),
RAM livre 1.958.744 KiB de 8.016.284 KiB. Não iniciado Docker nem aplicado SQL.
Supabase real, Build, Playwright, axe e comparação visual **pendentes**.
Não declarar esta etapa homologada ou apta a publicação por testes unitários.

Primeiro Typecheck encontrou resolução cruzada de SDKs Supabase nas dependências
ancestrais root/qa. Reutilização explícita de node_modules da raiz foi preparada
por junction local ignorada, sem instalar ou modificar dependências.
Primeira rodada unitária: 9/10; mock CommonJS de Link incorreto, corrigido;
rodada seguinte 10/10. Nenhuma asserção enfraquecida.

Typecheck final aprovado após corrigir a resolução local de dependências; Lint
focado sem erros. A regressão estrutural desktop contava oito ocorrências de
`isDesktop` e detectou os dois usos novos (prop e valor). Atualizada para exigir
exatamente um mount novo protegido pelo gate e preservar os oito usos legados.

## Ajuste visual da #2352

Cards com posição destacada, borda discreta, tokens escuros existentes, títulos
sem truncamento e badge de amostra pequena. Botões secundário/primário de 48 px,
foco visível, quebra em coluna no mobile e reserva inferior de 104 px + safe area.
CSS limitado à seção nova; sem mudanças no gate, RPC, cálculo ou rankings antigos.

Ensaio reproduzível: `node qa/scripts/ranking-geral-visual.mjs`. Chromium serial,
sem retries, rede bloqueada, fonte TSX real renderizada com estados sintéticos.
Validados 1440/390/320 px: nenhum overflow, botão Voltar ao início inteiramente
acima da barra, hit testing da área útil, alvo de 48 px, Tab/foco visível,
axe sem violações. Capturas completas e da paginação em
`qa/reports/ranking-geral-visual/`; imagens revisadas visualmente.

Limites: navegação inferior simulada com CSS de posicionamento extraído do layout;
cabecalho de ensaio próprio, sem hidratação, roteamento ou chamadas ao banco.
Não representa captura da página integrada nem prova de clique React/privacidade.
O primeiro hit test atingia cantos transparentes da borda arredondada; corrigido
para pontos úteis e adicionado teste da caixa inteira acima da navegação.
O primeiro axe detectou ausência de h1 no documento isolado; incluído título
identificando o ensaio, sem alterar o cabeçalho existente do produto.
Supabase/Build/Playwright integrado permanecem pendentes e gate desligado.
