# Refatoração incremental — Home

## Fase 808 — Linha de carrossel da Home

- Extraiu `HomeCarouselRow` para `components/HomeCarouselRow.tsx`.
- Preservou a escolha de estilos por variante e viewport, o limiar de mais de três itens e os controles de rolagem desktop.
- Preservou o reset imediato, `requestAnimationFrame`, timer de 90 ms e cleanup do scroll.
- Manteve na Home os 18 consumidores, cards, seções, hero, recomendações, dados, autenticação, busca, favoritos e loaders.
