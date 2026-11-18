# Reconciliação das migrations com o Supabase hospedado

Em 18/11/2026, a `main` estava em `c03f5303`. A PR #2365 ajusta as duas
versões da prévia de abertura. A comparação parte do commit `55a3026f`
daquela PR e cobre as outras 40 versões exclusivas do Git e 39 exclusivas do
histórico hospedado. A reconciliação dos 39 pares é proposta em uma branch
independente contra a mesma `main`, para executar os workflows obrigatórios.

## O que o CLI deve encontrar

| Resultado após as duas propostas | Quantidade |
| --- | ---: |
| Versões e nomes presentes nos dois lados | 95 |
| Versões somente no Supabase hospedado | 0 |
| Versões somente no repositório | 1 |

As 96 migrations do repositório mantêm a mesma sequência e o mesmo conteúdo
binário de antes da renomeação. Os 56 timestamps que já coincidiam na base
desta revisão permanecem no lugar. A contagem de versões mede o histórico de
migrations. A conferência de definições e permissões cobriu os objetos descritos
abaixo.

## Como os 39 pares foram identificados

Foi calculado o SHA-256 do arquivo do Git e dos bytes UTF-8 do SQL registrado
em `supabase_migrations.schema_migrations.statements`. Os 39 registros abaixo
têm um único elemento nesse array. Em 35 pares os hashes coincidiram. Em dois,
o arquivo do Git tem uma quebra de linha adicional ao final. Em outros dois,
o Git conserva `begin;` e `commit;` externos, e o texto entre eles é idêntico
ao registrado. O nome remoto do aceite de termos inclui o timestamp antigo;
o novo caminho reproduz esse nome integralmente.

| Versão anterior no Git | Versão registrada | Migration | Comparação do SQL |
| --- | --- | --- | --- |
| `20261104225029` | `20261104233510` | `restringir_listagem_storage_ao_proprietario` | LF final |
| `20261105203938` | `20261105212108` | `corrigir_aceite_termos_profile_ausente` | Transação externa |
| `20261106175534` | `20261106200355` | `corrigir_busca_autores_catalogo` | Transação externa |
| `20261106212539` | `20261106221258` | `sincronizar_progresso_leitura_dispositivos` | Idêntico |
| `20261106222208` | `20261107055640` | `permitir_autor_gerenciar_comentarios` | LF final |
| `20261107163026` | `20261107170416` | `adicionar_filtro_tag_catalogo` | Idêntico |
| `20261107171221` | `20261107175409` | `adicionar_nota_minima_catalogo` | Idêntico |
| `20261107180400` | `20261107185119` | `adicionar_exclusao_tag_catalogo` | Idêntico |
| `20261107190827` | `20261107202307` | `adicionar_exclusao_genero_catalogo` | Idêntico |
| `20261107223400` | `20261107231314` | `infraestrutura_capitulos_ilustrados` | Idêntico |
| `20261107235846` | `20261108003354` | `reservar_capacidade_capitulos_ilustrados` | Idêntico |
| `20261108004015` | `20261108012152` | `autorizar_prevalidacao_paginas_ilustradas` | Idêntico |
| `20261108012821` | `20261108020412` | `registrar_tentativas_upload_ilustrado` | Idêntico |
| `20261108085709` | `20261108115142` | `recibos_privados_paginas_ilustradas` | Idêntico |
| `20261108132533` | `20261108141326` | `infraestrutura_agendamento_capitulos` | Idêntico |
| `20261108142104` | `20261108164405` | `executor_privado_agendamento_capitulos` | Idêntico |
| `20261108164909` | `20261108181547` | `diario_publicacao_capitulos_agendados` | Idêntico |
| `20261108182554` | `20261108193708` | `outbox_cache_capitulos_agendados` | Idêntico |
| `20261108195558` | `20261108204712` | `revisao_transacional_projecao_publica` | Idêntico |
| `20261108205505` | `20261109004343` | `barreira_revisao_cache_publico` | Idêntico |
| `20261109040303` | `20261109045755` | `snapshot_leve_publico_obra` | Idêntico |
| `20261109171652` | `20261109181815` | `runner_privado_agendamento_capitulos` | Idêntico |
| `20261109183045` | `20261109193612` | `entrada_sql_restrita_runner_capitulos` | Idêntico |
| `20261109194305` | `20261109214547` | `observabilidade_privada_runner_capitulos` | Idêntico |
| `20261109215507` | `20261109231625` | `protecao_capacidade_outbox_capitulos` | Idêntico |
| `20261110014753` | `20261110023201` | `snapshot_monitor_externo_agendamento` | Idêntico |
| `20261110041125` | `20261110061248` | `orcamento_transacional_notificacoes_agendadas` | Idêntico |
| `20261110062820` | `20261110111504` | `monitorar_capacidade_agendamento` | Idêntico |
| `20261110121818` | `20261110132002` | `limitar_reescritas_solicitacao_cache_capitulos` | Idêntico |
| `20261110135028` | `20261110150427` | `orcamento_transacional_reivindicacoes_outbox` | Idêntico |
| `20261110152413` | `20261110162413` | `recuperacao_privada_reivindicacoes_outbox` | Idêntico |
| `20261110163339` | `20261110173610` | `integrar_consumidor_operacoes_cache` | Idêntico |
| `20261110174613` | `20261110182951` | `observar_operacoes_cache_privadas` | Idêntico |
| `20261111155517` | `20261111174800` | `identidade_login_monitor_agendamento` | Idêntico |
| `20261113002736` | `20261113051159` | `adicionar_status_editorial_obras` | Idêntico |
| `20261113013249` | `20261113051232` | `proteger_versao_status_editorial` | Idêntico |
| `20261113053819` | `20261113063207` | `contar_palavras_catalogo` | Idêntico |
| `20261116230000` | `20261117131102` | `listar_ranking_geral` | Idêntico |
| `20261117084500` | `20261117131111` | `ranking_geral_nucleo_paginado` | Idêntico |

## A única migration pendente após os dois alinhamentos

`20261112013209_evitar_reescrita_saldo_notificacoes_vazio.sql` introduz um
retorno antecipado na função privada de admissão de notificações quando o
plano validado tem zero linhas. O timestamp está ausente no histórico remoto.
Uma leitura de catálogo confirmou que a função instalada ainda contém a
implementação anterior e o runner estava desligado na conferência.

A migration mantém o nome, a posição original e os testes. Marcar essa versão
como aplicada faria o histórico afirmar que existe em produção uma alteração
que falta na função. A aplicação do PH-1 exige decisão própria do responsável.

## Ensaio descartável

1. Foram reconstituídas as 95 versões registradas e a normalização de ACL
   exclusiva da CI em PostgreSQL local. Nenhum dado de leitor foi copiado.
2. Foram comparados os hashes de definição e as propriedades selecionadas de
   14 objetos contra o catálogo de produção. Coincidiram as sete assinaturas
   de catálogo, as duas funções do aceite, a função de admissão antes do PH-1
   e as quatro políticas de Storage/comentários. Para funções foram conferidos
   proprietário, modo de segurança e execução por `anon` e `authenticated`.
   Para políticas foram conferidos expressão, operação, modo e papéis.
3. O Supabase CLI 2.116.0 listou 95 pares e uma versão local. O plano padrão
   de `db push --dry-run` parou porque o PH-1 antecede a última versão
   registrada. A simulação local com `--include-all` listou exclusivamente
   o PH-1, com zero seeds e zero mudanças de papéis.
4. O SQL exato do PH-1 foi aplicado somente no descartável. Entre os 14 objetos
   observados, apenas a definição da função de admissão mudou. Seu proprietário,
   modo de segurança e privilégios conferidos permaneceram iguais. Os 18 testes
   de débito zero passaram.
5. Um segundo banco descartável, com o usuário de fixtures da suíte e locale
   UTF-8, recebeu os 96 arquivos do Git em ordem a partir de uma base limpa.
   Os 48 arquivos pgTAP passaram, com 1.395 asserções, zero falhas e zero skips.
   O catálogo de produção foi comparado no primeiro ensaio, separado dessa
   execução com privilégios de preparação de fixtures.

## Antes de um futuro push

Confira a listagem da branch integrada contra o ambiente pretendido.
Bancos já criados com os timestamps antigos podem apresentar um histórico
diferente. Preserve dados e evidências ao decidir como reconciliar cada um.
Em produção, a pendência identificada é o PH-1. A próxima decisão é aplicar
essa mudança em uma janela autorizada ou mantê-la pendente. O alinhamento
dos nomes por si só não autoriza um push.
