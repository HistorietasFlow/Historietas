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
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 17);
});
