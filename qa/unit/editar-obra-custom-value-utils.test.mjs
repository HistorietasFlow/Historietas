import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-custom-value-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const normalizadorSource = readFileSync(new URL("../../lib/utils.ts", import.meta.url), "utf8");
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
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
const {
  contarLetrasNumeros,
  opcaoExiste,
  limparTextoPersonalizado,
  textoPersonalizadoValido,
  prepararValorEditavel,
} = await import(`data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`);

test("valores personalizados preservam letras, números, acentos, espaços, hífen e limites", () => {
  assert.equal(contarLetrasNumeros("Olá-123!"), 6);
  assert.equal(contarLetrasNumeros("-- !!"), 0);
  assert.equal(limparTextoPersonalizado("  Olá!   HQ_ 2-  ", 40), "Olá HQ 2- ");
  assert.equal(limparTextoPersonalizado("Ábcdef", 4), "Ábcd");
  assert.equal(textoPersonalizadoValido("Nome válido-2", 5, 20), true);
  assert.equal(textoPersonalizadoValido("Nome  2", 5, 5), false);
  assert.equal(textoPersonalizadoValido("-Nome", 2, 20), false);
  assert.equal(textoPersonalizadoValido("A-", 2, 20), false);
});

test("valores editáveis preservam opções normalizadas, fallbacks e texto personalizado", () => {
  const opcoes = ["História em quadrinhos", "Romance"];

  assert.equal(opcaoExiste(opcoes, " historia EM  quadrinhos "), true);
  assert.equal(opcaoExiste(opcoes, "Manga"), false);
  assert.deepEqual(prepararValorEditavel("Não informado", opcoes, "outro", 40), {
    selecionado: "",
    personalizado: "",
  });
  assert.deepEqual(prepararValorEditavel("Não informada", opcoes, "outro", 40), {
    selecionado: "",
    personalizado: "",
  });
  assert.deepEqual(prepararValorEditavel(" Romance ", opcoes, "outro", 40), {
    selecionado: "Romance",
    personalizado: "",
  });
  assert.deepEqual(prepararValorEditavel("  Valor!   livre-2  ", opcoes, "outro", 12), {
    selecionado: "outro",
    personalizado: "Valor livre-",
  });
});

test("Editar Obra delega somente os helpers puros de valores personalizados", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?contarLetrasNumeros,[\s\S]*?limparTextoPersonalizado,[\s\S]*?opcaoExiste,[\s\S]*?prepararValorEditavel,[\s\S]*?textoPersonalizadoValido,[\s\S]*?\} from "\.\/lib\/editar-obra-custom-value-utils";/,
  );
  for (const helper of [
    "contarLetrasNumeros",
    "opcaoExiste",
    "limparTextoPersonalizado",
    "textoPersonalizadoValido",
    "prepararValorEditavel",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.match(utilsSource, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/);
  assert.match(utilsSource, /texto\.match\(\/\[A-Za-zÀ-ÖØ-öø-ÿ0-9\]\/g\) \|\| \[\]/);
  assert.match(utilsSource, /\.trimStart\(\)/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
