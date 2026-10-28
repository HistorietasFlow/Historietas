import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const translationsPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-translations.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);
const languageBridgePath = new URL(
  "../../app/perfil-autor/top-5/components/top5-language-bridge.tsx",
  import.meta.url,
);

test("Top 5 delega somente o catálogo e o helper de tradução", async () => {
  const [translations, page, languageBridge] = await Promise.all([
    readFile(translationsPath, "utf8"),
    readFile(pagePath, "utf8"),
    readFile(languageBridgePath, "utf8"),
  ]);

  assert.match(
    translations,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/i18n";/,
  );
  assert.match(translations, /const TOP5_UI_TRANSLATIONS/);
  assert.match(translations, /export function traduzirTextoTop5/);
  assert.match(translations, /idioma === "pt-BR" \|\| !texto/);
  assert.match(translations, /\^\(\\s\*\)\(\[\\s\\S\]\*\?\)\(\\s\*\)\$/);
  assert.match(translations, /\^Remover\\s\+\(\.\+\)\\s\+do TOP 5\$\/i/);
  assert.match(translations, /\^Adicionar\\s\+\(\.\+\)\\s\+ao TOP 5\$\/i/);
  assert.match(translations, /\^Subir\\s\+\(\.\+\)\$\/i/);
  assert.match(translations, /\^Descer\\s\+\(\.\+\)\$\/i/);
  assert.match(translations, /\^Obra\\s\+\(\\d\+\)\$\/i/);
  assert.match(translations, /"Seu TOP 5": \{ en: "Your TOP 5", es: "Tu TOP 5" \}/);
  assert.match(translations, /"Cancelar": \{ en: "Cancel", es: "Cancelar" \}/);
  assert.match(translations, /"Salvar": \{ en: "Save", es: "Guardar" \}/);
  assert.match(translations, /"Usuário": \{ en: "User", es: "Usuario" \}/);
  assert.match(translations, /return texto;/);

  assert.doesNotMatch(page, /type TraducaoTop5/);
  assert.doesNotMatch(page, /const TOP5_UI_TRANSLATIONS/);
  assert.doesNotMatch(page, /function traduzirTextoTop5/);
  assert.doesNotMatch(page, /function Top5LanguageBridge\(\)/);
  assert.doesNotMatch(page, /import \{ traduzirTextoTop5 \} from "\.\/lib\/top5-translations";/);
  assert.match(
    languageBridge,
    /import \{ traduzirTextoTop5 \} from "\.\.\/lib\/top5-translations";/,
  );
  assert.match(languageBridge, /traduzirTextoTop5\(estado\.original, language\)/);
  assert.doesNotMatch(translations, /from "react"/);
  assert.doesNotMatch(translations, /supabase/);
  assert.doesNotMatch(translations, /localStorage/);
  assert.doesNotMatch(translations, /MutationObserver/);
  assert.doesNotMatch(translations, /WeakMap/);
  assert.doesNotMatch(translations, /TreeWalker/);
});
