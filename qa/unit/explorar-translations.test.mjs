import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/explorar/lib/explorar-translations.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);
const derivados = readFileSync(
  new URL("../../app/explorar/lib/explorar-derived-utils.ts", import.meta.url),
  "utf8",
);
const utils = readFileSync(new URL("../../lib/utils.ts", import.meta.url), "utf8");
const options = {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
};
const utilsJs = typescript.transpileModule(utils, options).outputText;
const utilsUrl = `data:text/javascript;base64,${Buffer.from(utilsJs).toString("base64")}`;
const moduloExecutavel = modulo.replace(
  '"../../../lib/utils"',
  JSON.stringify(utilsUrl),
) + `\nexport { EXPLORAR_UI_TRANSLATIONS, EXPLORAR_GENRE_TRANSLATIONS,
  EXPLORAR_FORMAT_TRANSLATIONS, EXPLORAR_CLASSIFICATION_TRANSLATIONS };\n`;
const moduloJs = typescript.transpileModule(moduloExecutavel, options).outputText;
const {
  EXPLORAR_UI_TRANSLATIONS,
  EXPLORAR_GENRE_TRANSLATIONS,
  EXPLORAR_FORMAT_TRANSLATIONS,
  EXPLORAR_CLASSIFICATION_TRANSLATIONS,
  obterLocaleExplorar,
  traduzirTextoExplorar,
  traduzirGeneroExplorar,
  traduzirFormatoExplorar,
  traduzirClassificacaoExplorar,
} = await import(`data:text/javascript;base64,${Buffer.from(moduloJs).toString("base64")}`);

test("traduções literais preservam todos os valores nos três idiomas", () => {
  for (const [texto, traducoes] of Object.entries(EXPLORAR_UI_TRANSLATIONS)) {
    assert.equal(traduzirTextoExplorar(texto, "pt-BR"), texto);
    assert.equal(traduzirTextoExplorar(texto, "en"), traducoes.en, texto);
    assert.equal(traduzirTextoExplorar(texto, "es"), traducoes.es, texto);
  }
  assert.equal(traduzirTextoExplorar("Carregando Explorar", "en"), "Loading Explore");
  assert.equal(traduzirTextoExplorar("Conteúdo 18+", "es"), "Contenido 18+");
  assert.equal(traduzirTextoExplorar("Explorar", "en"), "Explore");
  assert.equal(traduzirTextoExplorar("Texto desconhecido", "en"), "Texto desconhecido");
  assert.equal(traduzirTextoExplorar(" Explorar ", "en"), " Explorar ");
});

test("mensagens dinâmicas mantêm interpolação, gêneros e fallbacks", () => {
  for (const [entrada, en, es] of [
    ["Explorar (42)", "Explore (42)", "Explorar (42)"],
    ["Publicações em Ação", "Publications in Action", "Publicaciones de Acción"],
    ["Autores de Fantasia", "Fantasy authors", "Autores de Fantasía"],
    ["Capítulo 12", "Chapter 12", "Capítulo 12"],
    ["Publicações em Desconhecido", "Publications in Desconhecido", "Publicaciones de Desconhecido"],
  ]) {
    assert.equal(traduzirTextoExplorar(entrada, "pt-BR"), entrada);
    assert.equal(traduzirTextoExplorar(entrada, "en"), en);
    assert.equal(traduzirTextoExplorar(entrada, "es"), es);
  }
  assert.equal(traduzirTextoExplorar("Capítulo X", "en"), "Capítulo X");
  assert.equal(traduzirTextoExplorar("Explorar (-1)", "en"), "Explorar (-1)");
});

test("gênero, formato, classificação e locales preservam as tabelas e normalização", () => {
  for (const [tabela, traduzir] of [
    [EXPLORAR_GENRE_TRANSLATIONS, traduzirGeneroExplorar],
    [EXPLORAR_FORMAT_TRANSLATIONS, traduzirFormatoExplorar],
    [EXPLORAR_CLASSIFICATION_TRANSLATIONS, traduzirClassificacaoExplorar],
  ]) {
    for (const [chave, traducoes] of Object.entries(tabela)) {
      assert.equal(traduzir(chave, "pt-BR"), chave);
      assert.equal(traduzir(chave, "en"), traducoes.en, chave);
      assert.equal(traduzir(chave, "es"), traducoes.es, chave);
    }
  }
  assert.equal(traduzirGeneroExplorar("  AÇÃO  ", "en"), "Action");
  assert.equal(traduzirFormatoExplorar("  Light   Novel ", "es"), "Novela ligera");
  assert.equal(traduzirClassificacaoExplorar("Não informada", "en"), "Not provided");
  assert.equal(traduzirGeneroExplorar("Explorar", "en"), "Explore");
  assert.equal(traduzirFormatoExplorar("Explorar", "en"), "Explore");
  assert.equal(traduzirClassificacaoExplorar("Explorar", "en"), "Explorar");
  assert.equal(traduzirGeneroExplorar(" Gênero desconhecido ", "es"), " Gênero desconhecido ");
  assert.equal(obterLocaleExplorar("pt-BR"), "pt-BR");
  assert.equal(obterLocaleExplorar("en"), "en-US");
  assert.equal(obterLocaleExplorar("es"), "es-ES");
});

test("a página delega a tradução a uma fronteira pura", () => {
  assert.match(modulo, /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/lib\/i18n"/);
  assert.match(modulo, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils"/);
  assert.match(pagina, /from "\.\/lib\/explorar-translations"/);
  for (const nome of ["obterLocaleExplorar", "traduzirTextoExplorar", "traduzirGeneroExplorar", "traduzirFormatoExplorar", "traduzirClassificacaoExplorar"]) {
    assert.match(modulo, new RegExp(`export function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\(`));
    const consumidor = nome === "obterLocaleExplorar" ? derivados : pagina;
    assert.match(consumidor, new RegExp(`\\b${nome}\\(`));
  }
  assert.match(derivados, /import \{ obterLocaleExplorar \} from "\.\/explorar-translations"/);
  assert.doesNotMatch(pagina, /(?:type ExplorarTranslationEntry|const EXPLORAR_\w+_TRANSLATIONS)/);
  assert.doesNotMatch(modulo, /(?:from ["']react["']|\buse[A-Z]\w*\b|\bsupabase\b|localStorage|\bwindow\b|\bdocument\b)/i);
});
