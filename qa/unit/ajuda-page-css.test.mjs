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

test("ajudaPageCss preserva o CSS global da Central de Ajuda", () => {
  assert.match(modulo, /export const ajudaPageCss = `/);
  assert.match(modulo, /--ajuda-card:/);
  assert.match(modulo, /--ajuda-border:/);
  assert.match(modulo, /\[data-historietas-ajuda-root="true"\]/);
  assert.match(modulo, /@media \(prefers-reduced-motion: reduce\)/);
  assert.equal(
    createHash("sha256")
      .update(modulo.replace(/\r\n/g, "\n"))
      .digest("hex"),
    "1f936176798c0f6dbb4fa7d87b7b7611d32615fa984e69c677971a310fda6a2e",
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
