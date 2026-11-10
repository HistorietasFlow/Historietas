# Memory Bank do Historietas

Este diretório é a memória operacional do projeto Historietas.

## Como usar

Antes de iniciar uma tarefa relevante, leia nesta ordem:

1. `PROJECT_CONTEXT.md`
2. `CURRENT_STATUS.md`
3. `DECISIONS.md`
4. `ARCHITECTURE.md`
5. `PROBLEMS_AND_SOLUTIONS.md`
6. `PR_HISTORY.md` quando o histórico de mudanças importar.

O arquivo `/AGENTS.md` continua sendo a fonte de regras obrigatórias de execução e revisão.

## Regra de manutenção

Atualize o Memory Bank quando uma mudança alterar de forma duradoura:

- arquitetura;
- regras de negócio;
- segurança, autenticação, RLS ou permissões;
- processo de CI/CD;
- dependências ou integrações importantes;
- estado de uma refatoração;
- problema recorrente e sua solução;
- decisão que agentes futuros não devem rediscutir sem motivo.

Não registre segredos, tokens, senhas, chaves privadas, dados pessoais ou valores que não precisem fazer parte da engenharia do projeto.

## Notas específicas de QA

- [Agendamento/Diário e lotes da outbox](QA_AGENDAMENTO_OUTBOX.md): validar o evento alvo sem presumir fila vazia, sem apagar pendências e sem interpretar HTTP 202 como ACK.

## Fontes de verdade

O código, migrations, configurações e estado atual do GitHub têm prioridade sobre este Memory Bank quando houver divergência. Em caso de conflito, verifique o repositório e corrija a documentação.
