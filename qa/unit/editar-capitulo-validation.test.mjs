import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const validationSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-validation.ts",
    import.meta.url,
  ),
  "utf8",
);
const textUtilsSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/hooks/useEditarCapituloSaveAction.ts",
    import.meta.url,
  ),
  "utf8",
);
const transpilar = (source) =>
  typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const textUtilsDataUrl = `data:text/javascript;base64,${Buffer.from(
  transpilar(textUtilsSource),
).toString("base64")}`;
const validationJavascript = transpilar(
  validationSource.replace("./editar-capitulo-text-utils", textUtilsDataUrl),
);
const { validarCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(validationJavascript).toString("base64")}`,
);

test("validação de capítulo preserva títulos, texto e prioridade atuais", () => {
  assert.equal(
    validarCapitulo("  Título válido  ", "a".repeat(20), 4),
    "",
  );
  assert.equal(validarCapitulo("", "a".repeat(20), 4), "");
  assert.equal(validarCapitulo("   ", "a".repeat(20), 4), "");
  assert.equal(
    validarCapitulo("ab", "a".repeat(19), 4),
    "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.",
  );
  assert.equal(
    validarCapitulo("Título", `  ${"a".repeat(19)}  `, 4),
    "O texto do capítulo precisa ter pelo menos 20 letras ou números.",
  );
  assert.equal(
    validarCapitulo("Título 2", "áç1".repeat(7), 4),
    "",
  );
  assert.equal(
    validarCapitulo("---", "a".repeat(20), 4),
    "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.",
  );
});

test("Editar Capítulo delega somente a validação pura do capítulo", () => {
  assert.match(
    validationSource,
    /import \{ contarLetrasNumeros \} from "\.\/editar-capitulo-text-utils";/,
  );
  assert.match(
    validationSource,
    /const tituloFinal = titulo\.trim\(\) \|\| `Capítulo \$\{numeroCapitulo\}`;/,
  );
  assert.match(validationSource, /const textoLimpo = texto\.trim\(\);/);
  assert.match(
    saveActionSource,
    /import \{ validarCapitulo \} from "\.\.\/lib\/editar-capitulo-validation";/,
  );
  assert.match(pageSource, /const \{ salvarEdicao \} = useEditarCapituloSaveAction\(/);
  assert.doesNotMatch(pageSource, /function validarCapitulo\(/);
  assert.match(
    saveActionSource,
    /async function salvarEdicao\([\s\S]*?const erroValidacao = validarCapitulo\(\s*titulo,\s*texto,\s*numeroCapitulo,\s*\);/,
  );
  assert.doesNotMatch(validationSource, /supabase|localStorage|useState|useEffect|router|<\w+/);
});
