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

test("página delega os estilos de card sem definições duplicadas", () => {
  assert.match(
    pagina,
    /from "\.\/lib\/notificacoes-card-styles";/,
  );

  for (const nome of exportsEsperados) {
    assert.doesNotMatch(
      pagina,
      new RegExp(`const ${nome}: CSSProperties =`),
    );
  }
});

test("módulo de cards não contém efeitos, Supabase ou storage", () => {
  for (const proibido of ["useEffect", "useState", "supabase", "localStorage", "window", "document", "<"]) {
    assert.ok(!estilos.includes(proibido), `referência indevida: ${proibido}`);
  }
});
