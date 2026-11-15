import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const modulo = readFileSync(
  new URL("../../app/ajuda/lib/ajuda-page-css.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("ajudaPageCss preserva o CSS da Ajuda com foco do retry e contraste do envio", () => {
  assert.match(modulo, /export const ajudaPageCss = `/);
  assert.match(modulo, /--ajuda-card:/);
  assert.match(modulo, /ajuda-refresh-tickets-button:focus-visible/);
  assert.match(modulo, /ajuda-submit-ticket-button \{[^}]*color: #000000;/);
  assert.match(modulo, /--ajuda-border:/);
  assert.match(modulo, /\[data-historietas-ajuda-root="true"\]/);
  assert.match(modulo, /@media \(prefers-reduced-motion: reduce\)/);
  assert.equal(
    createHash("sha256")
      .update(modulo.replace(/\r\n/g, "\n"))
      .digest("hex"),
    "01f4ef0d2d7b1a344feea991a5b248218e20fda537242caaa04ba4c5c2f36d70",
  );
});

test("a página compõe o CSS global da Ajuda sem redefini-lo", () => {
  assert.match(
    pagina,
    /import \{\s*ajudaPageCss,\s*\} from "\.\/lib\/ajuda-page-css";/,
  );
  assert.doesNotMatch(pagina, /const ajudaPageCss = `/);
  assert.match(
    pagina,
    /<style>\{`\$\{historietasThemeCss\}\$\{ajudaPageCss\}`\}<\/style>/,
  );
});
