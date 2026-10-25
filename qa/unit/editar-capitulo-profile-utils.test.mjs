import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const profileUtilsSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const profileUtilsJavascript = typescript.transpileModule(profileUtilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  obterNomeProfileEditarCapitulo,
  aplicarNomeAutorProfileEditarCapitulo,
} = await import(
  `data:text/javascript;base64,${Buffer.from(profileUtilsJavascript).toString("base64")}`,
);

test("parser de profile de Editar Capitulo preserva validacao e trim", () => {
  [null, undefined, "nome", 1, true, [], ["nome"]].forEach((profile) => {
    assert.equal(obterNomeProfileEditarCapitulo(profile), "");
  });
  assert.equal(obterNomeProfileEditarCapitulo({}), "");
  assert.equal(obterNomeProfileEditarCapitulo({ nome: 1 }), "");
  assert.equal(obterNomeProfileEditarCapitulo({ nome: "  Nome do profile  " }), "Nome do profile");
});

test("aplicacao de profile preserva referencias, ownership e autorId", () => {
  const obras = [
    { id: "sem-autor", autor: "Autor local" },
    { id: "proprio", autor: "Autor local", autorId: " usuario " },
    { id: "outro", autor: "Outro autor", autorId: "outro-usuario" },
  ];

  assert.strictEqual(
    aplicarNomeAutorProfileEditarCapitulo(obras, " ", "Nome profile"),
    obras,
  );
  assert.strictEqual(
    aplicarNomeAutorProfileEditarCapitulo(obras, "usuario", " "),
    obras,
  );

  const atualizadas = aplicarNomeAutorProfileEditarCapitulo(
    obras,
    " usuario ",
    " Nome profile ",
  );

  assert.deepEqual(atualizadas[0], {
    id: "sem-autor",
    autor: "Nome profile",
    autorId: "usuario",
  });
  assert.deepEqual(atualizadas[1], {
    id: "proprio",
    autor: "Nome profile",
    autorId: "usuario",
  });
  assert.strictEqual(atualizadas[2], obras[2]);
  assert.deepEqual(atualizadas[2], {
    id: "outro",
    autor: "Outro autor",
    autorId: "outro-usuario",
  });
});

test("Editar Capitulo delega apenas helpers puros de profile", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?aplicarNomeAutorProfileEditarCapitulo,[\s\S]*?obterNomeProfileEditarCapitulo,[\s\S]*?\} from "\.\/lib\/editar-capitulo-profile-utils";/,
  );
  assert.doesNotMatch(pageSource, /function obterNomeProfileEditarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function aplicarNomeAutorProfileEditarCapitulo\(/);
  assert.match(pageSource, /async function carregarNomeProfileEditarCapitulo\(/);
  assert.match(
    pageSource,
    /\.eq\("user_id", userIdLimpo\)[\s\S]*?\.maybeSingle\(\)[\s\S]*?\.eq\("id", userIdLimpo\)[\s\S]*?\.maybeSingle\(\)/,
  );
  assert.match(
    pageSource,
    /obterNomeProfileEditarCapitulo\(profilePorUserId\)[\s\S]*?obterNomeProfileEditarCapitulo\(profilePorId\)/,
  );
  assert.equal(
    (pageSource.match(/aplicarNomeAutorProfileEditarCapitulo\(/g) || []).length,
    2,
  );
  assert.doesNotMatch(profileUtilsSource, /supabase|\.from\(|useState|useEffect|localStorage|router/);
});
