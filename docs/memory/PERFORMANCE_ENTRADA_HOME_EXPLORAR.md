# Entrada da Home e do Explorar — após #2263

Base: `e18c6295`. Investigação e medições locais em 10/11/2026.

## Diagnóstico e decisão

As seis chamadas iniciais de `listar_obras_catalogo` continuam presentes nas
duas páginas, mas são consultas distintas e paralelas: recentes, geral,
curtidas, comentadas, salvas e capítulos. Não são seis repetições da mesma
consulta. Removê-las alteraria a composição das seções existentes.

Depois do catálogo e das obras, os loaders aguardavam nomes públicos dos
autores antes de consultar capítulos. Essas duas leituras são independentes.
Foi testado executá-las em paralelo, sem mudar campos, filtros, paginação,
fallbacks, ordenação, métricas posteriores ou armazenamento por identidade.

Manter somente a alteração no Explorar. O protótipo da Home foi descartado:
a mediana mobile de conteúdo útil piorou de 4.842,8 para 5.559,3 ms, embora
desktop melhorasse de 963,3 para 867,2 ms. Não repetir essa alteração na Home
sem nova evidência; seus fontes permanecem sem mudanças desta otimização.

## Medições equivalentes

Cinco pares antes/depois por rota/dispositivo, alternando versões de builds
de produção locais, após aquecimento excluído da amostra. Contexto Chromium
novo por visita; mesmo banco descartável e mesmos dados durante a comparação.
Desktop: 1440×900, CPU 1×, rede 40 ms/50 Mbit/s. Mobile emulado: 390×844,
CPU 4×, rede 150 ms/10 Mbit/s. Upload 5 Mbit/s. Sem processos de build
concorrentes. Uma comparação preliminar com resolução diferente do SDK na
cópia temporária da baseline foi descartada; a comparação abaixo usou o
mesmo SDK travado e artefatos isolados fora da árvore TypeScript.

Medianas do Explorar:

| Métrica | Desktop antes → depois | Mobile antes → depois |
| --- | --- | --- |
| Conteúdo útil | 798,9 → 736,7 ms (−7,8%) | 5.074,4 → 4.907,0 ms (−3,3%) |
| Estabilização de rede/conteúdo | 1.213,0 → 1.125,7 ms | 6.078,4 → 5.788,5 ms |
| LCP observado no navegador | 856 → 784 ms | 5.176 → 5.004 ms |
| CLS | 0 → 0 | 0 → 0 |
| Obras recebidas → início das métricas | 141,1 → 82,3 ms | 455,0 → 269,2 ms |
| Transferência total | 685.690 → 684.117 bytes | 724.042 → 723.248 bytes |
| Requests totais | 57 → 56 | 56 → 55 |
| Requests Supabase | 13 → 13 | 13 → 13 |
| RPCs de catálogo | 6 → 6 | 6 → 6 |

Conteúdo útil melhorou em 4/5 pares desktop e 5/5 mobile. A sequência de links
de obras foi idêntica em todas as amostras. A variação de requests totais e
transferência inclui prefetch RSC cancelado e não representa remoção de
consultas nem redução comprovada de bundle. Nenhum erro HTTP Supabase ou
erro de página ocorreu na amostra válida; cancelamentos de prefetch apareceram
nas duas versões. Na última visita de cada versão/dispositivo, não houve
novas chamadas Supabase nos dez segundos adicionais de observação.

LCP/CLS são observações do navegador, não Lighthouse. Não foi medido TBT
Lighthouse nem produzido escore de Performance. A soma observada de long
tasks não substitui TBT. Dados de fixtures locais anônimas, não latência de
produção ou homologação de dispositivos físicos. Autenticação e coleções
pessoais são verificadas separadamente nos E2E funcionais locais.

## Garantias e testes

- Testes unitários controlam ambas as ordens de resolução de perfis/capítulos,
  impedem métricas/retorno antes de ambos e preservam nomes, capítulos e chave
  de armazenamento por usuário. Cobrem catálogo remoto vazio, falha e retry.
- E2E retém a resposta real de perfis e exige que a consulta de capítulos
  inicie antes da liberação, em desktop/mobile. Confere seis RPCs e executa axe
  sobre o conteúdo final. Não há respostas falsas nem timeouts aumentados.
- Não há mudança em RPC, RLS, schema, grants, identidade, UI, dependências,
  cache público ou controles operacionais. Runner, Cron, publicação automática
  e uploads ilustrados continuam sem ativação.

## Validação local e pendências

- Node 22.23.4, `npm ci`, audit de produção (zero vulnerabilidades), Lint,
  Typecheck e Build aprovados.
- 67/67 testes focados; paginação 37/37; sessão 2.005/2.005. Usar o normalizador
  de fontes CRLF já existente ao executar os testes que importam código via
  `data:`; a chamada direta sem ele falha no teste inalterado da Home.
- Auditoria estática: 199/199 no snapshot do índice, 485 testes anteriores
  e 60 posteriores aprovados. No workspace, 198/199 devido ao helper ACL local
  não versionado; não alterá-lo para esta otimização.
- Quatro novos Playwright aprovados, um worker e zero retries: concorrência
  e axe separadamente em desktop/mobile. As tentativas iniciais com axe e
  concorrência no mesmo teste, durante outros gates pesados, excederam 45 s;
  a instrumentação mostrou consultas, conteúdo e axe concluídos. Não se
  aumentaram timeouts nem se suprimiram asserções.
- A regressão ampliada `home-explore.spec.mjs` NÃO foi homologada: Home,
  abertura dos filtros e URL compartilhada permaneceram no loading além do
  limite existente de 12 s, interrompendo cenários posteriores. Não foi
  alterado nenhum desses testes nem atribuído isso à otimização sem comparação
  reproduzível. Coleções autenticadas, Back/Forward e retry continuam pendentes
  nessa execução E2E ampliada.
  Uma leitura diagnóstica posterior terminou em 9.445 ms: seis RPCs HTTP 200,
  perfis iniciados em 6.203 ms e capítulos em 6.210 ms, todas as respostas
  HTTP 200. Não reproduziu o limite de 12 s nem esclareceu a causa; não
  substitui as medianas A/B e não constitui aprovação desses testes.
- Integrações adicionais no banco descartável reutilizado: 2/8 passaram;
  anti-spam bloqueou o primeiro post permitido por janela de rate limit já
  presente, e paginação recebeu `57014` em consultas. Não há alteração SQL
  nesta candidata; falta homologar esses gates em banco descartável limpo.
- Não foi executada suíte Playwright completa nem declarado CI verde.

Artefatos sanitizados da medição ficam somente em `qa/reports/`; scripts
temporários e cópias de configuração são removidos após a validação. A PR
deve permanecer draft, sem recomendação de merge enquanto as pendências de
regressão não forem esclarecidas.

## Reavaliação do bloqueio local da PR #2264

O commit `afb7604e` passou na CI descartável: Tests (incluindo pgTAP,
Data API, anti-spam, Playwright, Lighthouse, k6 e ZAP), Build, Typecheck,
Lint e Gitleaks. No Playwright da CI, os cenários afetados de
`home-explore.spec.mjs` e os quatro novos de
`catalog-parallel-loading.spec.mjs` passaram sem retry. A suíte terminou com
141 aprovações e um retry em `smoke-routes.spec.mjs` (robots/sitemap), fora
do escopo de entrada da Home/Explorar.

Comparação adicional, sem alterações de código, usou builds de produção da
`main` (`e18c6295`) e da PR, as mesmas fixtures, o mesmo Supabase local e
visitas anônimas alternadas. Na ocorrência degradada, Home desktop demorou
22,4 s na `main` e 15,3 s na PR; aos 12 s havia seis RPCs de catálogo
pendentes na `main` e a RPC de métricas pendente na PR, com respostas HTTP 500
em ambas. No Explorar desktop, houve 8,2 s e 10,3 s com HTTP 200; no mobile,
ambas as versões tinham leituras pendentes no marco de 12 s e uma RPC de
catálogo HTTP 500. O PostgREST local registrou SQLSTATE `57014`
durante essas visitas, inclusive na carga do schema cache. A rota
`/rest/v1/` chegou a responder 503 e, depois de recuperar o cache, levou
3,4 s mesmo sem consulta de catálogo. Havia cerca de 400 MiB de RAM física
livre durante o build; o Typecheck da `main` levou 4,6 min sob contenção,
contra 26 s no build da PR após pausar serviços locais opcionais.

Após reduzir somente serviços locais não necessários às páginas, uma nova
comparação pontual, sem HTTP 500, mediu conteúdo final em segundos:

| Página | Desktop main → PR | Mobile main → PR |
| --- | --- | --- |
| Home | 13,1 → 12,3 | 5,8 → 4,0 |
| Explorar | 4,8 → 5,9 | 2,8 → 1,7 |

Esses pares diagnósticos não substituem as cinco medições A/B anteriores nem
estimam ganho estável: o banco/host variou entre visitas. Demonstram, porém,
que a espera superior a 12 s também ocorre na `main` e acompanha atrasos e
timeouts do Supabase local, não uma falha exclusiva do paralelismo da PR.
Os mesmos 11/12 requests Supabase da Home e 13 do Explorar foram observados
por versão; as seis RPCs de catálogo continuaram distintas. Em amostra sem
erro, perfis e capítulos do Explorar iniciaram juntos na PR, após a consulta
de obras; na `main`, capítulos começaram após perfis.

Na regressão local focada, com um worker e zero retries, 4/8 testes passaram.
Os outros quatro falharam por loading acima de 12 s ou timeout de axe sob
contenção; os snapshots mostraram o loading real, e o PostgREST registrou
novos `57014` na mesma execução. Não houve aumento de timeout, retry nem
relaxamento de asserção. Os 24 unitários de loaders Home/Explorar passaram.

O erro anti-spam do descartável reutilizado é independente: o teste usa um
UUID fixo para o usuário e o bucket privado de rate limit persiste após a
exclusão dessa conta, por janela de até 86.400 s; a CI com banco novo aprovou
o teste sem mudar quota ou fixture. Os `57014` locais são falhas reais do
PostgREST sob contenção, não devem ser ocultados ou tratados como resultado
válido do catálogo. Reutilizar esse banco para homologar latência ou rate
limit sem limpeza/isolamento apropriado não produz evidência confiável.

**Parecer de merge do escopo:** o bloqueio de 12 s não é regressão comprovada
da #2264. A mudança de produção permanece pequena, com testes focados e CI
descartável aprovados; tecnicamente pode seguir para revisão e merge humano,
sem alterar os testes nem a aplicação. A falha local de recursos e o retry
isolado de sitemap na CI ficam registrados separadamente, não como causa da
PR. Isto não autoriza merge automático nem ativação de agendamento ou uploads.
