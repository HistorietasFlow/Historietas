import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const profileSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const profileJavascript = typescript.transpileModule(profileSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { obterTextoProfileAdicionarCapitulo, aplicarAutorProfileAdicionarCapitulo } =
  await import(
    `data:text/javascript;base64,${Buffer.from(profileJavascript).toString("base64")}`,
  );

test("profile de Adicionar Capítulo preserva texto seguro", () => {
  assert.equal(obterTextoProfileAdicionarCapitulo(null), "");
  assert.equal(obterTextoProfileAdicionarCapitulo(10), "");
  assert.equal(obterTextoProfileAdicionarCapitulo(""), "");
  assert.equal(obterTextoProfileAdicionarCapitulo("   "), "");
  assert.equal(obterTextoProfileAdicionarCapitulo("  Autora  "), "Autora");
});

test("profile de Adicionar Capítulo aplica autor sem alterar ownership", () => {
  const obraDoUsuario = { id: "1", autor: "Antigo", autorId: " usuario ", outro: true };
  const obraSemAutor = { id: "2", autor: "Sem autor", outro: false };
  const obraDeOutroUsuario = { id: "3", autor: "Outra", autorId: "outro" };
  const obras = [obraDoUsuario, obraSemAutor, obraDeOutroUsuario];

  assert.equal(aplicarAutorProfileAdicionarCapitulo(obras, "usuario", " "), obras);
  assert.equal(aplicarAutorProfileAdicionarCapitulo(obras, " ", "Autora"), obras);

  const atualizadas = aplicarAutorProfileAdicionarCapitulo(
    obras,
    " usuario ",
    "  Autora  ",
  );

  assert.deepEqual(atualizadas[0], {
    id: "1",
    autor: "Autora",
    autorId: "usuario",
    outro: true,
  });
  assert.deepEqual(atualizadas[1], {
    id: "2",
    autor: "Autora",
    autorId: "usuario",
    outro: false,
  });
  assert.equal(atualizadas[2], obraDeOutroUsuario);
});

test("Adicionar Capítulo delega somente os helpers puros de profile", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?aplicarAutorProfileAdicionarCapitulo,[\s\S]*?obterTextoProfileAdicionarCapitulo,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-profile-utils";/,
  );
  assert.doesNotMatch(pageSource, /function obterTextoProfileAdicionarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function aplicarAutorProfileAdicionarCapitulo\(/);
  assert.equal(
    (pageSource.match(/obterTextoProfileAdicionarCapitulo\(/g) || []).length,
    2,
  );
  assert.equal(
    (pageSource.match(/aplicarAutorProfileAdicionarCapitulo\(/g) || []).length,
    2,
  );
  assert.match(pageSource, /async function carregarNomeProfileAdicionarCapitulo\(/);
  assert.match(pageSource, /async function sincronizarAutorObraProfileAdicionarCapitulo\(/);
  assert.doesNotMatch(profileSource, /supabase|localStorage|useState|useEffect|router|<[A-Z]/);
});
