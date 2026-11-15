# Home — carregamento resiliente

Data: 13/11/2026. Base `98be8c31`. Branch `codex/home-carregamento-resiliente`.
Escopo: Home, helpers usados pela Home, testes e este registro da Home.

## Problema e comportamento resultante

O catch de `use-home-initial-data` apagava obras, favoritos e perfis juntos.
Um JSON de obras malformado abortava o snapshot antes de ler as coleções e
perfis independentes. Além disso, o callback de normalização podia atualizar
o ref do cache depois do cleanup; o estado anterior podia aparecer por um
render antes de a nova identidade terminar de carregar.

O estado passa a carregar sua identidade junto dos três conjuntos. A
renderização mascara imediatamente qualquer conjunto de outra identidade.
Cleanup invalida callbacks e respostas; um snapshot cancelado não persiste
coleções nem relê perfis depois de sua resposta. Em falha, preserva-se o
último conjunto válido da identidade atual, ou os dados locais válidos da
primeira carga. A troca de conta e o logout não reutilizam o conjunto pessoal
anterior. Não foi criado cache global de dados pessoais nem fallback sem sufixo.

Storage de obras inválido é tratado isoladamente: conserva a cópia em memória
quando houver, não sobrescreve o JSON inválido e continua favoritos/perfis e
remoto. Leituras inválidas de listas/perfis ou storage bloqueado também
sinalizam indisponibilidade. Os helpers mantêm seus retornos anteriores;
callbacks opcionais internos permitem distinguir falha de vazio confirmado,
inclusive nos catches de catálogo, capítulos, perfis, métricas e coleções.
Obras/favoritos apenas locais e perfis sem cobertura remota também sinalizam
atualização incompleta; um retorno vazio remoto não reconfirma o cache mantido.

A Home só termina o loading depois de ambos os ramos terminarem. Falha exibe
aviso de possível desatualização e retry explícito em PT/EN/ES; dados locais
ou resultados parciais não são apresentados como confirmação remota. O estado
vazio continua disponível após sucesso vazio, mas não certifica ausência de
obras numa carga com erro. Não há retry automático, timeout artificial ou
consulta extra para descobrir se um fallback veio de falha.

As operações já emitidas pelo loader de obras podem concluir após o cleanup;
a persistência pré-existente de perfis continua no namespace do usuário que
iniciou aquela consulta. Elas não autorizam atualizar o estado/ref da Home da
nova conta. Não houve alteração da autenticação compartilhada ou do Login.

## Esperas e contratos

Antes, obras aguardavam o snapshot, que aguardava favoritos/concluídas.
Agora o callback local inicia as obras enquanto as mesmas coleções carregam.
O caminho crítico deixa de somar essas esperas independentes; a prova local
reteve as respostas das coleções e observou obras começarem antes da liberação.
Não foi alegada uma redução percentual de LCP ou latência de produção.

O hook usa a identidade fornecida pelo hook de sessão da própria Home, sem
um segundo `getUser` durante a identidade inicial vazia. O fallback original
de resolução do usuário do helper continua sendo o padrão para chamadas que
não optem por essa integração. Sem identidade, não se lê storage pessoal.
A mudança não paraleliza perfis/capítulos: aquela otimização descartada em
`PERFORMANCE_ENTRADA_HOME_EXPLORAR.md` não foi reintroduzida.

Consultas, payloads, filtros, paginação, ordenação, campos, RPCs, chaves e
formatos de storage, RLS e contratos públicos de rede permanecem iguais.
A contagem da carga anônima controlada permanece:

| Consulta | Quantidade |
| --- | ---: |
| RPC `listar_obras_catalogo` | 6 |
| `obras` | 1 |
| `capitulos` | 1 |
| `profiles_publicos` | 2 |
| RPC `obter_metricas_conteudos` | 2 (obras/capítulos + avaliações dos autores) |

Catálogo vazio confirmado executa as seis RPCs, sem executar a consulta de
obras. Cada retry explicitamente acionado repete o carregamento; rerender
com identidade inalterada não inicia nova carga. Busca da Home permanece
com seu debounce e lifecycle existentes.

## Evidências locais

Node **22.23.5**, dependências já instaladas dos lockfiles, sem reinstalar
pacotes ou alterar dependências. Typecheck, Lint focado e Build aprovados.

- Bateria completa dos testes Home: **231/231** aprovados.
- Quatro cenários adicionais de fronteira foram acrescentados depois; a
  execução dos quatro arquivos diretamente afetados passou **39/39**.
  Mais dois casos de fallback não reconfirmado foram adicionados na revisão;
  a bateria dos quatro arquivos afetados passou **40/40**.
  Total de **237 casos distintos**, sem somar novamente as regressões repetidas.
- Testes executam os helpers reais transpilados e o hook com um harness de
  estados/efeitos controlado. Cobrem as duas ordens de conclusão, falhas
  lançadas/absorvidas, JSON inválido, snapshot anterior da mesma/outra conta,
  falha parcial de coleção, retry, render antes do cleanup, resposta antiga,
  logout, desmontagem, callback atrasado e persistência após cancelamento.
- **8/8 cenários Playwright aprovados no build final**,
  workers=1/retries=0, sobre build de produção: carga normal, vazio confirmado,
  falha com cache pessoal/retry e JSON inválido/coleções retidas, em desktop
  1440×900 e mobile 390×844. Aviso e retry verificados em PT/EN/ES, foco/Enter,
  ausência de overflow e axe na página inteira sem violações serious/critical.
- HTTP e sessão são fixtures locais controladas; as requisições são feitas
  pelo SDK real no navegador. Não é homologação de Auth, RLS, Data API ou
  concorrência de um Supabase real. Nenhum Docker, banco ou projeto remoto
  foi iniciado/acessado para esses testes.

Comandos dos unitários:

```sh
node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/home-*.test.mjs qa/unit/use-home-*.test.mjs
node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/home-initial-data-loader.test.mjs \
  qa/unit/home-author-storage-utils.test.mjs \
  qa/unit/home-author-profile-loader.test.mjs \
  qa/unit/use-home-initial-data.test.mjs
```

Build com configuração fictícia local explícita:
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, chave publishable fictícia.
Servidor `next start` em `127.0.0.1:3100`; testes bloqueiam execução fora de
base/API de loopback. O config temporário em `work/` reutilizou o config
Playwright do repositório, com Chromium do ambiente `/usr/bin/chromium` e
FFmpeg oficial baixado para `work/`, preservando vídeo/trace/asserções/timeouts.
Nenhuma alteração no runner ou workflow foi versionada.

Execução final do navegador, com o mesmo ambiente local:

```sh
npm --prefix qa test -- --config=/workspace/work/home-playwright.config.mjs \
  home-resilience.spec.mjs --workers=1 --retries=0
```

A bateria final de unitários diretamente afetados:

```sh
node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/home-initial-data-loader.test.mjs \
  qa/unit/home-supabase-works-loader.test.mjs \
  qa/unit/home-author-profile-loader.test.mjs \
  qa/unit/use-home-initial-data.test.mjs
```

Diagnósticos durante o preparo: Playwright primeiro não abriu páginas por
falta de FFmpeg; instalado o artefato oficial sem Docker. Os primeiros
seletores de título eram ambíguos entre hero/cards; passaram a exigir h1.
A contagem das métricas agora aguarda o efeito de avaliações dos autores.
Uma tentativa de trocar fixtures HTTP no meio do mesmo teste de reload
mostrou aviso no cenário vazio, não reproduzido na execução diagnóstica;
a causa específica permaneceu inconclusiva. Normal e vazio passaram a usar
contextos independentes, sem sobreposição de fixtures. Todas as asserções
funcionais permaneceram, sem aumento de timeouts, retries ou skips.

Revisão final: diff completo, escopo e `git diff --check` conferidos antes do
commit. Nenhum arquivo alterado pertence à lista de arquivos da #2293 lida
no início. Por isso, este registro é exclusivo da Home; os documentos
compartilhados `CURRENT_STATUS.md` e `refatoracao-comunidade.md` não foram editados.
Sem Login, Explorar, migrations, merge, deploy ou produção. CI completa fica
no pipeline vigente; consultar uma vez ao abrir a PR draft, sem rerun/polling.
