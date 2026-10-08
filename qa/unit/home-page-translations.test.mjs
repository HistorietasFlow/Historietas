import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const hook = readFileSync(
  new URL("../../app/hooks/use-home-page-translations.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);
const hookExecutavel = hook
  .replace('"use client";\n\n', "")
  .replace('import { useEffect } from "react";\n', "const useEffect = () => {};\n")
  .replace('import type { HistorietasLanguage } from "../../lib/i18n";\n', "");
const hookJavascript = typescript.transpileModule(hookExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { traduzirTextoDinamicoHome, traduzirValorPreservandoEspacosHome } = await import(
  `data:text/javascript;base64,${Buffer.from(hookJavascript).toString("base64")}`,
);

test("traduz a tabela da Home sem alterar o original em português", () => {
  assert.match(hook, /const HOME_UI_TRANSLATIONS:/);
  assert.equal(
    traduzirTextoDinamicoHome("Notificações", "pt-BR"),
    "Notificações",
  );
  assert.equal(
    traduzirTextoDinamicoHome("Notificações", "en"),
    "Notifications",
  );
  assert.equal(
    traduzirTextoDinamicoHome("Notificações", "es"), "Notificaciones");
  assert.equal(
    traduzirValorPreservandoEspacosHome("  Carregando página inicial\n", "en"),
    "  Loading home page\n",
  );
});

test("preserva todas as regras dinâmicas e seus textos", () => {
  assert.equal(
    traduzirTextoDinamicoHome("Notificações: 3 novas", "en"),
    "3 new notifications",
  );
  assert.equal(
    traduzirTextoDinamicoHome("2 na lista para acessar rápido.", "es"),
    "2 en tu lista para acceder rápidamente.",
  );
  assert.equal(traduzirTextoDinamicoHome("Capítulo 7", "en"), "Chapter 7");
  assert.equal(traduzirTextoDinamicoHome("Cap 8", "en"), "Ch. 8");
  assert.equal(
    traduzirTextoDinamicoHome("Leitura Cap. 9", "es"),
    "Lectura Cap. 9",
  );
  assert.equal(
    traduzirTextoDinamicoHome("Abrir destaque Aurora", "en"),
    "Open featured work Aurora",
  );
  assert.equal(traduzirTextoDinamicoHome("Mostrar mais", "en"), "Show mais");
  assert.equal(
    traduzirTextoDinamicoHome("Abrir perfil do autor Ana", "en"),
    "Open author profile for Ana",
  );
  assert.equal(traduzirTextoDinamicoHome("Avatar de Ana", "es"), "Avatar de Ana");
  assert.equal(
    traduzirTextoDinamicoHome("Abrir página da obra Aurora", "en"),
    "Open work page for Aurora",
  );
});

test("preserva pluralização, unidades e fallbacks da tradução dinâmica", () => {
  assert.equal(
    traduzirTextoDinamicoHome("Avaliação média 4,5 de 5, com 1 avaliação", "en"),
    "Average rating 4,5 out of 5, from 1 rating",
  );
  assert.equal(
    traduzirTextoDinamicoHome("Avaliação média 4,5 de 5, com 2 avaliações", "es"),
    "Valoración media 4,5 de 5, con 2 valoraciones",
  );
  assert.equal(
    traduzirTextoDinamicoHome("Adicionou Aurora à lista", "es"),
    "Añadió Aurora a la lista",
  );
  assert.equal(
    traduzirTextoDinamicoHome("Autor de Aurora na Historietas.", "en"),
    "Author of Aurora on Historietas.",
  );
  assert.equal(traduzirTextoDinamicoHome("1,2 mi", "en"), "1.2M");
  assert.equal(traduzirTextoDinamicoHome("2,5 mil", "en"), "2.5K");
  assert.equal(
    traduzirTextoDinamicoHome("Texto sem mapeamento", "en"),
    "Texto sem mapeamento",
  );
});

test("preserva o lifecycle do bridge e os contratos de DOM", () => {
  assert.match(hook, /const homeTextNodeStates = new WeakMap/);
  assert.match(hook, /const homeAttributeStates = new WeakMap/);
  assert.match(hook, /tag !== "script" && tag !== "style" && tag !== "textarea"/);
  assert.match(
    hook,
    /const atributos = \["aria-label", "title", "placeholder", "alt"\];/,
  );
  assert.match(
    hook,
    /NodeFilter\.SHOW_ELEMENT \| NodeFilter\.SHOW_TEXT/,
  );
  assert.match(hook, /if \(mutacao\.type === "characterData"\)/);
  assert.match(hook, /if \(mutacao\.type === "attributes"\)/);
  assert.match(hook, /mutacao\.addedNodes\.forEach/);
  assert.match(
    hook,
    /observer\.observe\(raiz, \{\s*childList: true,\s*characterData: true,\s*attributes: true,\s*subtree: true,\s*attributeFilter: \["aria-label", "title", "placeholder", "alt"\],\s*\}\);/,
  );
  assert.match(hook, /observer\.disconnect\(\);/);
  assert.match(hook, /useEffect\(\(\) => \{/);
  assert.doesNotMatch(hook, /useEffect\([\s\S]*?\},\s*\[/);
});

test("Home mantém apenas a fronteira do bridge de tradução", () => {
  assert.match(
    pagina,
    /import useHomePageTranslations from "\.\/hooks\/use-home-page-translations";/,
  );
  assert.match(
    pagina,
    /const homeTranslationRootRef = useRef<HTMLElement \| null>\(null\);/,
  );
  assert.match(pagina, /const \{ language \} = useHistorietasLanguage\(\);/);
  assert.match(
    pagina,
    /useHomePageTranslations\(homeTranslationRootRef, language\);/,
  );
  assert.equal(
    (pagina.match(/ref=\{homeTranslationRootRef\}/g) || []).length,
    3,
  );
  assert.doesNotMatch(pagina, /const HOME_UI_TRANSLATIONS/);
  assert.doesNotMatch(pagina, /const homeTextNodeStates = new WeakMap/);
  assert.doesNotMatch(pagina, /function useHomePageTranslations/);
  assert.match(pagina, /function traduzirGeneroHome\(/);
  assert.match(pagina, /function traduzirFormatoHome\(/);
  assert.match(pagina, /function traduzirClassificacaoHome\(/);
  assert.match(pagina, /function traduzirBioAutorHome\(/);
  assert.match(
    pagina,
    /import type \{ HistorietasLanguage \} from "\.\.\/lib\/i18n";/,
  );
});
