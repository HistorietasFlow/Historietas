import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-guidance-notice.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("o aviso final preserva ícone, estilos e orientações traduzidas", () => {
  assert.match(componente, /export function AjudaGuidanceNotice/);
  assert.match(componente, /<aside style=\{noticeStyle\}>/);
  assert.match(componente, /noticeIconStyle/);
  assert.match(componente, /noticeTextStyle/);
  assert.match(componente, /name="shield" size=\{24\} strokeWidth=\{2\.1\}/);
  assert.match(componente, /pt: "Orienta\u00e7\u00f5es da vers\u00e3o atual"/);
  assert.match(componente, /en: "Current version guidance"/);
  assert.match(componente, /es: "Orientaciones de la versi\u00f3n actual"/);
  assert.match(componente, /Esta central descreve os recursos que já estão disponíveis no Historietas/);
  assert.match(componente, /This center describes features already available in Historietas/);
  assert.match(componente, /Este centro describe las funciones que ya están disponibles en Historietas/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState/);
});

test("a página delega somente o aviso final", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaGuidanceNotice,\s*\} from "\.\/components\/ajuda-guidance-notice";/,
  );
  assert.match(pagina, /<AjudaGuidanceNotice\s*language=\{language\}\s*\/>/);
  assert.doesNotMatch(pagina, /Orientações da versão atual/);
  assert.doesNotMatch(pagina, /noticeStyle/);
});
