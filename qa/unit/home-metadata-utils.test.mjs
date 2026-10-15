import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-metadata-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const cardAutor = readFileSync(
  new URL("../../components/HomeAuthorCard.tsx", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo
  .replace(/\r\n/g, "\n")
  .replace('import type { HistorietasLanguage } from "../../lib/i18n";\n', "")
  .replace(
    'import { normalizarTexto } from "../../lib/utils";\n',
    'const normalizarTexto = (valor) => String(valor || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();\n',
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  HOME_FORMAT_TRANSLATIONS,
  HOME_GENRE_TRANSLATIONS,
  formatarGeneroHome,
  traduzirBioAutorHome,
  traduzirClassificacaoHome,
  traduzirFormatoHome,
  traduzirGeneroHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

test("home-metadata-utils preserva normalizações e tabelas de metadados", () => {
  assert.match(
    modulo,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/lib\/i18n";/,
  );
  assert.match(
    modulo,
    /import \{ normalizarTexto \} from "\.\.\/\.\.\/lib\/utils";/,
  );
  assert.equal(formatarGeneroHome(" fantasia sombria "), "Fantasia");
  assert.equal(formatarGeneroHome("cyberpunk"), "Ficção");
  assert.equal(formatarGeneroHome("  "), "Não informado");
  assert.deepEqual(HOME_GENRE_TRANSLATIONS.fantasia, {
    en: "Fantasy",
    es: "Fantasía",
  });
  assert.deepEqual(HOME_FORMAT_TRANSLATIONS["leitura online"], {
    en: "Online reading",
    es: "Lectura en línea",
  });
});

test("home-metadata-utils preserva traduções, regexes e fallbacks", () => {
  assert.equal(traduzirGeneroHome("sci-fi", "en"), "Fiction");
  assert.equal(traduzirGeneroHome("Terror", "es"), "Terror");
  assert.equal(traduzirFormatoHome(" poesia ", "en"), "Poetry");
  assert.equal(traduzirFormatoHome("", "pt-BR"), "História");
  assert.equal(traduzirClassificacaoHome("Livre", "en"), "All ages");
  assert.equal(traduzirClassificacaoHome("Leitores", "es"), "Lectores");
  assert.equal(traduzirClassificacaoHome("Não informada", "en"), "Not provided");
  assert.equal(traduzirClassificacaoHome("16 anos", "es"), "16+");
  assert.equal(
    traduzirBioAutorHome("Autor de Fantasia na Historietas.", "en"),
    "Author of fantasy on Historietas.",
  );
  assert.equal(
    traduzirBioAutorHome("Biografia livre", "es"),
    "Biografia livre",
  );
  assert.match(modulo, /toLocaleLowerCase\(idioma === "en" \? "en" : "es"\)/);
  assert.match(modulo, /bio\.match\(\/\^Autor de \(\.\+\) na Historietas\\\.\$\/i\)/);
});

test("Home delega os metadados e mantém seus consumidores", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?formatarGeneroHome,[\s\S]*?traduzirClassificacaoHome,[\s\S]*?traduzirFormatoHome,[\s\S]*?traduzirGeneroHome,[\s\S]*?\} from "\.\/lib\/home-metadata-utils";/,
  );
  for (const nomeFuncao of [
    "formatarGeneroHome",
    "traduzirGeneroHome",
    "traduzirFormatoHome",
    "traduzirClassificacaoHome",
    "traduzirBioAutorHome",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.doesNotMatch(pagina, /const HOME_GENRE_TRANSLATIONS/);
  assert.doesNotMatch(pagina, /const HOME_FORMAT_TRANSLATIONS/);
  assert.match(pagina, /traduzirGeneroHome\(heroObra\.genero, language\)/);
  assert.match(
    pagina,
    /traduzirClassificacaoHome\(heroObra\.classificacaoIndicativa, language\)/,
  );
  assert.doesNotMatch(pagina, /traduzirBioAutorHome\(autor\.bio, language\)/);
  assert.match(
    cardAutor,
    /import \{ traduzirBioAutorHome, traduzirGeneroHome \} from "\.\.\/app\/lib\/home-metadata-utils";/,
  );
  assert.match(cardAutor, /traduzirBioAutorHome\(autor\.bio, language\)/);
});
