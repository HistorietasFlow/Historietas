# Carregamento público — v2

Base main `98be8c31`, branch `codex/obra-publica-carregamento-v2`.

## Evidências e solução

A bateria inicial de oito regressões, executada contra cópias dos hooks e do
helper de identidade da base, teve quatro falhas: erro Auth retornado com data,
exceção Auth convertida em visitante confirmado, INITIAL_SESSION tardio
substituindo identidade mais recente e JSON/storage inválido impedindo remoto.
As mesmas regressões passam com a correção.

O fallback local é auxiliar. Falhas de leitura/JSON/backup não impedem a consulta
remota; sua entrada nesse caso é vazia, sem certificar storage antigo. Os guards
de identidade, cancelamento e timers permanecem. Falha remota continua erro;
a consulta, publicação, métricas e sincronização de backup remoto não mudaram.

Auth honra erros de getUser: somente AuthSessionMissingError é ausência normal
de sessão. Falha real invalida identidade anterior, mantém autenticação não
confirmada e expõe um erro explícito com retry manual. O conteúdo fica oculto
nesse estado, evitando loading legado permanente e interações de conta antiga.
INITIAL_SESSION não invalida validação em voo nem troca de conta mais recente.
SIGNED_IN/SIGNED_OUT e refresh continuam nos contratos existentes; versões
monotônicas distinguem A → B → A. Cleanup cancela respostas após unmount/retry.

O snapshot público foi investigado e preservado: coordenador invalida consultas
anteriores; pathname, versão de identidade e sequência pessoal guardam resultados;
revisões regressivas são rejeitadas. Não há substituição por cache local nesse
caminho. Regras editoriais, bloqueio 18+, DTO público, capítulos publicados,
RLS e métricas não foram alterados. Nenhum dado Auth de metadata autoriza conteúdo.

## Validação

Node 22.23.5, dependências existentes dos lockfiles. **40/40**: dez testes novos
executáveis dos hooks reais transpilados e trinta regressões existentes de
snapshot/projeção pública e storage, executadas sem editar seus arquivos.
Abrange navegação A → B → A, timers e respostas fora de ordem, logout, troca de
conta, INITIAL_SESSION tardio, refresh, erro Auth, storage inválido, falha remota,
retry manual e desmontagem. A captura de timers é local ao harness, sem mocks
globais. As expectativas estruturais compartilhadas não foram alteradas.

```sh
node --test qa/unit/obra-publica-carregamento-v2.test.mjs \
  qa/unit/public-work-snapshot.test.mjs qa/unit/public-work-projection.test.mjs \
  qa/unit/obra-local-works-utils.test.mjs
```

Typecheck e Lint focado aprovados. Build de produção local com URL e chave
fictícias de loopback. Logs desta sessão em `/workspace/work/obra-v2-*.log`.
Não executados: Playwright desktop/mobile/Axe e integrações Supabase reais;
não há backend descartável preparado para validar as rotas públicas. Testes
controlados não homologam Auth/RLS/persistência real ou produção. CI completa
continua necessária; consultar uma vez após abertura da PR draft, sem polling.

Escopo somente `app/obra/[slug]/**` e um teste específico novo. Nenhum teste
compartilhado da #2315 foi editado; nenhuma dependência de outro agente.
Por essa restrição, evidências ficam aqui em vez de editar Memory Bank/docs
compartilhados. Sem Docker, SQL, merge, deploy ou produção.
