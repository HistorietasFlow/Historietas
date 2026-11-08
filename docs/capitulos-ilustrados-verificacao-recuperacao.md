# Capítulos ilustrados — Fase 2C2d

## Conclusão e escopo

Base: `main` após #2226 (`4f5bb5d6`). O diagnóstico local `392ee0f2` continua
preservado em sua branch, sem cherry-pick e sem reinterpretá-lo como suíte verde.

**É seguro implementar a conferência pontual somente leitura. A recuperação com
liberação de capacidade e limpeza física exige garantias adicionais.**
Não há upload, publicação, finalização do manifesto, assinador em lote, leitor
ilustrado, executor de limpeza ou consumidor do verificador habilitado.
Nenhuma migration nova é necessária para esta parte independente.

## O que foi conferido

- 2A: decoder binário real, limites, bytes canônicos e hash no servidor.
- 2B/2C2a: quota compartilhada pelo mesmo advisory lock
  `historietas:storage:cota:v1`; MAX por caminho; tentativa sem cascatas e sem
  liberação automática após início, expiração, logout ou resposta ambígua.
- 2C1: recepção/prevalidação sem Storage; não é comprovante reutilizável.
- 2C2c: recibo privado de observação, sem grants para clientes/service role;
  gate transacional sempre fechado, proteção no assinador legado e exclusão de
  conta bloqueada pelo ledger. Essas regras não foram modificadas.

## Conferência implementada

`lib/server/capitulos-ilustrados/conferir-pagina-armazenada.ts` recebe somente
um recibo do repositório PRIVADO e dependências internas de leitura/decoder.
Não existe rota HTTP, leitor privilegiado de recibos ou credencial nova no módulo.
Um futuro executor ainda terá de fornecer um leitor autorizado confiável da
Storage API, sem cache/transformações e que respeite AbortSignal. O contrato
não pode ser preenchido com body, headers, hash ou metadata do navegador.

1. Copia/valida o recibo e seu vínculo identidade/capítulo/reserva/caminho.
2. Confere `id`, `version`, bucket, nome, tamanho e MIME pela API de info.
3. Baixa o objeto original em stream, com limite pelo tamanho esperado/2 MiB,
   limite de chunks, duas conferências simultâneas e prazo de dez segundos.
4. Calcula SHA-256 dos bytes BAIXADOS; usa o validador 2A para conferir o binário,
   formato e dimensões. ETag não substitui SHA-256. O hash de um segundo re-encode
   JPEG/WebP não substitui o hash do objeto lido.
5. Consulta info novamente e rejeita identidade/versão/metadata divergentes.

O resultado não contém bytes, caminhos, URLs ou credenciais. Mesmo no match,
`evidencia=observacao_sem_terminalidade`, com terminalidade, publicação, limpeza
e liberação de quota explicitamente falsas. Não persiste uma nova autoridade,
renova leases, chama finalização ou modifica recibos/ledger. Uma nova observação
é idempotente para a mesma situação; após mudanças, deve ser lida novamente.

Esse resultado comprova correspondência da sequência recebida da fonte de
leitura confiável com o recibo, sob a identidade/versão observadas nas consultas.
**Não é snapshot transacional entre Postgres e backend, autorização atual,
prova da origem do writer nem garantia de imutabilidade futura.**
Se o decoder/re-encode 2A falhar ou ultrapassar seus limites nessa segunda
validação, a observação é inconclusiva, não prova de corrupção do objeto.

## Limites reais e fontes

O ambiente local usa CLI 2.116.0 / Storage API **v1.65.1**. Produção não foi
consultada ou alterada; não extrapolar sua versão a partir do ambiente local.

- Na [v1.65.1, uploader.ts](https://github.com/supabase/storage/blob/v1.65.1/src/storage/uploader.ts),
  admissão/RLS e transferência física não são uma única operação revogável.
  O diagnóstico 392ee0f2 já mostrou conclusão após revogação com corpo parcial.
- Na [v1.84.32, uploader.ts](https://github.com/supabase/storage/blob/v1.84.32/src/storage/uploader.ts),
  a autorização é revalidada no commit dos metadados. Isso acontece DEPOIS de
  `backend.uploadObject`; não demonstra cancelamento de bytes já aceitos.
  Essa leitura de fonte não é teste da versão gerenciada nem proposta de upgrade.
- [Info](https://github.com/supabase/storage/blob/v1.65.1/src/http/routes/object/getObjectInfo.ts)
  identifica o objeto/versionamento observado;
  [GET](https://github.com/supabase/storage/blob/v1.65.1/src/http/routes/object/getObject.ts)
  resolve a versão via metadados e lê o backend. Não lista todos os writers
  aceitos, buffers, retries ou versões físicas ainda sem metadados.
- [deleteObjects](https://github.com/supabase/storage/blob/v1.65.1/src/storage/object.ts)
  seleciona os objetos/versionamentos existentes nos metadados para removê-los
  no backend. Um caminho não encontrado não comprova que inexistam outras
  versões físicas/IO pendente. Não inventar uma API de terminalidade.
- A [documentação do schema](https://supabase.com/docs/guides/storage/schema/design)
  distingue metadados dos bytes; operações físicas são exclusivamente pela API.
  [Concorrência e upsert](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
  não constituem prova de quiescência de todas as operações de uma tentativa.

## Reconciliação proposta — ainda sem executor

- Reutilizar tentativa/recibo privados como fonte durável, não cascatas nem estado
  do processo. Conferir bytes sem lock de banco atravessando HTTP/decoder.
- Em etapa futura, serializar o registro de observações por tentativa/objeto/versão
  com os locks existentes, mantendo tombstones e descartando resultados obsoletos.
  A observação não altera autorização nem a capacidade comprometida.
  O recibo 2C2c é imutável/idempotente por tentativa: uma versão divergente não
  pode sobrescrevê-lo. Um journal adicional, se necessário, exige fase/migration
  própria; o verificador atual não persiste esse histórico.
- Resultado ambíguo, objeto não observado, falha de leitura, lease expirado,
  cancelamento, logout e cascata mantêm a tentativa incerta/capacidade retida.
  Não reenviar automaticamente uma gravação cujo resultado é desconhecido.
- Publicação exigiria nova transação: sessão real, propriedade, versão atual,
  ausência de cancelamento/exclusão/limpeza e evidência física válida. O gate
  existente continua fechado; a conferência não é uma capacidade para outro commit.
- Limpeza exige ausência de manifestos, recibos válidos e operações não encerradas,
  além de prova independente de terminalidade de TODOS os writers possíveis.
  Um tombstone irrevogável deve impedir novos writers/referências/reuso do caminho;
  repetir as verificações antes de remover pela Storage API, nunca SQL em
  `storage.objects`. Resposta perdida da remoção também exige reconciliação.

Não liberam capacidade: HTTP 200 isolado de um writer, cancelamento de fetch,
timeout, sessão removida, lease vencido, GET/HEAD/list vazio ou duas leituras
iguais. O ledger atual deve continuar retendo os compromissos.

Para terminar com garantia estrita, falta um protocolo verificável do writer/
backend que identifique a operação, feche novas admissões/replays e ateste que
nenhum IO aceito pode concluir depois. Só marcar estado no Postgres não o fornece.
O MAX por caminho do ledger evita dupla contagem lógica, mas não é inventário
de todas as versões físicas órfãs do backend. Replays/duplicações sem fence não
podem ser habilitados sob a alegação de que essa agregação prova a quota física.
A alternativa conservadora atual é quarentena privada com capacidade retida e
sem limpeza/liberação automática; não é um upload pronto para operar, pois pode
esgotar quotas. Uma promoção futura para destino imutável também requer protocolo
próprio de cópia, identidade/versão e recuperação — não resolve a janela sozinha.

## Testes e alcance das evidências

- Unitários executáveis com decoder real: PNG/JPEG/WebP, hash/MIME/dimensões,
  ID/versão/caminho, limites, ausência, stream interrompido, cancelamento,
  concorrência limitada, troca/exclusão entre leituras e retry sem escrita.
- Storage/Data API locais: recibo real privado, metadata igual com bytes errados,
  resposta descartada após gravação, escritor adiado, troca de versão, logout,
  expiração/cascata, preservação de quota e gate fechado. Fixtures administrativas
  isoladas não são o caminho de upload da aplicação.
- A barreira do writer adiado é anterior à admissão da requisição; NÃO constitui
  nova prova de fencing de IO já aceito. A exclusão entre leituras é simulada no
  teste unitário; não se habilita um cleaner que apague objeto referenciado.
- O teardown aguarda todos os writers próprios do teste, retira somente suas
  referências e usa Storage API para remover suas fixtures. Não é worker de
  recuperação de operações incertas de terceiros.
- Antes de ativar qualquer writer: reproduzir no serviço/backend alvo uma corrida
  com corpo parcial já aceito; revogar sessão/lease, cancelar e excluir em cascata;
  só encerrar/limpar/liberar após evidência backend de terminalidade. Injetar falhas
  antes/depois do efeito, perda de resposta, replay e falha do reconciliador.
  Se o backend não fornecer essa evidência, o critério continua NÃO atendido.

Não há nova UI para Playwright/axe nesta parte. Os fluxos e suites existentes
continuam sendo regressões, não prova de segurança de um writer inexistente.
