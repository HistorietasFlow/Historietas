import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/admin/comunidade/page.tsx", "utf8");
const bridge = await readFile(
  "app/admin/comunidade/components/admin-comunidade-language-bridge.tsx",
  "utf8",
);
const textUtils = await readFile(
  "app/admin/comunidade/lib/admin-comunidade-text-utils.ts",
  "utf8",
);
const filterUtils = await readFile(
  "app/admin/comunidade/lib/admin-comunidade-filter-utils.ts",
  "utf8",
);

test("AdminComunidadeLanguageBridge preserva o lifecycle de tradução e restauração", () => {
  assert.match(bridge, /^"use client";/);
  assert.match(bridge, /export function AdminComunidadeLanguageBridge\(\)/);
  assert.match(bridge, /ADMIN_COMUNIDADE_UI_TRANSLATIONS/);
  assert.match(bridge, /function traduzirStatusAdminComunidade\(/);
  assert.match(bridge, /function traduzirTextoAdminComunidade\(/);
  assert.match(bridge, /new MutationObserver/);
  assert.match(bridge, /new WeakMap/);
  assert.match(bridge, /new Set<Text>\(\)/);
  assert.match(bridge, /\["aria-label", "title", "placeholder", "alt"\]/);
  assert.match(bridge, /data-historietas-i18n-ignore='true'/);
  assert.match(bridge, /document\.createTreeWalker/);
  assert.match(bridge, /let aplicando = false/);
  assert.match(bridge, /observador\.disconnect\(\)/);
  assert.match(bridge, /no\.data = estado\.original/);
  assert.match(bridge, /elemento\.setAttribute\(atributo, estado\.original\)/);
  assert.match(bridge, /\}, \[language\]\);/);
});

test("a página preserva mounts e responsabilidades fora do bridge", () => {
  assert.match(
    pagina,
    /import \{ AdminComunidadeLanguageBridge \} from "\.\/components\/admin-comunidade-language-bridge";/,
  );
  assert.equal((pagina.match(/<AdminComunidadeLanguageBridge \/>/g) || []).length, 4);
  assert.doesNotMatch(pagina, /ADMIN_COMUNIDADE_UI_TRANSLATIONS/);
  assert.doesNotMatch(pagina, /function traduzirStatusAdminComunidade\(/);
  assert.doesNotMatch(pagina, /function traduzirTextoAdminComunidade\(/);
  assert.doesNotMatch(pagina, /function localeAdminComunidade\(/);
  assert.doesNotMatch(
    pagina,
    /function textoConfirmacaoRemocaoAdminComunidade\(/,
  );
  assert.match(
    pagina,
    /from "\.\/lib\/admin-comunidade-text-utils";/,
  );
  assert.match(pagina, /useHistorietasLanguage/);
  assert.doesNotMatch(pagina, /import type \{ HistorietasLanguage \} from/);
  assert.match(
    textUtils,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/i18n";/,
  );
  assert.match(pagina, /useEffect/);
  assert.doesNotMatch(pagina, /normalizarTexto/);
  assert.match(
    filterUtils,
    /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
});
