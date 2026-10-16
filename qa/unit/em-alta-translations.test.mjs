import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/em-alta/lib/em-alta-translations.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const javascriptModulo = typescript.transpileModule(modulo, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { traduzirTextoEmAlta } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

test("traduções puras de Em Alta preservam o mapa literal", () => {
  assert.match(modulo, /const EM_ALTA_UI_TRANSLATIONS: Record<string, TraducaoEmAlta> = \{/);

  for (const texto of [
    '"Carregando Em Alta": { en: "Loading Trending", es: "Cargando Tendencias" }',
    '"Ranking Mestre": { en: "Master Ranking", es: "Ranking Maestro" }',
    '"Autores em Alta": { en: "Trending Authors", es: "Autores en Tendencia" }',
    '"Ainda não há obras publicadas": { en: "There are no published works yet", es: "Todavía no hay obras publicadas" }',
    '"Obra Publicada": { en: "Published Work", es: "Obra Publicada" }',
    '"Obras Publicadas": { en: "Published Works", es: "Obras Publicadas" }',
    '"Diamante": { en: "Diamond", es: "Diamante" }',
    '"Rubi": { en: "Ruby", es: "Rubí" }',
    '"Livre": { en: "All ages", es: "Todo público" }',
  ]) {
    assert.ok(modulo.includes(texto), texto);
  }
});

test("traduções puras preservam mensagens dinâmicas, datas e whitespace", () => {
  assert.equal(
    traduzirTextoEmAlta("Notificações: 2 não lidas", "en"),
    "Notifications: 2 unread",
  );
  assert.equal(
    traduzirTextoEmAlta("Abrir perfil de Ana", "es"),
    "Abrir el perfil de Ana",
  );
  assert.equal(
    traduzirTextoEmAlta("Abrir página da obra Aurora", "en"),
    "Open the page for Aurora",
  );
  assert.equal(
    traduzirTextoEmAlta("Voltar carrossel Autores em Alta", "en"),
    "Previous Trending Authors carousel",
  );
  assert.equal(
    traduzirTextoEmAlta("Avançar carrossel Ranking Mestre", "es"),
    "Avanzar carrusel de Ranking Maestro",
  );
  assert.equal(
    traduzirTextoEmAlta("Posição 1º — Diamante", "en"),
    "Position 1 — Diamond",
  );
  assert.equal(traduzirTextoEmAlta("1 Obra Publicada", "en"), "1 Published Work");
  assert.equal(traduzirTextoEmAlta("2 Obras Publicadas", "en"), "2 Published Works");
  assert.equal(traduzirTextoEmAlta("1 visualização", "en"), "1 view");
  assert.equal(traduzirTextoEmAlta("2 curtidas", "en"), "2 likes");
  assert.equal(traduzirTextoEmAlta("3 comentários", "en"), "3 comments");
  assert.equal(traduzirTextoEmAlta("4 seguidores", "en"), "4 followers");
  assert.equal(traduzirTextoEmAlta("5 capítulos", "en"), "5 chapters");
  assert.equal(traduzirTextoEmAlta("03/12/2026", "en"), "12/03/2026");
  assert.equal(traduzirTextoEmAlta("03/12/2026", "es"), "03/12/2026");
  assert.equal(
    traduzirTextoEmAlta("  Carregando Em Alta  ", "en"),
    "  Loading Trending  ",
  );
  assert.equal(traduzirTextoEmAlta("Carregando Em Alta", "pt-BR"), "Carregando Em Alta");
  assert.equal(traduzirTextoEmAlta("Texto desconhecido", "es"), "Texto desconhecido");
});

test("Em Alta delega as traduções e preserva o bridge local", () => {
  assert.match(
    pagina,
    /import \{ traduzirTextoEmAlta \} from "\.\/lib\/em-alta-translations";/,
  );
  assert.doesNotMatch(pagina, /type TraducaoEmAlta = \{/);
  assert.doesNotMatch(pagina, /const EM_ALTA_UI_TRANSLATIONS/);
  assert.doesNotMatch(pagina, /function traduzirDataEmAlta\(/);
  assert.doesNotMatch(pagina, /function traduzirTextoEmAlta\(/);
  assert.match(pagina, /function EmAltaLanguageBridge\(\)/);
  assert.match(pagina, /traduzirTextoEmAlta\(estado\.original, language\)/);
});

test("módulo de traduções permanece puro e sem runtime de UI ou persistência", () => {
  assert.match(
    modulo,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/lib\/i18n";/,
  );
  assert.doesNotMatch(modulo, /from ["']react["']/i);
  assert.doesNotMatch(modulo, /\buse[A-Z]\w*\b/);
  assert.doesNotMatch(modulo, /\b(document|MutationObserver|TreeWalker)\b/);
  assert.doesNotMatch(modulo, /supabase/i);
  assert.doesNotMatch(modulo, /localStorage/);
});
