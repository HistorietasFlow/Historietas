# Diário de edição — contrato desativado para homologação

Branch independente da main. A #2307 e seu helper legado não são alterados.
A migration `20261114034604_diario_edicao_evento_seguro.sql` prepara o contrato;
**não registra eventos automaticamente e instala `habilitado=false`.**
Sem backfill, Cron, upload, publicação ou adaptação do formulário nesta entrega.

## Contrato e autoria

`public.registrar_diario_edicao_capitulo(p_capitulo_id uuid,p_versao uuid)`
retorna o UUID da atividade, ou NULL quando o autor a removeu após registro.
O wrapper é invoker. O núcleo definer fica em `historietas_privado`, com
search_path vazio, ACL explícita e sem exposição direta pela Data API. A permissão
para chamar não concede acesso às tabelas privadas. Sessão Auth existente e não
expirada, usuário não banido/excluído, termos vigentes e autoria **simultânea**
da obra e do capítulo são revalidados a cada chamada, inclusive retry.
Service role e anon não recebem EXECUTE. Locks: sessão, gate, obra, capítulo.

Somente edições de capítulos de **texto publicados**, em obras publicadas de
classificação Livre a 16+, são elegíveis. Drafts, imagens, 18+, conteúdo excluído
e vínculo divergente são recusados. Não reinterpretar edição como publicação.
O CHECK efetivo é estendido por `pg_get_expr`, preservando todos os tipos atuais;
a expressão anterior e a policy anterior são guardadas para rollback exato.

## Versão e repetição

O BEFORE trigger gera UUID novo para alteração efetiva de título/texto; INSERT
e legado não recebem token. Mudança de autoria, vínculo, tipo, publicação ou ordem
invalida o token. Atribuição direta/no-op não o substitui. Não é timestamp nem
contador, não é segredo e não bloqueia outras escritas no capítulo.

Uma integração futura deve retornar `diario_edicao_versao` na representação do
**UPDATE confirmado** e guardar os argumentos exatos da RPC junto da intenção.
Não buscar uma versão mais nova para anexar uma edição incerta à intenção antiga.
A #2307 continua dependendo de adoção desse contrato em revisão própria.

Registro e recibo são atômicos. O lock do capítulo serializa chamadas concorrentes;
a PK de versão impede duplicação. Retry de RPC após resposta perdida usa os mesmos
argumentos e retorna o recibo existente; não repete INSERT, UPDATE do capítulo ou
notificação. Exclusão voluntária da atividade torna o ID do recibo NULL: repetir
não recria o evento. Recibos sobrevivem à exclusão do capítulo, sem snapshots de
conteúdo; apagar/recriar um capítulo não reaproveita seu token. Versão desconhecida
retorna PT409; sessão/autoria/conteúdo inelegível, 42501; gate fechado, 55000.
Falhas entre evento e recibo revertem a transação inteira. Sem retries automáticos.

## Privacidade e grants

O evento guarda apenas IDs, timestamps, texto vazio e metadata `{}`. Nenhum título,
href, slug, texto do capítulo ou snapshot fornecido pelo cliente entra no Diário.
A leitura verifica novamente existência, vínculo, autoria, texto/publicação e
classificação atuais. Despublicar, excluir ou mudar para 18+ oculta a linha,
inclusive para o autor: não resta metadata histórica para vazar. Conteúdo já
entregue anteriormente a um navegador não pode ser revogado por RLS.

Bloqueios/perfil privado seguem o helper vigente `usuario_pode_ver_perfil`;
`mostrar_diario_perfil` e `mostrar_atividades_leitura` governam leitores terceiros.
Não são concedidas leituras de preferências nem de recibos. O autor pode ver seu
próprio evento elegível mesmo quando desliga a exibição pública. SELECT dos tipos
anteriores mantém a expressão anterior; suas limitações legadas de leitura anônima
mista não são corrigidas por esta migration. Uma policy restritiva adicional protege
o novo tipo mesmo diante de outra policy permissiva.

INSERT direto do tipo novo e UPDATE **de ou para** esse tipo são proibidos para
authenticated; DELETE próprio continua permitido pela policy existente. Não há
novo GRANT de tabela pública. O definer só escreve o payload canônico após todas
as validações; não há operação administrativa genérica ou entrada de metadata.

## Implantação — somente após revisão e homologação explícitas

1. Inspecionar CHECK/policies/grants efetivos e migrations aplicadas; confirmar
   dependências da main, funções privadas, sessão e termos. Não supor aplicação
   remota por merge. Revisar custo de locks e retenção dos recibos privados.
2. Em Supabase **local descartável**, aplicar toda a cadeia e rodar
   `supabase test db supabase/tests/database/diario_edicao_evento_seguro.test.sql`,
   regressões de agendamento/Diário, auditoria SQL/RLS e advisors. Testar Data API
   como anon, autor, terceiro e sessão revogada; testar dois clientes simultâneos,
   commit com resposta descartada, exclusão voluntária e rollback.
3. Revisar adoção futura pelo save: UPDATE confirmado retorna token; RPC usa o mesmo
   token; nenhuma segunda escrita de capítulo/Diário legado/notificação em recovery.
   Homologar via Playwright digitação durante gravação, clique duplo, A→B→A,
   logout e falha de rede. Não ligar o novo tipo ao helper antigo por fallback.
4. Aplicação de migration remota, integração da aplicação e mudança do gate exigem
   autorização própria. A migration **não** liga o gate. A única mudança operacional,
   após homologação, seria por administrador SQL:
   `update historietas_privado.diario_edicao_config set habilitado=true where chave;`
   Nenhum cliente tem essa permissão. Não executar esta linha como parte do rollout
   automático nem da CI compartilhada; testes só a usam em transação local revertida.

## Rollback sem perda

Rollback operacional: desligar `habilitado` e retirar a integração futura da RPC.
A alteração aguarda operações que detenham lock compartilhado do gate. Conservar
policies, recibos e tokens: assim nenhum retry ressuscita atividade apagada. Não
apagar eventos nem recibos para fazer uma tentativa passar. Não remover o CHECK
novo enquanto existirem linhas desse tipo.

O script manual `docs/sql/rollback-diario-edicao-evento-seguro.sql` é exclusivamente
para rollback físico **com zero eventos e zero recibos**. Ele aborta caso encontre
qualquer um deles, restaura as expressões exatas e remove somente os objetos desta
migration. Não é migration automática nem comando remoto autorizado. Após algum
uso real, preparar forward fix revisado, mantendo tombstones; não fazer downgrade
cego ou mexer manualmente no histórico do Supabase.

## Evidências

Ver resultados locais e limites no PR. Os testes pgTAP são transacionais e não
ativam duravelmente o evento. Não confundir teste SQL ou CI com homologação da
integração futura do formulário. Nenhuma ação foi realizada na #2307 ou produção.

Validação executada nesta preparação (Node 22.23.5, CLI 2.116.0,
Postgres Supabase 17.6.1.121, exclusivamente local descartável):

- 52/52 asserções pgTAP focadas; suíte completa de banco com 1.132/1.132
  aprovações antes das três últimas asserções de preferências/gate (estas passaram
  na rodada focada final). Inclui grants, anon sem claims, autoria/sessão, CHECK,
  token não forjável, privacidade, atomicidade e tombstone.
- Integração com dois processos psql passou: a segunda conexão foi observada em
  `wait_event_type='Lock'` enquanto a primeira retinha o lock; um recibo/evento,
  replay após commit e exclusão sem recriação. Rollback físico com recibo foi
  recusado preservando dados. Execução:
  `HISTORIETAS_DIARIO_LOCAL_CONTAINER=supabase_db_Historietas node --test qa/integration/diario-edicao-concorrencia.test.mjs`.
- Rollback físico sem dados restaurou CHECK e SELECT exatamente; reaplicação
  reinstalou o contrato com gate=false. Nenhuma exclusão de eventos/recibos reais.
- Advisor de segurança local: nenhum problema. Auditoria estática: 199/199.
  ESLint focado do runner e diff check aprovados.
- Lint SQL de public + historietas_privado: seis apontamentos idênticos antes e
  depois da migration, comprovados removendo/reaplicando apenas este contrato no
  banco descartável. Cinco funções de monitor referenciam tabelas Cron ausentes;
  uma função de cache possui variável não usada. Nenhum apontamento nas funções
  novas. Não instalar/ativar Cron para contornar isso.

Não executados nesta entrega: REST/Data API, Build ou Playwright. Não houve mudança
na interface nem adoção do contrato pelo save. A integração futura e a ativação
seguem pendentes de homologação própria. Os testes foram feitos sobre as migrations
reais da main, com a normalização ACL de QA usada pela CI, excluída do commit.
