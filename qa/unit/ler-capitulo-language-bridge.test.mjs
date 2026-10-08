import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const bridge = readFileSync(
  new URL(
    "../../app/ler-capitulo/components/ler-capitulo-language-bridge.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ler-capitulo/page.tsx", import.meta.url),
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
const { traduzirTextoLerCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(bridgeJavascript).toString("base64")}`,
);

test("executa as traduções estáticas e preserva português, vazio e espaços", () => {
  assert.equal(traduzirTextoLerCapitulo("Carregando", "pt-BR"), "Carregando");
  assert.equal(traduzirTextoLerCapitulo("", "en"), "");
  assert.equal(
    traduzirTextoLerCapitulo("  Carregando  ", "en"),
    "  Loading  ",
  );
  assert.equal(
    traduzirTextoLerCapitulo("Carregando", "es"),
    "Cargando",
  );
  assert.equal(
    traduzirTextoLerCapitulo("Texto sem mapeamento", "en"),
    "Texto sem mapeamento",
  );
});

test("executa todas as regras dinâmicas da tradução do leitor", () => {
  assert.equal(
    traduzirTextoLerCapitulo("Notifica\u00e7\u00f5es: 3 n\u00e3o lidas", "en"),
    "Notifications: 3 unread",
  );
  assert.equal(
    traduzirTextoLerCapitulo("Lido em maio de 2026", "es"),
    "Le\u00eddo el maio de 2026",
  );
  assert.equal(traduzirTextoLerCapitulo("Fonte 18", "en"), "Font 18");
  assert.equal(
    traduzirTextoLerCapitulo("Usar fonte 18", "es"),
    "Usar tama\u00f1o de fuente 18",
  );
  assert.equal(
    traduzirTextoLerCapitulo("2 coment\u00e1rios", "en"),
    "2 comments",
  );
  assert.equal(
    traduzirTextoLerCapitulo("Ver 1 resposta", "en"),
    "View 1 reply",
  );
  assert.equal(
    traduzirTextoLerCapitulo("Ver 2 respostas", "es"),
    "Ver 2 respuestas",
  );
  assert.equal(
    traduzirTextoLerCapitulo("Ver mais 2 respostas", "en"),
    "View 2 more replies",
  );
  assert.equal(
    traduzirTextoLerCapitulo("Adicionar Ana ao coment\u00e1rio", "en"),
    "Add Ana to the comment",
  );
  assert.equal(
    traduzirTextoLerCapitulo("Abrir perfil de Ana", "es"),
    "Abrir el perfil de Ana",
  );
  assert.equal(traduzirTextoLerCapitulo("h\u00e1 1 segundo", "en"), "1 second ago");
  assert.equal(traduzirTextoLerCapitulo("h\u00e1 2 minutos", "en"), "2 minutes ago");
  assert.equal(traduzirTextoLerCapitulo("h\u00e1 1 hora", "es"), "hace 1 hora");
  assert.equal(traduzirTextoLerCapitulo("h\u00e1 2 dias", "es"), "hace 2 d\u00edas");
  assert.equal(
    traduzirTextoLerCapitulo("Come\u00e7ou a ler Aurora", "en"),
    "Started reading Aurora",
  );
  assert.equal(traduzirTextoLerCapitulo("Salvou Aurora", "es"), "Guard\u00f3 Aurora");
  assert.equal(traduzirTextoLerCapitulo("Leu Aurora", "en"), "Read Aurora");
});

test("preserva o lifecycle, filtro de nós e cleanup do bridge", () => {
  assert.match(bridge, /^"use client";/);
  assert.match(bridge, /const \{ language \} = useHistorietasLanguage\(\);/);
  assert.match(bridge, /if \(typeof document === "undefined"\) \{/);
  assert.match(
    bridge,
    /\[data-historietas-ler-capitulo-root='true'\], \[data-historietas-ler-capitulo-comments-root='true'\]/,
  );
  assert.match(bridge, /const estadosTexto: WeakMap<Text,/);
  assert.match(bridge, /const estadosAtributos: WeakMap</);
  assert.match(bridge, /const textosAlterados = new Set<Text>\(\);/);
  assert.match(bridge, /const atributosAlterados: Array/);
  assert.match(
    bridge,
    /const atributosTraduziveis = \["aria-label", "title", "placeholder", "alt"\];/,
  );
  assert.match(bridge, /let aplicando = false;/);
  assert.match(bridge, /tag === "script" \|\| tag === "style"/);
  assert.match(bridge, /tagName\.toLowerCase\(\) === "textarea"/);
  assert.match(bridge, /NodeFilter\.SHOW_ELEMENT \| NodeFilter\.SHOW_TEXT/);
  assert.match(bridge, /if \(mutacao\.type === "characterData"\)/);
  assert.match(bridge, /if \(mutacao\.type === "attributes"/);
  assert.match(bridge, /mutacao\.addedNodes\.forEach/);
  assert.match(
    bridge,
    /observador\.observe\(document\.body, \{\s*subtree: true,\s*childList: true,\s*characterData: true,\s*attributes: true,\s*attributeFilter: atributosTraduziveis,\s*\}\);/,
  );
  assert.match(bridge, /observador\.disconnect\(\);/);
  assert.match(bridge, /no\.isConnected && no\.data === estado\.traduzido/);
  assert.match(
    bridge,
    /registro\.elemento\.isConnected[\s\S]*?getAttribute\(registro\.atributo\) === estado\.traduzido/,
  );
  assert.match(bridge, /\}, \[language\]\);/);
  assert.match(bridge, /return null;/);
});

test("a página mantém apenas os três mounts e continua dona do idioma", () => {
  assert.match(
    pagina,
    /import \{ LerCapituloLanguageBridge \} from "\.\/components\/ler-capitulo-language-bridge";/,
  );
  assert.match(pagina, /const \{ language \} = useHistorietasLanguage\(\);/);
  assert.equal(
    (pagina.match(/<LerCapituloLanguageBridge \/>/g) || []).length,
    3,
  );
  assert.doesNotMatch(pagina, /const LER_CAPITULO_UI_TRANSLATIONS/);
  assert.doesNotMatch(pagina, /function traduzirTextoLerCapitulo\(/);
  assert.doesNotMatch(pagina, /function LerCapituloLanguageBridge\(/);
  assert.doesNotMatch(
    pagina,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/lib\/i18n";/,
  );
});
