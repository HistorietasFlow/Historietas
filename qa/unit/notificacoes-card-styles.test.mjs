import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const estilos = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-card-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const feedCard = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-feed-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const feed = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-feed.tsx",
    import.meta.url,
  ),
  "utf8",
);

const exportsEsperados = [
  "listStyle",
  "cardStyle",
  "readCardStyle",
  "communityCardStyle",
  "readCommunityCardStyle",
  "cardHeaderStyle",
  "notificationIconStyle",
  "unreadNotificationIconStyle",
  "readNotificationIconStyle",
  "communityNotificationIconStyle",
  "cardHeaderTextStyle",
  "notificationTitleStyle",
  "notificationTitleRowStyle",
  "cardMenuWrapperStyle",
  "cardMenuButtonStyle",
  "communityDateTextStyle",
  "notificationMessageStyle",
  "metaGridStyle",
  "communityMetaGridStyle",
  "metaBoxStyle",
  "metaLabelStyle",
  "notificationAuthorInlineLinkStyle",
  "metaValueStyle",
  "communityCommentBoxStyle",
  "communityUpdateBoxStyle",
  "communityInlineStatusStyle",
  "communityInlineStatusDotStyle",
  "communityCommentTextStyle",
  "followerRequestActionsStyle",
  "followerRequestAcceptButtonStyle",
  "followerRequestRejectButtonStyle",
  "followerRequestAcceptButtonDisabledStyle",
  "followerRequestRejectButtonDisabledStyle",
  "desktopListStyle",
  "desktopCardStyle",
  "desktopReadCardStyle",
  "desktopCommunityCardStyle",
  "desktopReadCommunityCardStyle",
  "desktopMetaGridStyle",
  "desktopCommunityMetaGridStyle",
];

test("cards de Notificações exportam estilos e variantes literais", () => {
  assert.match(
    estilos,
    /import \{ safeTextStyle \} from "\.\/notificacoes-shell-styles";/,
  );

  for (const nome of exportsEsperados) {
    assert.match(estilos, new RegExp(`export const ${nome}: CSSProperties`));
  }

  for (const contrato of [
    "...cardStyle,",
    "...communityCardStyle,",
    "...readCommunityCardStyle,",
    "...notificationIconStyle,",
    "...metaGridStyle,",
    "...safeTextStyle,",
    'gridTemplateColumns: "repeat(3, minmax(0, 1fr))"',
    'borderRadius: "20px"',
    'background: "rgba(255,255,255,0.025)"',
  ]) {
    assert.ok(estilos.includes(contrato), `contrato ausente: ${contrato}`);
  }
});

test("componente do feed delega os estilos de card sem definições duplicadas", () => {
  assert.match(
    feedCard,
    /from "\.\.\/lib\/notificacoes-card-styles";/,
  );
  assert.match(pagina, /import NotificacoesFeed/);

  for (const nome of exportsEsperados) {
    assert.doesNotMatch(
      feedCard,
      new RegExp(`const ${nome}: CSSProperties =`),
    );
  }
});

test("módulo de cards não contém efeitos, Supabase ou storage", () => {
  for (const proibido of ["useEffect", "useState", "supabase", "localStorage", "window", "document", "<"]) {
    assert.ok(!estilos.includes(proibido), `referência indevida: ${proibido}`);
  }
});

test("feed e cartão preservam a nova fronteira visual e seus contratos", () => {
  for (const contrato of [
    'import NotificacoesEmptyState from "./notificacoes-empty-state"',
    'import NotificacoesFeedCard from "./notificacoes-feed-card"',
    'mensagem="Nenhuma notificação"',
    'mensagem="Nada encontrado"',
    'aria-label="Lista de notificações"',
    "notificacoesFiltradas.map",
    "prepararNotificacaoTexto(notificacaoOriginal)",
    "key={notificacao.id}",
    "totalNotificacoes={notificacoesFiltradas.length}",
  ]) {
    assert.ok(feed.includes(contrato), `contrato ausente: ${contrato}`);
  }

  for (const contrato of [
    '"use client"',
    "criarAvatarNotificacaoStyle",
    "desktopReadCommunityCardStyle",
    "desktopCommunityCardStyle",
    "desktopReadCardStyle",
    "desktopCardStyle",
    "Abrir ações de ${tituloExibicao}",
    "Aceitando...",
    "Recusando...",
    "onAlternarMenuNotificacao(notificacao.id)",
    "onResponderSolicitacaoSeguidor(notificacao, true)",
    "onResponderSolicitacaoSeguidor(notificacao, false)",
  ]) {
    assert.ok(feedCard.includes(contrato), `contrato ausente: ${contrato}`);
  }

  for (const proibido of ["supabase", "localStorage", "useEffect", "useState"]) {
    assert.ok(!feedCard.includes(proibido), `referência indevida: ${proibido}`);
  }
});
