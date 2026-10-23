import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const translationsSource = readFileSync(
  new URL("../../app/publicar/lib/publicar-option-translations.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const camposFormatoGenero = readFileSync(
  new URL("../../app/publicar/components/PublicarFormatGenreFields.tsx", import.meta.url),
  "utf8",
);
const camposTagClassificacao = readFileSync(
  new URL("../../app/publicar/components/PublicarTagClassificationFields.tsx", import.meta.url),
  "utf8",
);
const translationsJavascript = typescript.transpileModule(translationsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  traduzirFormatoPublicar,
  traduzirGeneroPublicar,
  traduzirTagPublicar,
} = await import(
  `data:text/javascript;base64,${Buffer.from(translationsJavascript).toString("base64")}`,
);

test("traduções de opções de Publicar preservam formato, gênero e tag", () => {
  assert.equal(traduzirFormatoPublicar("en", "Webnovel"), "Web novel");
  assert.equal(traduzirFormatoPublicar("es", "Mangá"), "Manga");
  assert.equal(traduzirGeneroPublicar("en", "Ficção"), "Fiction");
  assert.equal(traduzirGeneroPublicar("es", "Ação"), "Acción");
  assert.equal(traduzirTagPublicar("en", "Super-herói"), "Superhero");
  assert.equal(traduzirTagPublicar("es", "Lobisomem"), "Hombre lobo");
});

test("traduções de opções de Publicar preservam fallbacks", () => {
  assert.equal(traduzirFormatoPublicar("en", "Formato personalizado"), "Formato personalizado");
  assert.equal(traduzirGeneroPublicar("es", "Gênero personalizado"), "Gênero personalizado");
  assert.equal(traduzirTagPublicar("en", "Tag personalizada"), "Tag personalizada");
});

test("módulo de opções de Publicar mantém a fronteira pura", () => {
  for (const mapa of [
    "ROTULOS_FORMATO_PUBLICAR",
    "ROTULOS_GENERO_PUBLICAR",
    "ROTULOS_TAG_PUBLICAR",
  ]) {
    assert.match(translationsSource, new RegExp(`const ${mapa}`));
  }

  for (const helper of [
    "traduzirFormatoPublicar",
    "traduzirGeneroPublicar",
    "traduzirTagPublicar",
  ]) {
    assert.match(translationsSource, new RegExp(`export function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(pagina, /import \{ PublicarFormatGenreFields \} from "\.\/components\/PublicarFormatGenreFields";/);
  assert.match(pagina, /import \{ PublicarTagClassificationFields \} from "\.\/components\/PublicarTagClassificationFields";/);
  assert.match(camposFormatoGenero, /from "\.\.\/lib\/publicar-option-translations";/);
  assert.match(camposTagClassificacao, /from "\.\.\/lib\/publicar-option-translations";/);
  assert.match(camposFormatoGenero, /traduzirFormatoPublicar\(idioma, opcao\)/);
  assert.match(camposFormatoGenero, /traduzirGeneroPublicar\(idioma, opcao\)/);
  assert.match(camposTagClassificacao, /traduzirTagPublicar\(idioma, tag\)/);
  assert.match(pagina, /function traduzirClassificacaoPublicar\(/);
  assert.match(pagina, /obterTextoPublicar\(idioma, "livre"\)/);
  assert.doesNotMatch(translationsSource, /supabase|localStorage|useEffect|useState|window|document/);
});
