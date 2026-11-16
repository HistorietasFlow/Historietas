# Stories — homologação integrada, 16/11/2026

Parecer: **NÃO APTO para homologação final**. A PR deve permanecer draft.
Dados/segurança, imagem e interface estão integrados; permanece uma falha da
última validação desktop de prévia, aguardando resposta da geração do PNG.
Nenhuma mudança em funcionalidades aprovadas foi feita nesta homologação.

## Resultados

- Unitários das etapas 1/2/3: 31/31, concorrência 1, 14,19 s.
- Integrações dedicadas: 15/15, concorrência 1, 15,22 s, Supabase LOCAL.
- Playwright inicial: cinco cenários desktop passaram; primeiro mobile expirou
  esperando métricas antes de seus pré-requisitos concluírem; outros quatro
  não executados. Relatório anterior à correção preservado.
- Após corrigir somente a sincronização do teste, o cenário mobile afetado
  passou isolado em 38,17 s, dentro dos 45 s originais.
- Rodada final: desktop de prévia falhou (38,55 s) enquanto a requisição de
  geração ainda aguardava resposta; nove cenários não executados nessa rodada.
- Os nove restantes foram então executados UMA VEZ e passaram, sem repetir o
  cenário desktop falho: nove passes em 110,10 s. São execuções complementares,
  **não uma rodada de 10/10**. Todos usaram workers=1/retries=0.
- ESLint focado de todos os módulos/testes Stories, typecheck --noEmit e
  git diff --check: aprovados. npm audit --omit=dev --audit-level=high: zero.
- Reutilizado o build anteriormente aprovado; comparação byte a byte confirmou
  que os módulos server-side, endpoint e componente de compartilhamento são os
  mesmos. Typecheck executado no worktree isolado existente. Sem reinstalação.

| Cenário da versão final | Desktop | Mobile |
| --- | --- | --- |
| Prévia, download, compartilhar, cancelamento, fallback, teclado e axe | FALHOU: geração pendente | PASSOU 8,2 s |
| Anônimo, propriedade, avaliação privada e obra despublicada | PASSOU 7,5 s | PASSOU 5,9 s |
| Falha de geração, fechar durante geração e troca de conta | PASSOU 5,6 s | PASSOU 7,3 s |
| Inglês/espanhol com prévia pronta e controles traduzidos | PASSOU 12,0 s | PASSOU 15,4 s |
| Alterações salvas e exclusão da própria avaliação | PASSOU 11,5 s | PASSOU 26,9 s |

## Identidade, dados e segurança

Fixtures novas com Auth real e cookies SSR, consultas públicas/RLS, obra e
Storage reais. Nenhum dado remoto. Proprietário confirmado pelo servidor;
anônimo, outra conta, avaliação privada/parcial, preferências ocultas, biblioteca
privada, draft, obra 18+, inexistente e despublicada recusados nos testes focados.
Notas 0,5–5 sem arredondamento; integração acrescentada de alterações para
3 / 3,5 / 0,5 e exclusão, sempre filtrada por obra e leitor novos da fixture.
O loader recusou a avaliação excluída; nenhuma nota foi inventada ou recuperada
do cache pessoal. Os dados anteriores do stack e o SQL local foram preservados.

## Espera por métricas: causa comprovada no teste

A espera antiga era instalada antes da navegação e gastava seus 15 s também
em navegação, Auth e revalidação pública, embora a aplicação só consulte métricas
após a confirmação da identidade e da obra pública. Na reprodução, Auth retornou
200 e identidade correta, mas métricas ainda NÃO haviam sido solicitadas quando
a espera expirou. Não foi demonstrado timeout SQL ou falha de identidade.

O teste agora observa respostas desde antes da navegação e verifica em test.step
os pré-requisitos: navegação, Auth concluído da conta esperada (quando autenticado),
obra pública concluída e métricas da obra com HTTP 200/corpo concluído.
Usa os limites existentes de expect/navegação e o mesmo teto total de 45 s,
sem timeout customizado, retry ou alteração no aplicativo. Visitante continua
exigindo confirmação pública e métricas; somente a identidade autenticada não
é exigida nessa situação. Nenhuma asserção de privacidade foi removida.

A execução isolada confirmou a necessidade dessa ordem: primeira chamada Auth
aos 9,883 s, revalidação pública até 24,858 s, métricas iniciadas aos 27,603 s e
concluídas aos 28,288 s, confirmação do Story até 30,441 s e geração até 34,495 s.
O cenário inteiro terminou em 38,166 s. A causa da lentidão ambiental subjacente
não foi comprovada; essa correção resolve a atribuição incorreta do orçamento
de espera do teste, não promete acelerar Auth, rede ou aplicação.

## Pendência real da rodada final

Desktop: obra pública concluída aos 8,283 s; Auth da identidade esperada
concluído; métricas 200/corpo concluído aos 14,091 s; confirmação do Story 200
concluída aos 21,781 s. Geração iniciada aos 24,103 s, sem resposta registrada
até a falha da expectativa de prévia (12 s), teste encerrado em 38,551 s.

Não foi comprovado se o custo estava em Auth/consultas, mídia ou renderização
internos ao gerador. Não se alterou a geração nem seu design para ocultar a falha.
Próximo diagnóstico mínimo: duração/status por etapa do gerador, apenas rótulos
predefinidos, sem credenciais/payload/IDs, e validação somente desse cenário.
Não aumentar timeouts, remover verificações ou tratar passe anterior como resolução.

## Visual, PNG e acessibilidade

PNG 1080×1920 verificado no render e downloads reais. Meia estrela por recorte
exato, capa sem distorção, fotos ausentes com flags, nomes/títulos longos em
caixas fixas e remoção conjunta de @ e & cobertos. Texto que excede os limites
documentados ou contém glifos não suportados é recusado, não cortado silenciosamente.
Geist somente nos dados dinâmicos, conforme autorização; rótulos fixos e wordmark
originais. Referência normalizada por escala uniforme; não se alega identidade
pixel a pixel das fontes dinâmicas autorizadas.

Wordmark SHA-256 da origem e do asset, idênticos:
5FE1131C18EEED6EEA0EEA1DE032644A957B64389A462297948E6348BEFDFA81.

Capturas conferidas e incluídas na PR, somente fixtures sintéticas:

- [Interface desktop](../qa/stories/desktop.png) — execução anterior aprovada deste cenário.
- [Interface mobile](../qa/stories/mobile.png).
- [Referência à esquerda e geração à direita](../qa/stories/comparacao-modelo.png).
- [Textos longos, ausência de @ e fotos ausentes](../qa/stories/casos-limite.png).

O diálogo foi verificado com axe sem violações nas execuções aprovadas, foco
inicial, ciclo Tab/Shift+Tab, Escape e retorno ao acionador. PT/EN/ES verificados.
Web Share testado com adaptação da API do SO, mas arquivo/PNG/backend reais;
não certifica publicação num aparelho físico ou Instagram. Fallback/cancelamento
testados. Não há publicação automática ou promessa de entrega a uma rede social.

## Evidências e escopo da PR

Logs locais ignorados: qa/reports/story-stage4/unit.log, integration.log,
lint.log, typecheck.log, audit.log, playwright-before-stage-sync.json,
mobile-stage-sync.json, playwright-final.json e playwright-remaining.json.
Somente metadados de etapa, códigos HTTP, tempos e booleans de identidade nos
diagnósticos anexados; sem tokens, cookies, senhas, IDs pessoais ou dados privados.

PR reúne os arquivos das etapas 1–3, scripts/testes dedicados, referências
autorizadas, quatro evidências visuais e Memory Bank Stories. Nenhuma migration,
permissão, arquivo .env, lockfile, supabase/.temp/cli-latest ou trabalho alheio.
Sem merge, deploy ou produção. Containers/volumes preservados e serviços
iniciados nesta tarefa devolvidos ao estado parado.

Não foi executada uma CI completa local ou os testes destrutivos de outros
domínios. A branch nasce do workspace existente e a main avançou 30 commits;
a compatibilidade com a main atual e os checks remotos da PR são verificações
separadas, não cobertas pelo passe do build local existente.
