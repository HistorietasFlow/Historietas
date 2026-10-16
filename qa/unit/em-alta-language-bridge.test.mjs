import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bridge = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-language-bridge.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

test("EmAltaLanguageBridge preserva o lifecycle e a restauração do DOM", () => {
  assert.match(bridge, /^"use client";/);
  assert.match(bridge, /import \{ useEffect \} from "react";/);
  assert.match(
    bridge,
    /import \{ useHistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/components\/HistorietasLanguageProvider";/,
  );
  assert.match(
    bridge,
    /import \{ traduzirTextoEmAlta \} from "\.\.\/lib\/em-alta-translations";/,
  );
  assert.match(bridge, /export function EmAltaLanguageBridge\(\)/);
  assert.match(
    bridge,
    /const seletorRaiz = "\[data-historietas-em-alta-root='true'\]";/,
  );
  assert.match(bridge, /data-historietas-i18n-ignore='true'/);
  assert.match(bridge, /const estadosTexto: WeakMap<Text, EstadoTraducaoEmAlta> = new WeakMap\(\);/);
  assert.match(bridge, /const estadosAtributos: WeakMap</);
  assert.match(
    bridge,
    /const atributosTraduziveis = \["aria-label", "title", "placeholder", "alt"\];/,
  );
  assert.match(bridge, /document\.createTreeWalker\(/);
  assert.match(bridge, /NodeFilter\.SHOW_TEXT/);
  assert.match(bridge, /const observador = new MutationObserver/);
  assert.match(bridge, /if \(aplicando\) \{\s*return;\s*\}/);
  assert.match(
    bridge,
    /childList: true,\s*subtree: true,\s*characterData: true,\s*attributes: true,\s*attributeFilter: atributosTraduziveis,/,
  );
  assert.match(bridge, /observador\.disconnect\(\);/);
  assert.match(
    bridge,
    /estado && no\.isConnected && no\.data === estado\.traduzido/,
  );
  assert.match(
    bridge,
    /estado &&\s*elemento\.isConnected &&\s*elemento\.getAttribute\(atributo\) === estado\.traduzido/,
  );
  assert.match(bridge, /\}, \[language\]\);/);
  assert.match(bridge, /return null;/);
});

test("Em Alta consome o bridge dedicado e preserva os dois mounts", () => {
  assert.match(
    pagina,
    /import \{ EmAltaLanguageBridge \} from "\.\/components\/em-alta-language-bridge";/,
  );
  assert.doesNotMatch(pagina, /function EmAltaLanguageBridge\(\)/);
  assert.equal((pagina.match(/<EmAltaLanguageBridge \/>/g) || []).length, 2);
  assert.doesNotMatch(pagina, /useHistorietasLanguage/);
  assert.doesNotMatch(pagina, /traduzirTextoEmAlta/);
});

test("bridge permanece isolado de persistência e domínio de ranking", () => {
  assert.doesNotMatch(bridge, /supabase/i);
  assert.doesNotMatch(bridge, /localStorage/);
  assert.doesNotMatch(bridge, /ranking/i);
  assert.doesNotMatch(bridge, /auth/i);
});
