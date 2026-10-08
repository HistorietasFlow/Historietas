import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const bridge = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-language-bridge.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const bridgeNormalizado = bridge.replace(/\r\n/g, "\n");
const bridgeExecutavel = bridgeNormalizado
  .replace('"use client";\n\n', "")
  .replace('import { useEffect } from "react";\n', "const useEffect = () => {};\n")
  .replace(
    'import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";\n',
    'const useHistorietasLanguage = () => ({ language: "pt-BR" });\n',
  )
  .replace('import type { HistorietasLanguage } from "../../../lib/i18n";\n', "");
const bridgeJavascript = typescript.transpileModule(bridgeExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { traduzirTextoSeguindo } = await import(
  `data:text/javascript;base64,${Buffer.from(bridgeJavascript).toString("base64")}`,
);

test("preserva portugu\u00eas, vazio, espa\u00e7os e tradu\u00e7\u00f5es est\u00e1ticas de Seguindo", () => {
  assert.equal(traduzirTextoSeguindo("Seguindo", "pt-BR"), "Seguindo");
  assert.equal(traduzirTextoSeguindo("", "en"), "");
  assert.equal(traduzirTextoSeguindo("Seguindo", "en"), "Following");
  assert.equal(traduzirTextoSeguindo("Seguindo", "es"), "Siguiendo");
  assert.equal(
    traduzirTextoSeguindo("  Carregando seguindo  ", "en"),
    "  Loading following  ",
  );
});

test("executa regras de busca, perfis, listas, quantidades e datas", () => {
  assert.equal(
    traduzirTextoSeguindo("Pesquisar em seguidores de Ana", "en"),
    "Search in followers of Ana",
  );
  assert.equal(
    traduzirTextoSeguindo("Pesquisar em pessoas seguidas", "es"),
    "Buscar en personas seguidas",
  );
  assert.equal(
    traduzirTextoSeguindo("Pesquisar em obras seguidas de Ana", "en"),
    "Search in followed works of Ana",
  );
  assert.equal(
    traduzirTextoSeguindo("Abrir perfil de Ana", "en"),
    "Open Ana's profile",
  );
  assert.equal(traduzirTextoSeguindo("3 em leitura", "es"), "3 en lectura");
  assert.equal(traduzirTextoSeguindo("1 obra", "en"), "1 work");
  assert.equal(traduzirTextoSeguindo("2 obras", "en"), "2 works");
  assert.equal(traduzirTextoSeguindo("31/12/2026", "en"), "12/31/2026");
});

test("executa as regras de atividade e preserva o fallback", () => {
  assert.equal(
    traduzirTextoSeguindo("leu um cap\u00edtulo de Aurora", "en"),
    "read a chapter of Aurora",
  );
  assert.equal(
    traduzirTextoSeguindo("come\u00e7ou a ler Aurora", "es"),
    "empez\u00f3 a leer Aurora",
  );
  assert.equal(traduzirTextoSeguindo("concluiu Aurora", "en"), "completed Aurora");
  assert.equal(traduzirTextoSeguindo("avaliou Aurora", "en"), "rated Aurora");
  assert.equal(
    traduzirTextoSeguindo("avaliou Aurora com 4,5 estrelas", "en"),
    "rated Aurora with 4.5 stars",
  );
  assert.equal(traduzirTextoSeguindo("favoritou Aurora", "es"), "marc\u00f3 como favorita Aurora");
  assert.equal(traduzirTextoSeguindo("salvou Aurora", "en"), "saved Aurora");
  assert.equal(
    traduzirTextoSeguindo("publicou uma review", "es"),
    "public\u00f3 una rese\u00f1a",
  );
  assert.equal(
    traduzirTextoSeguindo("publicou uma review sobre Aurora", "en"),
    "published a review of Aurora",
  );
  assert.equal(
    traduzirTextoSeguindo("interagiu com Aurora", "es"),
    "interactu\u00f3 con Aurora",
  );
  assert.equal(
    traduzirTextoSeguindo("Texto sem mapeamento", "en"), "Texto sem mapeamento");
});

test("preserva o lifecycle e os filtros de DOM do bridge", () => {
  assert.match(bridge, /^"use client";/);
  assert.match(bridge, /const \{ language \} = useHistorietasLanguage\(\);/);
  assert.match(bridge, /\}, \[language\]\);/);
  assert.match(bridge, /if \(typeof document === "undefined"\) \{/);
  assert.match(bridge, /\[data-historietas-seguindo-root='true'\]/);
  assert.match(bridge, /const estadosTexto: WeakMap<Text,/);
  assert.match(bridge, /const estadosAtributos: WeakMap</);
  assert.match(bridge, /const textosAlterados = new Set<Text>\(\);/);
  assert.match(bridge, /const atributosAlterados: Array<\{ elemento: Element; atributo: string \}>/);
  assert.match(
    bridge,
    /const atributosTraduziveis = \["aria-label", "title", "placeholder", "alt"\];/,
  );
  assert.match(bridge, /let aplicando = false;/);
  assert.match(bridge, /\[data-historietas-i18n-ignore='true'\]/);
  assert.match(bridge, /tag === "script" \|\| tag === "style"/);
  assert.match(bridge, /tagName\.toLowerCase\(\) === "textarea"/);
  assert.ok(bridge.includes('elemento.querySelectorAll("*")'));
  assert.match(bridge, /NodeFilter\.SHOW_TEXT/);
  assert.match(bridge, /no\.nodeType !== Node\.ELEMENT_NODE/);
  assert.match(
    bridge,
    /function aplicarPagina\(\) \{[\s\S]*?try \{[\s\S]*?\} finally \{[\s\S]*?aplicando = false;/,
  );
  assert.match(bridge, /if \(mutacao\.type === "characterData"\)/);
  assert.match(bridge, /if \(mutacao\.type === "attributes"\)/);
  assert.match(bridge, /mutacao\.addedNodes\.forEach/);
  assert.match(
    bridge,
    /const observador = new MutationObserver\([\s\S]*?try \{[\s\S]*?\} finally \{[\s\S]*?aplicando = false;/,
  );
  assert.match(
    bridge,
    /observador\.observe\(document\.body, \{\s*childList: true,\s*subtree: true,\s*characterData: true,\s*attributes: true,\s*attributeFilter: atributosTraduziveis,\s*\}\);/,
  );
  assert.match(bridge, /observador\.disconnect\(\);/);
  assert.match(bridge, /no\.isConnected && no\.data === estado\.traduzido/);
  assert.match(
    bridge,
    /elemento\.isConnected &&\s*elemento\.getAttribute\(atributo\) === estado\.traduzido/,
  );
  assert.match(bridge, /return null;/);
});

test("a p\u00e1gina mant\u00e9m somente os dois mounts e a raiz de tradu\u00e7\u00e3o", () => {
  assert.match(
    pagina,
    /import \{ SeguindoLanguageBridge \} from "\.\/components\/seguindo-language-bridge";/,
  );
  assert.equal((pagina.match(/<SeguindoLanguageBridge \/>/g) || []).length, 2);
  assert.match(
    pagina,
    /if \(verificandoAcesso \|\| carregando\) \{[\s\S]*?<SeguindoLanguageBridge \/>/,
  );
  assert.equal(
    (pagina.match(/data-historietas-seguindo-root="true"/g) || []).length,
    2,
  );
  assert.doesNotMatch(pagina, /function SeguindoLanguageBridge\(/);
  assert.doesNotMatch(pagina, /SEGUINDO_UI_TRANSLATIONS/);
  assert.doesNotMatch(pagina, /function traduzirTextoSeguindo\(/);
  assert.doesNotMatch(pagina, /function traduzirDescricaoListaSeguindo\(/);
  assert.doesNotMatch(pagina, /useHistorietasLanguage/);
  assert.doesNotMatch(pagina, /HistorietasLanguage/);
});
