import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/admin/comunidade/page.tsx", "utf8");
const bridge = await readFile(
  "app/admin/comunidade/components/admin-comunidade-language-bridge.tsx",
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
  assert.match(pagina, /function localeAdminComunidade\(/);
  assert.match(pagina, /function textoConfirmacaoRemocaoAdminComunidade\(/);
  assert.match(pagina, /useHistorietasLanguage/);
  assert.match(pagina, /import type \{ HistorietasLanguage \} from/);
  assert.match(pagina, /useEffect/);
  assert.match(pagina, /normalizarTexto/);
});
