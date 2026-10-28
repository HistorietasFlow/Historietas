import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const modulo = await readFile(
  "app/em-breve/lib/em-breve-translations.ts",
  "utf8",
);

test("traducoes de Em Breve preservam o catalogo e os contratos de traducao", () => {
  [
    "EM_BREVE_UI_TRANSLATIONS",
    '"EM BREVE"',
    '"COMING SOON"',
    '"PRÓXIMAMENTE"',
    '"Notificações"',
    '"AVISO ATIVADO"',
    '"Essa obra ainda não está disponível"',
    "/^Notificações:\\s*(\\d+)\\s*não lidas$/i",
    "/^Abrir aviso de (.+)$/i",
    'idioma === "pt-BR" || !texto',
    "/^(\\s*)([\\s\\S]*?)(\\s*)$/",
    "return texto;",
  ].forEach((contrato) => assert.ok(modulo.includes(contrato), contrato));

  assert.doesNotMatch(
    modulo,
    /supabase|useEffect|useState|router|localStorage|document|MutationObserver/,
  );
});

test("pagina delega a traducao e mantem o LanguageBridge", () => {
  assert.match(
    pagina,
    /import \{ traduzirTextoEmBreve \} from "\.\/lib\/em-breve-translations"/,
  );
  assert.match(pagina, /function EmBreveLanguageBridge\(\)/);
  assert.doesNotMatch(
    pagina,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/lib\/i18n"/,
  );
  assert.doesNotMatch(pagina, /const EM_BREVE_UI_TRANSLATIONS/);
  assert.doesNotMatch(pagina, /function traduzirTextoEmBreve/);
});
