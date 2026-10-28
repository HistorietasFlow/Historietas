import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/em-breve/components/em-breve-language-bridge.tsx",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("o bridge de idioma de Em Breve fica isolado no componente", async () => {
  const component = await readFile(componentPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(component, /^"use client";/);
  assert.match(component, /import \{ useEffect \} from "react"/);
  assert.match(component, /useHistorietasLanguage/);
  assert.match(component, /traduzirTextoEmBreve/);
  assert.match(
    page,
    /import \{ EmBreveLanguageBridge \} from "\.\/components\/em-breve-language-bridge"/,
  );
  assert.doesNotMatch(page, /function EmBreveLanguageBridge/);
  assert.doesNotMatch(page, /useHistorietasLanguage|traduzirTextoEmBreve/);
  assert.match(page, /<EmBreveLanguageBridge \/>/);

  for (const trecho of [
    "data-historietas-em-breve-root",
    "WeakMap",
    "Set<Text>",
    '"aria-label"',
    '"title"',
    '"placeholder"',
    '"alt"',
    "data-historietas-i18n-ignore",
    '"textarea"',
    '"script"',
    '"style"',
    "traduzirTextoEmBreve",
    "document.createTreeWalker",
    "NodeFilter.SHOW_TEXT",
    "MutationObserver",
    "characterData",
    "attributes",
    "addedNodes",
    "observador",
    "observador.observe(document.body",
    "observador.disconnect()",
    "attributeFilter: atributosTraduziveis",
    "[language]",
  ]) {
    assert.ok(component.includes(trecho), `mantém ${trecho}`);
  }

  assert.doesNotMatch(
    component,
    /supabase|\.from\(|auth|router|localStorage|\.(?:insert|update|delete|upsert)\(/,
  );
});
