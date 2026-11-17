# Ranking Geral — validação conjunta, sem ativação

## Fontes imutáveis

Base da main: `77beb0e49f0b228c75ad841ce952bd5994628932`.

| Origem | Head incorporado | Contrato |
| --- | --- | --- |
| #2348 | `5aac2c3ceb6bf5795b27606113285d21119251c1` | RPC bayesiana e testes SQL/Data API |
| #2354 | `1d01b56cbe7f30bd43fff746178d68aa9b3c7834` | Núcleo paginado, selo completo, gates e diagnóstico editorial |
| #2352 | `420cf82d7e010be9c0abdfb21b65646497be3b7c` | Interface, endpoint server-only e flag desligada |

A #2354 já contém a #2348. A integração junta a interface à corretiva em
`qa/ranking-geral-integracao-2348-2352-2354`, sem modificar as branches/PRs de origem
ou a main. A #2351 não faz parte desta integração.

## Ajustes necessários na junção

- Conflito somente em `docs/memory/CURRENT_STATUS.md`, conciliado com o estado atual.
- `package.json` tinha dois `posttest:static`: a chave posterior ignorava o hook da interface.
  Agora há uma chave única, com o comando anterior integral e os 11 testes da interface.
- Código funcional da UI e as duas migrations/testes SQL preservados byte a byte
  em relação aos heads acima. Fórmula, cursor, ACL e RLS não foram reescritos.
- A QA real da interface é reutilizada de `8bbbeaca6fd15264a33662a8f0e5aa4699778e9b`
  (CI anterior #44033271168). Os testes/fixture são os mesmos; o novo workflow
  utiliza exclusivamente o checkout integrado, sem copiar SQL de outra branch.

## Gates da combinação

1. `ranking_rls_global`: Supabase descartável próprio, pgTAP, Data API, equivalência
   de todas as obras em 4k/20k, revogação, limites e chamadas SQL diretas.
2. `ranking_interface_integrada`: outro Supabase descartável com as duas migrations,
   fixture de 25 obras elegíveis e quatro excluídas, build e Playwright real em
   1440/390/320 px. Abrange endpoint, páginas 20+5, cursor revogado, dados de sessão
   ignorados, estados controlados, axe, foco e botão livre da barra inferior real.
   Workers=1/retries=0; há um skip intencional do teste da barra mobile no desktop.
3. O check obrigatório `Tests` depende dos dois jobs e executa com `always()`.
   Seu primeiro passo exige `success` nos dois resultados. Falha, cancelamento,
   skip ou resultado ausente em qualquer um torna `Tests` vermelho.
4. Todos os gates originais da CI permanecem. pgTAP/Data API completos não são
   duplicados no job exclusivo da UI, pois já são obrigatórios nos demais jobs.

As Actions remotas continuam fixadas por SHA, os workflows locais são auditados
recursivamente e a concorrência dos jobs de ranking é separada por PR/ref.

## Ativação e ambiente

`NEXT_PUBLIC_RANKING_GERAL_PREVIEW=true` existe somente no runner descartável do job
da interface. Os demais jobs e o comportamento padrão continuam com a flag ausente:
endpoint 404 antes da consulta. O script de ambiente exige Supabase loopback e exporta
somente a URL/chave pública locais. O navegador não recebe credenciais administrativas.

`vercel.json` permanece idêntico à main, com deploy de branches secundárias bloqueado.
Nenhuma configuração remota, migration gerenciada, merge na main, deploy ou ativação
foi autorizada nesta etapa. As capturas usam somente conteúdo sintético.

## Build e envio externo

A primeira execução local foi interrompida pela revisão automática por possível
envio ao endpoint de ingestão do Sentry. A alternativa segura usa a opção oficial
`telemetry: false` do plugin de Build e DSN/token vazios nos jobs de QA. O código
instalado do SDK confirmou que essa opção impede o transporte da telemetria.
Monitoramento de erros da aplicação e configuração de sourcemaps de produção
continuam nos mesmos arquivos; não foram alteradas variáveis da Vercel.

O Build local foi concluído com essas proteções. Smoke HTTP do artefato compilado
confirmou `/api/ranking-geral` = 404, `{ estado: "desativado" }` e `no-store`, com
preview ausente. Nenhum Build bloqueado foi deslocado para CI para manter o envio.

## Evidências e limite atual

A [CI #44068200737](https://github.com/HistorietasFlow/Historietas/actions/runs/44068200737)
validou a corretiva isolada: 1.368 pgTAP, equivalência global e 264 Playwright sem
flakies naquela execução. A causa do flaky de login anterior continua inconclusiva;
o diagnóstico sanitizado foi habilitado e não houve recorrência nessa rodada.

Validação local da combinação: 25/25 testes focados, Typecheck, ESLint focado,
auditoria estática 199/199, JSON sem chaves duplicadas, sintaxe da fixture/QA e
paridade dos fontes, Build e validação HTTP da flag desligada aprovados.
Sem Docker/Supabase/navegador local preparado: pgTAP, Data API e Playwright reais
da combinação dependem da nova CI desta branch. Uma execução anterior verde não
homologa automaticamente a integração nem produção.

Próximo passo: conferir os gates/capturas da nova PR draft antes de qualquer
decisão de merge, migration remota, deploy ou ativação.
