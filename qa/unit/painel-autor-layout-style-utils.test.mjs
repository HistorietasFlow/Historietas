import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../../app/painel-autor/lib/painel-autor-layout-style-utils.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/painel-autor/page.tsx", import.meta.url), "utf8");

test("layout styles preservam propriedades críticas", () => {
  for (const valor of ["min(340px, 48vh)", "min(620px, 68vh)", "minHeight: \"100vh\"", "min(860px, calc(100% - 24px))", "fontFamily: \"Inter, Poppins, Manrope, Arial, Helvetica, sans-serif\""]) assert.match(source, new RegExp(valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("Painel do Autor delega somente os estilos básicos de layout", () => {
  assert.match(pagina, /from "\.\/lib\/painel-autor-layout-style-utils";/);
  for (const nome of ["mobileTopWaterFadeStyle", "desktopTopWaterFadeStyle", "pageStyle", "containerStyle", "topStyle"]) {
    assert.doesNotMatch(pagina, new RegExp(`const ${nome}: CSSProperties`));
    assert.match(pagina, new RegExp(`\\b${nome}\\b`));
  }
  assert.match(pagina, /const desktopContainerStyle: CSSProperties = \{\s*\.\.\.containerStyle,/);
  assert.match(pagina, /useHistorietasTheme\(pageStyle\)/);
  assert.match(pagina, /const themeGradient =/);
  assert.match(
    pagina,
    /safeTextStyle,\s*\} from "\.\/lib\/painel-autor-desktop-header-style-utils";/,
  );
  assert.doesNotMatch(pagina, /const safeTextStyle: CSSProperties = \{/);
});
