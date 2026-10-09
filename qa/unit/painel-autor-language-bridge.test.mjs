import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bridge = readFileSync(
  new URL(
    "../../app/painel-autor/components/painel-autor-language-bridge.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("PainelAutorLanguageBridge preserva o lifecycle de tradução e restauração", () => {
  assert.match(bridge, /^"use client";/);
  assert.match(bridge, /export function PainelAutorLanguageBridge\(\)/);
  assert.match(
    bridge,
    /import \{ traduzirTextoPainelAutor \} from "\.\.\/lib\/painel-autor-translations";/,
  );
  assert.match(bridge, /\[data-historietas-painel-autor-root='true'\]/);
  assert.match(bridge, /new WeakMap\(\)/);
  assert.match(bridge, /new Set<Text>\(\)/);
  assert.match(bridge, /\["aria-label", "title", "placeholder", "alt"\]/);
  assert.match(bridge, /document\.createTreeWalker/);
  assert.match(bridge, /let aplicando = false/);
  assert.match(bridge, /new MutationObserver/);
  assert.match(
    bridge,
    /observador\.observe\(raizPagina, \{\s*subtree: true,\s*childList: true,\s*characterData: true,\s*attributes: true,\s*attributeFilter: atributosTraduziveis,\s*\}\);/,
  );
  assert.match(bridge, /observador\.disconnect\(\)/);
  assert.match(bridge, /no\.isConnected && no\.data === estado\.traduzido/);
  assert.match(
    bridge,
    /registro\.elemento\.isConnected[\s\S]*?getAttribute\(registro\.atributo\) === estado\.traduzido/,
  );
  assert.match(bridge, /\}, \[language\]\);/);
});

test("a página preserva os dois mounts e as responsabilidades fora do bridge", () => {
  assert.match(
    pagina,
    /import \{ PainelAutorLanguageBridge \} from "\.\/components\/painel-autor-language-bridge";/,
  );
  assert.equal((pagina.match(/<PainelAutorLanguageBridge \/>/g) || []).length, 2);
  assert.doesNotMatch(pagina, /function PainelAutorLanguageBridge\(\)/);
  assert.doesNotMatch(pagina, /new MutationObserver/);
  assert.match(
    pagina,
    /import \{ traduzirTextoPainelAutor \} from "\.\/lib\/painel-autor-translations";/,
  );
  assert.match(pagina, /useHistorietasLanguage/);
  assert.match(pagina, /useEffect/);
  assert.match(pagina, /normalizarTexto/);
});
