import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/ajuda/page.tsx", "utf8");
const componente = await readFile("app/ajuda/components/ajuda-svg-icon.tsx", "utf8");

test("SvgIcon preserva o renderer estático e seus contratos visuais", () => {
  assert.equal(
    createHash("sha256").update(componente).digest("hex"),
    "66b84ee4d5b95abfdf9e9e35111c3f7e04ec535374ab2fd59a0165c6f0398173",
  );
  for (const contrato of [
    'import type { ReactNode } from "react"',
    'import type { IconName } from "../lib/ajuda-content"',
    "export function SvgIcon",
    "size = 24",
    "strokeWidth = 2",
    'fill: "none"',
    'stroke: "currentColor"',
    'strokeLinecap: "round" as const',
    'strokeLinejoin: "round" as const',
    "const icons: Record<IconName, ReactNode>",
    'viewBox="0 0 24 24"',
    'aria-hidden="true"',
    'focusable="false"',
  ]) assert.ok(componente.includes(contrato), contrato);

  for (const nome of ["arrowLeft", "search", "help", "user", "pen", "book", "message", "shield", "settings", "bell", "chevronDown", "arrowRight", "spark"]) {
    assert.ok(componente.includes(`${nome}:`), nome);
  }
});

test("página consome SvgIcon extraído sem manter renderer local", () => {
  assert.match(pagina, /import \{ SvgIcon \} from "\.\/components\/ajuda-svg-icon"/);
  assert.doesNotMatch(pagina, /function SvgIcon\(/);
  assert.doesNotMatch(pagina, /ReactNode/);
  assert.match(pagina, /<SvgIcon/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState|router|localStorage|\.from\(/);
});
