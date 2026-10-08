import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-overlay-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);

test("hook preserva o lifecycle de lock e restauração do overlay", () => {
  assert.match(
    hook,
    /export function useNotificacoesOverlayBodyLock\(menuOverlayAberto: boolean\)/,
  );
  assert.match(
    hook,
    /if \(typeof document === "undefined"\) \{\s*return;\s*\}/,
  );
  assert.match(hook, /const raiz = document\.documentElement;/);
  assert.match(hook, /const corpo = document\.body;/);
  assert.match(
    hook,
    /if \(!menuOverlayAberto\) \{\s*raiz\.removeAttribute\("data-historietas-notificacoes-overlay-aberto"\);\s*corpo\.removeAttribute\("data-historietas-notificacoes-overlay-aberto"\);\s*return;\s*\}/,
  );
  assert.match(hook, /const overflowAnterior = corpo\.style\.overflow;/);
  assert.match(hook, /const htmlOverflowAnterior = raiz\.style\.overflow;/);
  assert.match(
    hook,
    /raiz\.setAttribute\(\s*"data-historietas-notificacoes-overlay-aberto",\s*"true"\s*\);/,
  );
  assert.match(
    hook,
    /corpo\.setAttribute\(\s*"data-historietas-notificacoes-overlay-aberto",\s*"true"\s*\);/,
  );
  assert.match(hook, /raiz\.style\.overflow = "hidden";/);
  assert.match(hook, /corpo\.style\.overflow = "hidden";/);
  assert.match(
    hook,
    /return \(\) => \{\s*raiz\.removeAttribute\("data-historietas-notificacoes-overlay-aberto"\);\s*corpo\.removeAttribute\("data-historietas-notificacoes-overlay-aberto"\);\s*raiz\.style\.overflow = htmlOverflowAnterior;\s*corpo\.style\.overflow = overflowAnterior;\s*\};/,
  );
  assert.match(hook, /\}, \[menuOverlayAberto\]\);/);
  assert.doesNotMatch(hook, /removeProperty\("overflow"\)/);
});

test("página delega somente o lifecycle e preserva derivação, CSS e overlays", () => {
  assert.match(
    pagina,
    /import \{ useNotificacoesOverlayBodyLock \} from "\.\/hooks\/use-notificacoes-overlay-body-lock";/,
  );
  assert.match(
    pagina,
    /const menuOverlayAberto = Boolean\(\s*mostrarPainelOrdenacao \|\| notificacaoMenuAberta\s*\);\s*useNotificacoesOverlayBodyLock\(menuOverlayAberto\);/,
  );
  assert.doesNotMatch(
    pagina,
    /useEffect\(\(\) => \{[\s\S]*?const raiz = document\.documentElement;[\s\S]*?\}, \[menuOverlayAberto\]\);/,
  );
  assert.equal(
    (pagina.match(/data-historietas-notificacoes-overlay="true"/g) || []).length,
    2,
  );
  assert.match(
    css,
    /html\[data-historietas-notificacoes-overlay-aberto="true"\] body/,
  );
});
