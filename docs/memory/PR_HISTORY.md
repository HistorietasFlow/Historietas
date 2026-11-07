# Histórico resumido de PRs relevantes

Este arquivo não substitui o GitHub. Serve como índice de decisões e marcos.

## Ferramentas e infraestrutura — novembro de 2026

- #2132 — Sentry
- #2134 — Dependabot
- #2143 — pgTAP, baseline de RLS e validação de GRANT/REVOKE
- #2144 — endurecimento da configuração Playwright
- #2146 — Lighthouse CI baseline
- #2147 — Vercel Speed Insights

Todas as PRs acima estavam merged em 2026-11-03.

## Refatoração recente de leitura

Sequência verificada de PRs merged:

- #2126 — identidade da rota
- #2127 — dados carregados
- #2128 — sessão e preferências
- #2129 — métricas/interações
- #2130 — estado de comentários
- #2131 — estado de overlays

## Como manter este histórico

Registrar somente marcos que ajudem um agente futuro a entender arquitetura, decisões ou estado de uma iniciativa. Não transformar este arquivo em cópia de todas as PRs.

## Ciclo Explorar e leitura — novembro de 2026

Marcos integrados à `main`:

- #2191 — recuperação de perfil ao aceitar termos.
- #2192–#2194 — filtros/URL, busca full-text e tratamento de falha/retry no Explorar.
- #2195–#2196 — coleções pessoais paginadas e acessibilidade dos filtros avançados.
- #2197–#2198 — paginação e busca de autores pelo nome atual, alinhamento dos gêneros.
- #2199–#2200 — ordem canônica dos capítulos na retomada da Home, Biblioteca e Leitor.
- #2201 — concorrência de progresso entre dispositivos (RPC, timestamps e tombstones).

As migrations pertinentes de #2197 e #2201 foram aplicadas em produção separadamente do merge; verificar o banco antes de assumir o estado de qualquer outra migration.
