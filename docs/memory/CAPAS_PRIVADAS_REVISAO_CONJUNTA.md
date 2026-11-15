# Revisão conjunta das capas privadas — #2290 / #2291 / #2289

Data: 13/11/2026. Base: `main` `98be8c31`. Branch:
`integration/private-covers-2290-2291-2289`.

## Composição e resultado

- **#2290, PR 1:** migration SQL transacional com versão `BIGINT`, geração
  UUID, CAS, recibos e tombstones; não aplicada remotamente.
- **#2291, PR 2:** rota HTTP `/api/capas-obras/` com gate fixo desligado,
  callbacks internos e proteção de cache e otimizador; não serve bytes.
- **#2289, PR 3:** referência privada opaca e adaptadores preparados,
  upload sempre `disabled`, quota de quatro buckets apenas como modelo.
- **Correção cruzada:** o `expectedVersion` da PR 3 era validado como UUID
  enquanto a PR 1 usa `BIGINT`. Agora aceita somente string decimal positiva
  canônica até 9223372036854775807, com regressões para limites e rejeições.

As PRs originais continuam abertas e em draft. A composição não é merge na
`main`, não autoriza produção nem libera o fluxo 18+.

## Bloqueios restantes

1. Não existe registro/validação seguros dos bytes e referências privadas
   na fronteira da conclusão física; reserva e recibo HTTP ainda não têm
   adaptadores reais para as RPCs e o Storage.
2. O contador SQL e os fluxos de exclusão ainda assumem três buckets;
   `quota.ts` não implementa locking, retenção de IO incerto ou fencing.
3. A rota HTTP não usa o contrato SQL nem verifica autorização primária
   efetiva de entrega; seu gate e o upload permanecem fixamente desativados.
4. O legado de capas públicas não tem revogação comprovada de URLs/cache.
   Manter transição 18+ bloqueada e uploads ilustrados suspensos.
5. A nova composição exige CI e testes locais de integração combinada;
   os testes de cada PR isolada não certificam a combinação. Não alterar
   scripts para ocultar falhas, ativar serviços ou usar banco remoto.

## Próxima implementação

Separar uma fase dedicada para conectar **somente** referências privadas
novas e recibos a uma admissão/commit de Storage com quotas efetivas,
incluindo os quatro buckets, sem expor o endpoint ou ativar upload.
Depois, validar Auth/Data API/Storage reais com duas sessões e retomadas,
mais cache/otimizador e consultas em produção apenas se autorizadas.

Não executar migrations, uploads, remoções de objetos, merges nem deploys
manuais. Esta PR é um ensaio de compatibilidade e qualidade.
