# Ajuda — envio, identidade e recuperação

Base `98be8c31` (`main`), branch `codex/ajuda-suporte-resiliente`.
Investigação de 13/11/2026 (America/Sao_Paulo).

## Falhas comprovadas

Três regressões executáveis falharam **3/3** no hook original:

- Dois submits antes do próximo render executavam duas criações: a proteção
  usava somente o estado React capturado pela função.
- `{ data: null, error: null }` era tratado como sucesso. O formulário era
  apagado mesmo sem o recibo retornado pela RPC.
- Falha na leitura posterior a uma criação apagava os chamados já carregados.

Duas regressões adicionais falharam **2/2** com o hook original de `98be8c31`:
logout sem navegação não limpava lista/rascunho; concluir uma criação após
unmount ainda fazia setters e iniciava a atualização de chamados.
As cópias da base foram executadas fora do checkout da tarefa. Não houve
alteração da main ou das branches anteriores.

## Contratos da correção

Uma ref trava o submit sincronicamente. Cada identidade tem uma versão
monotônica; cada leitura tem seu número de consulta. Respostas antigas,
cleanup, callbacks capturados antes de trocar de conta e sequências A → B → A
não podem aplicar estado, iniciar escritas ou terminar o loading atual.

Eventos Auth invalidam imediatamente dados, rascunho e feedback anteriores.
A revalidação usa `getUser`, fora do callback síncrono Auth; `INITIAL_SESSION`
tardio e refresh sem mudança de ID não recarregam. Erro Auth não é visitante;
`AuthSessionMissingError` representa a ausência normal de sessão. O submit
confere novamente a identidade antes de chamar a RPC de criação.

A lista válida permanece em memória em falhas da mesma identidade. Durante
uma falha de Data API, ela aparece como resultado da última consulta confirmada,
com aviso explícito. Enquanto a sessão não estiver confirmada, os chamados
ficam ocultos e o envio desabilitado. Trocar de conta ou sair limpa o snapshot.
Falha ou formato inválido não certificam vazio. A mensagem de vazio exige uma
resposta `[]` válida, sem erro nem carregamento pendente.

`Atualizar chamados` recupera sessão/lista por ação manual; nunca cria um
chamado. Não há retry automático, polling, cache global ou novas chaves de
storage. Mudança de idioma não refaz consultas.

A criação só informa sucesso após uma linha de recibo com UUID, status válido
e data. Somente então limpa título/descrição. Falha na atualização posterior
fica separada desse sucesso confirmado e preserva a lista anterior.

Após envio com resposta perdida, erro de transporte ou recibo ausente/inválido,
o relato é preservado e fica explicitamente **sem confirmação**. Uma tentativa
igual não é repetida durante a vida desta página, inclusive após atualizar a
lista ou A → B → A. Nem uma lista vazia de até 20 itens prova que a criação não
aconteceu; não inferir sucesso por semelhança de título/descrição.
Rejeições SQL explicitamente conhecidas por abortar a RPC permitem uma nova
tentativa manual. Códigos desconhecidos, erros de conexão e conclusão SQL
incerta continuam bloqueando a repetição do mesmo relato. Relatos diferentes
podem ser preparados conscientemente, sem repetir automaticamente o anterior.

**Limite:** a RPC existente não recebe chave de idempotência. A proteção local
não garante exatamente uma criação após reload, remount, outra aba ou outro
dispositivo. Garantia durável depende de contrato de idempotência no servidor,
fora desta tarefa. Não foram adicionados SQL, persistência de rascunhos ou
chaves fictícias aos argumentos existentes.

RPCs preservadas: `listar_meus_problemas_tecnicos({ p_limite: 20 })` e
`criar_problema_tecnico` com os mesmos seis argumentos. A autoria continua
sendo derivada pelo backend; não há ID de usuário novo nos parâmetros, leitura
de outra conta ou alteração de grants/RLS. Normalizadores e suas opções/fallbacks
continuam existentes; a validação da resposta ocorre antes deles.

## Interface e acessibilidade

Loading, erro, snapshot anterior e vazio confirmado têm estados distintos.
Avisos e retry usam PT/EN/ES; botão de retry acessível por teclado, foco visível
e altura mínima de 44 px. O título da seção pode quebrar linha no mobile.
O Axe identificou contraste 2,56:1 no botão de envio branco sobre o cinza do
tema atual. A cor do texto foi corrigida dentro de Ajuda, mantendo o fundo do
tema e o comportamento de disabled; não houve alteração no tema compartilhado.

Na investigação, uma edição inicial atingiu outra regra CSS semelhante; o
diff foi corrigido para limitar o ajuste ao botão de suporte. O teste agora
confere o bloco CSS específico, além do hash atualizado e do Axe no navegador.

## Validação e limites

Node 22.23.5, dependências já instaladas dos lockfiles; sem reinstalação.
Os testes comportamentais executam o hook e os helpers reais transpilados,
com efeitos, estado, refs, callbacks, Auth e RPC controlados por promessas.
Incluem falha, sessão ausente, callback antigo, unmount, replay de efeitos,
A → B → A, leitura fora de ordem, recibo inválido, envio incerto, rejeição com
retry manual, atualização posterior falha e tradução sem consulta extra.

A ampliação de todos os unitários de Ajuda, antes do último caso adicional,
resultou em **69/74**. As cinco falhas são expectativas estruturais anteriores
sobre o local dos estilos/display/SvgIcon: `ajuda-display-utils.test.mjs` (1),
`ajuda-layout-styles.test.mjs` (1), `ajuda-support-styles.test.mjs` (2),
`ajuda-svg-icon.test.mjs` (1). Reproduzidas **3 passes / 5 falhas** executando
os quatro testes e toda a árvore `app/ajuda` extraídos de `98be8c31`. Os testes
e helpers alheios ao suporte permanecem intactos; não enfraquecer as asserções
para aprovar esta tarefa. As expectativas alteradas do suporte foram adaptadas
aos contratos novos e recebem cobertura comportamental adicional.

```sh
node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/ajuda-support-resilience.test.mjs \
  qa/unit/use-ajuda-technical-support.test.mjs \
  qa/unit/ajuda-technical-support-normalizers.test.mjs \
  qa/unit/ajuda-technical-support.test.mjs \
  qa/unit/ajuda-technical-support-form.test.mjs \
  qa/unit/ajuda-support-tickets.test.mjs \
  qa/unit/ajuda-support-messages.test.mjs qa/unit/ajuda-page-css.test.mjs
```

Playwright: `qa/tests/ajuda-support-resilience.spec.mjs`, descoberto pelo config
existente. API/servidor de loopback, build da tarefa, SDK real com HTTP controlado.
O cookie sem assinatura pertence à fixture e usa path `/ajuda`, evitando
exposição ao Auth real dos prefetches de outras rotas. Service workers ficam
bloqueados apenas nesta spec para manter a interceptação. Nenhuma fixture muda
cookies ou Auth do produto. Uma primeira abordagem com proxy HTTP de teste
produziu um erro de teardown (`Route is already handled`); foi substituída
pelo cookie restrito, sem suprimir erros. Timeouts/retries não foram ampliados.

```sh
npm --prefix qa test -- --config=/workspace/work/home-playwright.config.mjs \
  ajuda-support-resilience.spec.mjs --workers=1 --retries=0
```

O config temporário fora do repositório reutiliza o config QA, Chromium do
ambiente e FFmpeg já instalado. Build/servidor usam somente URL e chave
fictícias locais. As fixtures não homologam um backend Supabase real,
persistência, Auth remoto ou RLS. Não houve Docker, SQL, produção ou merge.
A indisponibilidade temporária do Cloud preservou o workspace; não foi usada
como justificativa para aprovar checks que ainda estavam pendentes.

Escopo exclusivo: `app/ajuda/**` e testes específicos. Por essa restrição do
pedido, Memory Bank e documentação compartilhada não foram editados; registro
fica aqui e na PR draft. Cobertura completa continua na CI; consultar uma vez
após o push/abertura, sem rerun ou polling.

Resultados finais da bateria afetada: **51/51 unitários**, **10/10 Playwright**
em desktop 1440×900 e mobile 390×844, workers=1/retries=0, **41,1 s**. Inclui
Axe na página inteira sem violações serious/critical, foco/acionamento por
teclado e ausência de overflow horizontal. Typecheck, Lint focado, Build e
diff check aprovados. As cinco falhas estruturais da ampliação ficam explícitas
acima; não foi declarada aprovação de toda a suíte ou homologação externa.
Logs da sessão: `/workspace/work/ajuda-focused-unit.log`,
`ajuda-browser-final.log`, `ajuda-all-unit-final.log`,
`ajuda-unrelated-baseline.log`, `ajuda-baseline-repro.log`,
`ajuda-identity-baseline.log`, `ajuda-typecheck.log`, `ajuda-lint.log` e
`ajuda-build.log` no mesmo diretório temporário. A CI completa permanece pendente.
