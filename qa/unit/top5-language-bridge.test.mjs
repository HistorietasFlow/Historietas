import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bridgePath = new URL(
  "../../app/perfil-autor/top-5/components/top5-language-bridge.tsx",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 move somente o bridge de idioma para componente dedicado", async () => {
  const [bridge, page] = await Promise.all([
    readFile(bridgePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(bridge, /^"use client";/);
  assert.match(bridge, /import \{ useEffect \} from "react";/);
  assert.match(bridge, /import \{ useHistorietasLanguage \}/);
  assert.match(bridge, /import \{ traduzirTextoTop5 \} from "\.\.\/lib\/top5-translations";/);
  assert.match(bridge, /export function Top5LanguageBridge\(\)/);
  assert.match(bridge, /data-historietas-top5-root='true'/);
  assert.match(bridge, /WeakMap<Text, EstadoTraducaoTop5>/);
  assert.match(bridge, /WeakMap</);
  assert.match(bridge, /new Set<Text>\(\)/);
  assert.match(bridge, /"aria-label", "title", "placeholder", "alt"/);
  assert.match(bridge, /data-historietas-i18n-ignore='true'/);
  assert.match(bridge, /=== "textarea"/);
  assert.match(bridge, /tag === "script" \|\| tag === "style"/);
  assert.match(bridge, /traduzirTextoTop5\(estado\.original, language\)/);
  assert.match(bridge, /document\.createTreeWalker/);
  assert.match(bridge, /NodeFilter\.SHOW_TEXT/);
  assert.match(bridge, /new MutationObserver/);
  assert.match(bridge, /characterData/);
  assert.match(bridge, /attributes/);
  assert.match(bridge, /addedNodes/);
  assert.match(bridge, /observador\.observe\(document\.body/);
  assert.match(bridge, /observador\.disconnect\(\)/);
  assert.match(bridge, /attributeFilter: atributosTraduziveis/);
  assert.match(bridge, /\}, \[language\]\);/);

  assert.match(
    page,
    /import \{ Top5LanguageBridge \} from "\.\/components\/top5-language-bridge";/,
  );
  assert.match(page, /<Top5LanguageBridge \/>/);
  assert.doesNotMatch(page, /function Top5LanguageBridge\(\)/);
  assert.doesNotMatch(page, /useHistorietasLanguage/);
  assert.doesNotMatch(page, /traduzirTextoTop5/);
  assert.doesNotMatch(page, /useEffect\(/);
  assert.match(page, /useTop5InitialLoad/);

  for (const forbidden of [
    "supabase",
    ".from(",
    "auth",
    "useRouter",
    "localStorage",
    ".insert(",
    ".delete(",
    "style={",
  ]) {
    assert.doesNotMatch(bridge, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
