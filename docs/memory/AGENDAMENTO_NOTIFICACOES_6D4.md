# Agendamento — 6D4: orçamento transacional de notificações

Base: main `4f620190` (#2254), 10/11/2026. Runner desativado, sem Cron ou
ativação. Migration `20261110041125_orcamento_transacional_notificacoes_agendadas.sql`.
Este contrato limita a amplificação lógica do executor; **NÃO certifica capacidade
física nem autoriza publicação automática**.

## Auditoria e escopo

O notificador agendado deriva do contrato real de
`historietas_privado.criar_notificacoes_capitulo`: união distinta de seguidores
da obra, favoritos e seguidores do autor, excluindo o próprio autor. Os outros
produtores são o capítulo manual, interação de capítulo, social e Comunidade.
Eles não compartilham o novo saldo e não foram modificados. A publicação manual
e as notificações existentes não receberam uma quota nova.

O executor mantém seus locks de identidade/propriedade, termos, revisão, prazo
e capítulo. Antes do UPDATE que publica, constrói um plano privado a partir do
banco, sem texto, hash ou audiência fornecidos pelo navegador. A mesma seleção
é usada na escrita; novos seguidores durante a operação não ampliam o plano.
Não é uma promessa de entregar a seguidores que chegaram depois do snapshot.

O planner é derivado do corpo estrito existente, com guards de instalação e
normalização CRLF/LF; preserva campos, links, chave idempotente, timestamps e
compatibilidade das colunas. Cada uma das três fontes admite no máximo 101 IDs
distintos antes da união (até 303 candidatos). Se uma fonte superar 100, seus
101 distintos já demonstram excesso. Se a união couber, todos os elegíveis
estão presentes. Nunca se notifica um prefixo para fazer caber o orçamento.
Os índices existentes são reutilizados; a análise/consulta ainda tem custo e
depende dos timeouts. Não se promete um limite absoluto de CPU ou páginas lidas.

## Limites iniciais para revisão, não capacidade aprovada de produção

| Recurso | Limite |
| --- | ---: |
| Destinatários distintos por capítulo | 100 |
| Linhas planejadas por capítulo | 100 |
| Estimativa por linha | 8 KiB |
| Estimativa por capítulo | 256 KiB |
| Saldo acumulado de linhas admitidas | 1.000 |
| Saldo acumulado de payload admitido | 2 MiB |

Estimativa definida: soma de `octet_length(linha_jsonb::text) + 512`, em UTF-8.
Conta escaping e caracteres multibyte. **Não é tamanho físico**, índice, TOAST,
defaults adicionais, temporários ou WAL. Não extrapolar amostras de EXPLAIN.

São tetos conservadores de revisão: a 6D3 observou um item de 3.000 destinatários
ultrapassar o orçamento cooperativo de 2 s. O teto 100 limita a amplificação
inicial sem presumir latência proporcional. Os 2 MiB são um saldo finito pequeno,
não fração comprovadamente livre do disco gerenciado. Aprovação operacional e
tratamento de obras acima do teto continuam necessários antes da ativação.

O saldo não é diário nem renovado por lease, logout, horário, exclusão de
notificações ou remoção de contas/obras. Não há reset automático nem RPC de
reset/retomada nova. Configuração SQL privada não pode ultrapassar os tetos de
instalação e exige o runner fechado; não zera os débitos. A operação sustentada e qualquer
revisão futura de capacidade exigem fase/aprovação separadas.

## Atomicidade, concorrência e recuperação

- Planner, admissão, publicação, notificações, recibo, Diário e outbox pertencem
  à mesma subtransação do executor. Uma falha posterior reverte também o débito.
- O lock transacional global do runner serializa todos os executores agendados,
  incluindo a entrada administrativa antiga. A linha privada de saldo usa
  `FOR UPDATE` e escrita; snapshot REPEATABLE READ obsoleto não reutiliza saldo.
  Contenção recebe erro transitório, não sucesso parcial.
- Admissão insuficiente retorna `capacidade_notificacoes` antes da publicação,
  sem alterar intenção/revisão. O runner fecha o gate e sai sem registrar
  tentativa técnica desse item. Não há reativação automática.
- Conflitos idempotentes e supressões legítimas pelos triggers de 18+/bloqueios
  mantêm seus contratos. O débito pode superar o número efetivamente inserido:
  é conservador, nunca um reembolso otimista.
- Recibo existente é conferido antes de planejar/admitir; resposta perdida não
  cobra novamente nem recria Diário/notificações/outbox. Cascatas não devolvem
  saldo. Os eventos pendentes continuam com o contrato anterior, sem ACK ou purga.
- Tabela e funções novas são privadas, invoker, com RLS e revokes explícitos para
  PUBLIC, anon, authenticated, service_role e papel operacional. O plano é um
  contrato interno do executor SQL confiável, não uma autorização pública nem
  um DTO aceito de clientes. O papel restrito conserva somente sua entrada fixa.

## Evidências locais

Supabase CLI 2.116.0, Node 22.23.4, bancos novos descartáveis em Docker. Nenhum
teste ou migration remota. O primeiro descartável foi conservado com backup;
o segundo inclui seed versionado e serve para a validação final.

- pgTAP completo: **742/742 em 26 arquivos**, sem omitir testes. O novo arquivo
  cobre **43** asserções, incluindo exatamente 100 destinatários, 101 negados,
  limites exatos de bytes/linhas, ausência de audiência, rollback posterior,
  retry, recibos, Diário, outbox, RLS/grants e contrato legado intacto.
- Novas integrações: disputa real por saldo, resposta perdida, snapshot antigo,
  mudança de seguidores entre admissão e escrita, rollback por timeout e Data API.
  As três identidades de API, inclusive service role, não acessam o novo contrato.
- Playwright completo: **136/136**, build de produção, workers=1/retries=0,
  desktop/mobile, axe, publicação/Diário, cache, navegação e troca de identidade.
- Integrações finais, sem Build concorrente: **50/52** (as seis verificações do
  arquivo novo passaram). Falha legada da outbox e seu teste-pai descritos abaixo;
  não declarar o conjunto completo verde.
- Paginação Data API: **14/14**; anti-spam: **5/5**.
- Build, Lint, Typecheck e audit de produção (zero vulnerabilidades) aprovados.
  Sessão: 2.002 testes; paginação: 37 mais regressões de hooks existentes.
  Pós-estática: 60/60. Guard de GRANT/REVOKE de tabelas públicas aprovado.
- Auditoria estática no workspace: **198/199**, falha conhecida no guard que
  detecta a migration auxiliar ACL local preexistente. Arquivo preservado e não
  versionado; nenhuma asserção foi enfraquecida para aceitar o ambiente local.

EXPLAIN real, transação sintética revertida ao final:

| Caso | Notificações | WAL do plano | Execução local |
| --- | ---: | ---: | ---: |
| Publicação com 20 destinatários | 20 | 33.671 bytes | 376,177 ms |
| Publicação com 101 destinatários | 0; capítulo não publicado | 271 bytes | 6,640 ms |

Não é comparação de latência gerenciada nem teto por destinatário. A recusa
evita os efeitos volumosos; locks/consultas ainda podem gerar WAL. Rollback não
desfaz WAL já gerado. Não se encheu disco ou desativou autovacuum/checkpoints.

### Falhas encontradas durante a preparação

O primeiro teste integrado não envolvia a fixture em BEGIN/COMMIT: a claim local
expirava antes do aceite. Corrigida somente a fixture. Savepoints do novo pgTAP
revertiam também o contador de asserções; substituídos por restauração explícita
da configuração dentro da transação descartável, mantendo todas as verificações.

O cleanup inicial deixava uma intenção sintética pendente. Outro teste selecionou
essa intenção no backlog global, gerando falhas em cascata. Corrigido o cleanup
somente da obra/contas próprias; a outbox e os débitos permanecem preservados.
O banco com essa rodada foi parado com backup, não limpo para ocultar a falha.

Na rodada limpa ampliada, 49/52 passaram: a barreira QA de edição do executor
não foi observada no prazo enquanto havia Build concorrente; depois houve falha
de paginação em cascata porque o capítulo da edição foi publicado. O arquivo
do executor passou isolado **7/7**, sem alterar timeout ou retries. Isso não
torna a primeira rodada integralmente verde. Não foi alterado o teste legado
para mascarar a contenção. Build/integrações não devem disputar recursos nesse
ambiente limitado; containers antigos foram pausados com autorização e devem
ser restaurados ao final, sem remover volumes.

Na última rodada serial, o executor passou integralmente, mas a integração
`chapter-cache-outbox-supabase-real.test.mjs:79` exigiu `retry.length === 2` para
uma reivindicação global de até cinco. O banco conservava pendências das rodadas
anteriores, e o consumidor devolveu cinco eventos válidos. Resultado: **50/52**,
uma asserção e seu teste-pai falharam. O arquivo é idêntico à main e passou na
rodada limpa anterior; não é prova de excesso ou duplicação de notificações.
Não foram apagadas pendências nem alterados consumidor/asserção para mascarar
isso. A robustez desse teste com backlog é uma pendência QA independente.

## Bloqueadores restantes

O saldo limita somente efeitos agendados. Outros escritores continuam consumindo
disco e WAL; leases da outbox também geram crescimento físico. Os limites 6B3
continuam sendo amostras, não reservas de bytes. Espaço físico livre, WAL retido,
temporários e margem para operações em andamento precisam ser confirmados no
destino, com envelope agregado e observação independente. Sem ACK verificável,
a outbox finita exige parada planejada, não operação indefinida.

Cron gerenciado, monitoramento periódico, operação de saldo esgotado, alerta e
recuperação continuam sujeitos às certificações/autorizações próprias. Entrega
pontual de e-mail da 6D2 não substitui isso. Uploads ilustrados seguem suspensos.

Não houve mudança em produção, Vercel, quotas de Storage, dependências ou UI.
Nenhum Cron, upload, limpeza automática ou publicação automática foi habilitado.
Ao final, descartável parado com backup, runner=false, sem pg_cron, 24 eventos
preservados e 56 linhas admitidas no saldo dos testes. Os 11 containers antigos
foram restaurados: runner=false e 14 eventos, sem alteração do config.toml ou
da migration auxiliar. O arquivo de ambiente E2E anterior foi restaurado.

Custos: somente recursos locais de testes e SQL no banco existente. O caminho
agendado ganha materialização limitada e escrita da linha de saldo; não há
serviço, biblioteca, requisição HTTP cliente ou capacidade contratada adicional.

Referências de semântica usadas na revisão:

- [PostgreSQL 17: locks transacionais e concorrência](https://www.postgresql.org/docs/17/explicit-locking.html).
- [PostgreSQL 17: materialização de consultas](https://www.postgresql.org/docs/17/queries-with.html).
- [Auditoria 6D3](AGENDAMENTO_CAPACIDADE_6D3.md).
