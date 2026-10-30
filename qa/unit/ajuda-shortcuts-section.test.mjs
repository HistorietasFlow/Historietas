import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-shortcuts-section.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("a seção de atalhos preserva catálogo, URLs, classes e ícones", () => {
  assert.match(componente, /export function AjudaShortcutsSection/);
  assert.match(componente, /id="atalhos-ajuda-titulo"/);
  assert.match(componente, /ATALHOS_AJUDA\.map\(/);
  assert.match(componente, /key=\{atalho\.href\}/);
  assert.match(componente, /href=\{atalho\.href\}/);
  assert.match(componente, /className="ajuda-shortcut-link"/);
  assert.match(componente, /className="ajuda-shortcut-icon"/);
  assert.match(componente, /className="ajuda-shortcut-copy"/);
  assert.match(componente, /className="ajuda-shortcut-arrow"/);
  assert.match(componente, /<SvgIcon name=\{atalho\.icon\} size=\{23\} strokeWidth=\{2\.05\}/);
  assert.match(componente, /atalho\.titulo/);
  assert.match(componente, /atalho\.descricao/);
  assert.match(componente, /name="arrowRight" size=\{20\} strokeWidth=\{2\.25\}/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState/);
});

test("a página delega somente a apresentação dos atalhos", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaShortcutsSection,\s*\} from "\.\/components\/ajuda-shortcuts-section";/,
  );
  assert.match(pagina, /<AjudaShortcutsSection\s*language=\{language\}\s*\/>/);
  assert.doesNotMatch(pagina, /ATALHOS_AJUDA\.map/);
  assert.doesNotMatch(pagina, /ajuda-shortcut-link/);
});
