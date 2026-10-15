import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-format-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const cardAutor = readFileSync(
  new URL("../../components/HomeAuthorCard.tsx", import.meta.url),
  "utf8",
);
const cardObraLocal = readFileSync(
  new URL("../../app/lib/home-local-work-card-view-utils.ts", import.meta.url),
  "utf8",
);
const normalizadoresSupabase = readFileSync(
  new URL("../../app/lib/home-supabase-work-normalizers.ts", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo
  .replace(/\r\n/g, "\n")
  .replace('import type { HistorietasLanguage } from "../../lib/i18n";\n', "");
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  compactarNumeroHome,
  formatarMediaAvaliacaoAutorHome,
  normalizarNumeroHome,
  obterLocaleHomeAtual,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function comIdiomaDocumento(idioma, callback) {
  const descritorOriginal = Object.getOwnPropertyDescriptor(globalThis, "document");

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { documentElement: { lang: idioma } },
  });

  try {
    return callback();
  } finally {
    if (descritorOriginal) {
      Object.defineProperty(globalThis, "document", descritorOriginal);
    } else {
      delete globalThis.document;
    }
  }
}

test("home-format-utils preserva parsing, limites e fallback numérico", () => {
  assert.match(
    modulo,
    /export type AvaliacaoAutorHome = \{\s*media: number;\s*total: number;\s*\};/,
  );
  assert.equal(normalizarNumeroHome(4.6), 5);
  assert.equal(normalizarNumeroHome(-4), 0);
  assert.equal(normalizarNumeroHome("1.234,5"), 1235);
  assert.equal(normalizarNumeroHome("inválido", 9), 9);
  assert.equal(normalizarNumeroHome(Infinity, 7), 7);
  assert.match(modulo, /Math\.max\(0, Math\.round\(valor\)\)/);
  assert.match(modulo, /Number\.isFinite\(numero\)/);
});

test("home-format-utils preserva locale, compactação e avaliação", () => {
  assert.deepEqual(
    comIdiomaDocumento("en-US", () => obterLocaleHomeAtual()),
    { locale: "en-US", language: "en" },
  );
  assert.deepEqual(
    comIdiomaDocumento("es-MX", () => obterLocaleHomeAtual()),
    { locale: "es-ES", language: "es" },
  );
  assert.deepEqual(
    comIdiomaDocumento("", () => obterLocaleHomeAtual()),
    { locale: "pt-BR", language: "pt-BR" },
  );
  assert.equal(comIdiomaDocumento("en", () => compactarNumeroHome(1500)), "1.5K");
  assert.equal(comIdiomaDocumento("es", () => compactarNumeroHome(1500000)), "1,5 M");
  assert.equal(comIdiomaDocumento("pt-BR", () => compactarNumeroHome(1500000)), "1,5 mi");
  assert.equal(formatarMediaAvaliacaoAutorHome(undefined), "—");
  assert.equal(
    comIdiomaDocumento("en", () =>
      formatarMediaAvaliacaoAutorHome({ media: 4.45, total: 2 }),
    ),
    "4.5",
  );
  assert.match(modulo, /minimumFractionDigits: 0,/);
  assert.match(modulo, /maximumFractionDigits: 1,/);
  assert.match(modulo, /document\.documentElement\.lang/);
});

test("Home delega formatação numérica e mantém os consumidores", () => {
  assert.match(
    pagina,
    /import \{ compactarNumeroHome \} from "\.\/lib\/home-format-utils";/,
  );
  for (const nomeFuncao of [
    "normalizarNumeroHome",
    "obterLocaleHomeAtual",
    "compactarNumeroHome",
    "formatarMediaAvaliacaoAutorHome",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.match(cardObraLocal, /import \{ compactarNumeroHome \} from "\.\/home-format-utils";/);
  assert.match(cardObraLocal, /compactarNumeroHome\(obra\.visualizacoes \|\| 0\)/);
  assert.doesNotMatch(pagina, /formatarMediaAvaliacaoAutorHome\(avaliacao\)/);
  assert.match(
    cardAutor,
    /import \{ formatarMediaAvaliacaoAutorHome \} from "\.\.\/app\/lib\/home-format-utils";/,
  );
  assert.match(cardAutor, /formatarMediaAvaliacaoAutorHome\(avaliacao\)/);
  assert.match(
    normalizadoresSupabase,
    /import \{ normalizarNumeroHome \} from "\.\/home-format-utils";/,
  );
  assert.match(normalizadoresSupabase, /normalizarNumeroHome\(obra\.visualizacoes\)/);
});
