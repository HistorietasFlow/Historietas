import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-format-utils.ts", import.meta.url),
  "utf8",
);
const normalizadorSource = readFileSync(new URL("../../lib/utils.ts", import.meta.url), "utf8");
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const formPreparationSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-form-preparation.ts",
    import.meta.url,
  ),
  "utf8",
);
const compilerOptions = {
  module: typescript.ModuleKind.ESNext,
  target: typescript.ScriptTarget.ES2022,
};
const normalizadorJavascript = typescript.transpileModule(normalizadorSource, {
  compilerOptions,
}).outputText;
const normalizadorUrl = `data:text/javascript;base64,${Buffer.from(normalizadorJavascript).toString("base64")}`;
const utilsJavascript = typescript
  .transpileModule(utilsSource, { compilerOptions })
  .outputText.replace('from "../../../lib/utils"', `from "${normalizadorUrl}"`);
const { formatarFormatoEdicaoObra, formatarGeneroEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("formatador de formato preserva espaços, aliases de HQ/Mangá e fallback", () => {
  assert.equal(formatarFormatoEdicaoObra(""), "Não informado");
  assert.equal(formatarFormatoEdicaoObra("  HQ/Mangá  "), "HQ");
  assert.equal(formatarFormatoEdicaoObra("hq manga"), "HQ");
  assert.equal(formatarFormatoEdicaoObra("HQ-Manga"), "HQ");
  assert.equal(formatarFormatoEdicaoObra("  Webtoon  "), "Webtoon");
});

test("formatador de gênero preserva aliases e valores comuns", () => {
  assert.equal(formatarGeneroEdicaoObra(""), "Não informado");
  assert.equal(formatarGeneroEdicaoObra("  Fantasia Sombria  "), "Fantasia");
  assert.equal(formatarGeneroEdicaoObra("sci-fi"), "Ficção");
  assert.equal(formatarGeneroEdicaoObra("sci fi"), "Ficção");
  assert.equal(formatarGeneroEdicaoObra("  Drama  "), "Drama");
});

test("Editar Obra delega somente os formatadores puros", () => {
  assert.match(
    formPreparationSource,
    /import \{[\s\S]*?formatarFormatoEdicaoObra,[\s\S]*?formatarGeneroEdicaoObra,[\s\S]*?\} from "\.\/editar-obra-format-utils";/,
  );
  assert.doesNotMatch(pageSource, /function formatarFormatoEdicaoObra\(/);
  assert.doesNotMatch(pageSource, /function formatarGeneroEdicaoObra\(/);
  assert.match(utilsSource, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/);
  assert.match(utilsSource, /\.normalize\("NFD"\)/);
  assert.match(utilsSource, /formatoSemAcento === "hq\/manga"/);
  assert.match(utilsSource, /generoNormalizado === "fantasia sombria"/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
