import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const painelOrdenacao = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-sorting-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const controles = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-top-controls.tsx",
    import.meta.url,
  ),
  "utf8",
);
const acoes = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-actions-sheet.tsx",
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
const feedCard = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-feed-card.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("hook preserva o modo desktop imediato e os dois modelos de listener", () => {
  assert.match(hook, /export function useNotificacoesDesktopMode\(\)/);
  assert.match(hook, /const \[isDesktop, setIsDesktop\] = useState\(false\);/);
  assert.match(
    hook,
    /const mediaQuery = window\.matchMedia\("\(min-width: 1024px\)"\);/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktop = \(\) => \{\s*setIsDesktop\(mediaQuery\.matches\);\s*\};/,
  );
  assert.match(
    hook,
    /setIsDesktop\(mediaQuery\.matches\);[\s\S]*?\};\s*atualizarModoDesktop\(\);[\s\S]*?if \(typeof mediaQuery\.addEventListener === "function"\)/,
  );
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(
    hook,
    /mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(hook, /mediaQuery\.removeListener\(atualizarModoDesktop\);/);
  assert.doesNotMatch(hook, /setTimeout/);
  assert.match(hook, /return isDesktop;/);
});

test("pagina delega somente o lifecycle e preserva os consumidores visuais", () => {
  assert.match(
    pagina,
    /import \{ useNotificacoesDesktopMode \} from "\.\/hooks\/use-notificacoes-desktop-mode";/,
  );
  assert.match(
    pagina,
    /const isDesktop = useNotificacoesDesktopMode\(\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(pagina, /window\.matchMedia/);
  assert.match(
    pagina,
    /<NotificacoesSortingSheet[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.match(
    painelOrdenacao,
    /isDesktop\s*\?\s*desktopNotificationSortingSheetStyle\s*:\s*notificationSortingSheetStyle/,
  );
  assert.match(
    pagina,
    /<NotificacoesTopControls[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.match(
    pagina,
    /<NotificacoesActionsSheet[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.match(
    pagina,
    /<NotificacoesFeed[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.match(controles, /if \(isDesktop\)/);
  assert.match(
    acoes,
    /isDesktop\s*\?\s*desktopNotificationActionsSheetStyle\s*:\s*notificationActionsSheetStyle/,
  );
  assert.match(feed, /isDesktop \? desktopListStyle : listStyle/);
  assert.match(feedCard, /isDesktop[\s\S]*?desktopReadCommunityCardStyle/);
});
