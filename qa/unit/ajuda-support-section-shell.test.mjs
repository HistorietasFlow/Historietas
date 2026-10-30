import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-support-section-shell.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("o shell do suporte preserva cabeçalho, aviso técnico e children", () => {
  assert.match(componente, /export function AjudaSupportSectionShell/);
  assert.match(componente, /id="problema-tecnico"/);
  assert.match(componente, /aria-labelledby="problema-tecnico-titulo"/);
  assert.match(componente, /id="problema-tecnico-titulo"/);
  assert.match(componente, /pt: "SUPORTE TÉCNICO"/);
  assert.match(componente, /en: "TECHNICAL SUPPORT"/);
  assert.match(componente, /es: "SOPORTE TÉCNICO"/);
  assert.match(componente, /pt: "Relatar um problema técnico"/);
  assert.match(componente, /supportCardStyle/);
  assert.match(componente, /supportSeparationNoticeStyle/);
  assert.match(componente, /pt: "Falha técnica não é denúncia"/);
  assert.match(componente, /name="settings" size=\{23\} strokeWidth=\{2\.1\}/);
  assert.match(componente, /\{children\}/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState/);
});

test("a página preserva a composição dinâmica dentro do shell", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaSupportSectionShell,\s*\} from "\.\/components\/ajuda-support-section-shell";/,
  );
  assert.match(
    pagina,
    /<AjudaSupportSectionShell\s*language=\{language\}\s*>[\s\S]*?<AjudaSupportMessages[\s\S]*?<AjudaTechnicalSupportForm[\s\S]*?<AjudaSupportTickets/,
  );
  assert.doesNotMatch(pagina, /Falha técnica não é denúncia/);
});
