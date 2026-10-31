import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const validationSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-validation.ts",
    import.meta.url,
  ),
  "utf8",
);
const textUtilsSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const createActionSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/hooks/useAdicionarCapituloCreateAction.ts",
    import.meta.url,
  ),
  "utf8",
);

const textUtilsJavascript = typescript.transpileModule(textUtilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { contarLetrasNumeros } = await import(
  `data:text/javascript;base64,${Buffer.from(textUtilsJavascript).toString("base64")}`,
);

globalThis.__adicionarCapituloValidation = { contarLetrasNumeros };
const validationJavascript = typescript.transpileModule(
  validationSource.replace(
    /import \{\r?\n  contarLetrasNumeros,\r?\n\} from "\.\/adicionar-capitulo-text-utils";/,
    "const { contarLetrasNumeros } = globalThis.__adicionarCapituloValidation;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { validarCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(validationJavascript).toString("base64")}`,
);

const mensagemTitulo =
  "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.";
const mensagemTexto =
  "O texto do capítulo precisa ter pelo menos 20 letras ou números.";

test("validação de Adicionar Capítulo preserva título automático e contagem válida", () => {
  assert.equal(
    validarCapitulo("  ab ", "a".repeat(20), 8),
    mensagemTitulo,
  );
  assert.equal(validarCapitulo("", "a".repeat(20), 8), "");
  assert.equal(validarCapitulo("  Título  ", "a".repeat(20), 8), "");
  assert.equal(
    validarCapitulo("!!!", "a".repeat(20), 8),
    mensagemTitulo,
  );
});

test("validação de Adicionar Capítulo preserva trim e mínimo de texto", () => {
  assert.equal(
    validarCapitulo("Título", "  abcdefghijklmnopqrs  ", 1),
    mensagemTexto,
  );
  assert.equal(
    validarCapitulo("Título", "  a".repeat(20).trim(), 1),
    "",
  );
  assert.equal(validarCapitulo("Título", "a".repeat(20), 1), "");
});

test("Adicionar Capítulo delega somente a validação pura ao módulo extraído", () => {
  assert.match(
    validationSource,
    /from "\.\/adicionar-capitulo-text-utils";/,
  );
  assert.doesNotMatch(pageSource, /function validarCapitulo\(/);
  assert.match(
    createActionSource,
    /const erroValidacao = validarCapitulo\(\s*titulo,\s*texto,\s*numeroNovoCapitulo[\s,]*\);/,
  );
  assert.doesNotMatch(pageSource, /async function criarCapitulo\(/);
  assert.match(createActionSource, /async function criarCapitulo\(/);
  assert.doesNotMatch(
    validationSource,
    /from\s+["']react["']|useState|useEffect|useMemo|useRef|supabase|localStorage|router/i,
  );
  assert.doesNotMatch(validationSource, /<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
