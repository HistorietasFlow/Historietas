import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const portal = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-overlay-portal.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("portal preserva o lifecycle de montagem adiada", () => {
  assert.match(portal, /"use client";/);
  assert.match(portal, /children: ReactNode/);
  assert.match(portal, /const \[montado, setMontado\] = useState\(false\);/);
  assert.match(
    portal,
    /useEffect\(\(\) => \{[\s\S]*?window\.setTimeout\(\(\) => \{[\s\S]*?setMontado\(true\);[\s\S]*?\}, 0\);[\s\S]*?\}, \[\]\);/,
  );
  assert.match(portal, /window\.clearTimeout\(montarPortalTimer\);/);
  assert.match(
    portal,
    /if \(!montado \|\| typeof document === "undefined"\) \{\s*return null;\s*\}/,
  );
  assert.match(portal, /createPortal\(children, document\.body\)/);
});

test("pagina delega somente o portal e preserva os dois overlays", () => {
  assert.match(
    pagina,
    /import NotificacoesOverlayPortal from "\.\/components\/notificacoes-overlay-portal";/,
  );
  assert.equal(
    (pagina.match(/<NotificacoesOverlayPortal>/g) || []).length,
    2,
  );
  assert.doesNotMatch(pagina, /function NotificacoesOverlayPortal/);
  assert.doesNotMatch(pagina, /from "react-dom"/);
  assert.doesNotMatch(pagina, /ReactNode/);
});
