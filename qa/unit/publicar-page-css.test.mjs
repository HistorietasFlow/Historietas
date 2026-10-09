import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL("../../app/publicar/lib/publicar-page-css.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);

test("publicarPageCss preserva o CSS global de Publicar", () => {
  assert.match(css, /export const publicarPageCss = `/);
  assert.match(css, /--historietas-publicar-bg-page/);
  assert.match(css, /body,\s*main/);
  assert.match(css, /nav a\[href="\/publicar"\]/);
  assert.match(css, /\.historietas-bottom-nav-icon/);
  assert.match(css, /input::placeholder/);
  assert.match(css, /input,\s*textarea,\s*select/);
});

test("Publicar mantem os consumidores e as fronteiras fora do CSS extraido", () => {
  assert.match(
    pagina,
    /import \{ publicarPageCss \} from "\.\/lib\/publicar-page-css";/,
  );
  assert.doesNotMatch(pagina, /const publicarPageCss = `/);

  const consumidores = pagina.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{publicarPageCss\}`\}<\/style>/g,
  );
  assert.equal(consumidores?.length, 2);
  assert.doesNotMatch(
    pagina,
    /\$\{publicarPageCss\}\$\{historietasThemeCss\}/,
  );

  assert.match(pagina, /const safeTextStyle: CSSProperties/);
  assert.match(pagina, /const isDesktop = usePublicarDesktopMode\(\);/);
  assert.match(pagina, /supabase\.storage/);
  assert.match(pagina, /async function salvarObra\(/);
});
