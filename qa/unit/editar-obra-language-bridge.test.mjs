import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bridge = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraLanguageBridge.tsx",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);

test("EditarObraLanguageBridge preserva traduções, padrões e lifecycle do DOM", () => {
  assert.match(bridge, /^"use client";/);
  assert.match(bridge, /import \{ useEffect \} from "react";/);
  assert.match(
    bridge,
    /import \{ useHistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/components\/HistorietasLanguageProvider";/,
  );
  assert.match(
    bridge,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/lib\/i18n";/,
  );
  assert.match(bridge, /const EDITAR_OBRA_UI_TRANSLATIONS: Record</);
  assert.match(bridge, /function traduzirTextoEditarObra\(/);
  assert.match(bridge, /export function EditarObraLanguageBridge\(\)/);
  assert.match(bridge, /"Notificações": \{ en: "Notifications", es: "Notificaciones" \}/);
  assert.match(bridge, /\^Notificações: \(\\d\+\) não lidas\$/);
  assert.match(bridge, /\^\(\\d\+\) cap\\\.\$/);
  assert.match(bridge, /\^\(\\d\+\)% pronto\$/);
  assert.match(bridge, /Não consegui atualizar a obra no Supabase/);
  assert.match(bridge, /Erro ao enviar \(\.\+\): \(\[\\s\\S\]\+\)\$/);
  assert.match(bridge, /\[data-historietas-editar-obra-root='true'\]/);
  assert.match(bridge, /data-historietas-i18n-ignore='true'/);
  assert.match(bridge, /tag === "script" \|\| tag === "style"/);
  assert.match(bridge, /tagName\.toLowerCase\(\) === "textarea"/);
  assert.match(bridge, /\["aria-label", "title", "placeholder", "alt"\]/);
  assert.match(bridge, /new WeakMap\(\)/);
  assert.match(bridge, /new Set<Text>\(\)/);
  assert.match(bridge, /function aplicarTexto\(/);
  assert.match(bridge, /function aplicarAtributo\(/);
  assert.match(bridge, /function aplicarNo\(/);
  assert.match(bridge, /function aplicarTudo\(/);
  assert.match(bridge, /let aplicando = false/);
  assert.match(bridge, /new MutationObserver/);
  assert.match(
    bridge,
    /mutacao\.type === "characterData"[\s\S]*?mutacao\.type === "attributes"[\s\S]*?mutacao\.addedNodes\.forEach/,
  );
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
});

test("Editar Obra monta o bridge extraído sem manter a implementação na página", () => {
  assert.match(
    page,
    /import \{ EditarObraLanguageBridge \} from "\.\/components\/EditarObraLanguageBridge";/,
  );
  assert.equal((page.match(/<EditarObraLanguageBridge \/>/g) || []).length, 3);
  assert.doesNotMatch(page, /const EDITAR_OBRA_UI_TRANSLATIONS/);
  assert.doesNotMatch(page, /function traduzirTextoEditarObra\(/);
  assert.doesNotMatch(page, /function EditarObraLanguageBridge\(/);
  assert.doesNotMatch(page, /new MutationObserver/);
});
