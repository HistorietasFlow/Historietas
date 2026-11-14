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

## Correção da falha de Tests da PR #2317

CI `43558685193`, job `132337250140`: o gate de sessão falhou em
`obra-page-css.test.mjs:69`. Minha alteração adicionava uma quinta raiz com o
CSS, enquanto o contrato compartilhado exige quatro consumidores. A falha
`5 !== 4` foi reproduzida localmente, sem classificar como preexistente.

O erro Auth agora usa o bloco de resultado/erro existente. Não foi removido
CSS nem alterado o teste para contornar a asserção. O guard desse bloco inclui
erro Auth mesmo com snapshot presente; o guard do spinner exclui erro Auth.
A raiz sinaliza erro e aria-busy=false; o alerta e o retry de sessão continuam
acessíveis, sem mostrar conteúdo antigo durante falha de autenticação.

Regressão nova no arquivo próprio avalia o guard real do ramo de resultado,
extraído pela AST TSX: snapshot presente com falha deve entrar no erro;
snapshot válido sem falha não deve entrar. Também verifica busy e seleção do
retry. Teste compartilhado da #2315 intacto.

Validação focada: **14/14** (três testes CSS existentes + onze regressões
próprias). Typecheck, Lint focado, Build e diff check aprovados. Logs em
`/workspace/work/obra-ci-repro.log`, `obra-ci-focused.log`,
`obra-ci-typecheck.log`, `obra-ci-lint.log`, `obra-ci-build.log` e
`obra-ci-session-final.log`. Playwright/Axe e backend real continuam pendentes;
não declarar homologação de interface completa ou RLS. A CI remota completa
permanece necessária, sem rerun manual ou polling após o próximo push.

Gate completo final `npm run test:session` aprovado: **2040/2040**, incluindo
pre (387), principal (1513) e post (140), zero falhas/skips. A execução final
ocorreu depois de concluir o ajuste do guard; não substitui os gates remotos
posteriores que foram pulados na CI interrompida.
