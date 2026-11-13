# Etapa seguinte — quota e transporte privado sem ativacao

Branch filha da #2292. A migration acrescenta ledger de retencoes privado
sem produtor, RLS e REVOKE, inclui o quarto bucket na contagem global e por
usuario e compartilha o teto de 60 capas publicas/privadas. O helper antigo
continua a recusar admissao ao quarto bucket. Nao cria bucket, grant de escrita,
route handler ou upload.

O adaptador `lib/server/capas/storage-privado.ts` usa o download real do SDK
Storage apenas para fontes que um futuro autorizador devera comprovar. A rota
permanece fixamente 503 e o upload retorna `disabled`. O contrato SQL da #2290
permite jpg/png/webp; GIF foi recusado no protocolo preparatorio.

**Ainda nao ha garantia comprovada de quota fisica:** faltam produtor seguro
da retencao, fence no commit do Storage, contabilizacao sob transferencias
incertas/concorrentes inclusive service_role, validacao do backend gerenciado
e integracao com a exclusao de conta. As mudancas desta PR nao liberam a
entrada do fluxo, nao limpam dados e nao alteram a producao.

Validar via CI/pgtap no Supabase descartavel. Nenhuma migration remota.
