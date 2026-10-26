import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/login/lib/login-work-storage-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);

const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  normalizarObrasStorageLogin,
  obterTextoRegistroLogin,
  obterAutorIdObraLogin,
  obraPertenceAoUsuarioLogin,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("normalizarObrasStorageLogin mantém somente objetos de obras e as referências", () => {
  const obra = { id: "obra-1" };
  const outraObra = { id: "obra-2" };
  const normalizadas = normalizarObrasStorageLogin([
    obra,
    null,
    ["não é obra"],
    "texto",
    outraObra,
  ]);

  assert.deepEqual(normalizadas, [obra, outraObra]);
  assert.equal(normalizadas[0], obra);
  assert.equal(normalizadas[1], outraObra);
  assert.deepEqual(normalizarObrasStorageLogin({}), []);
});

test("helpers de autoria preservam strings trimadas e a prioridade dos quatro campos", () => {
  assert.equal(obterTextoRegistroLogin({ autorId: "  autor-1  " }, "autorId"), "autor-1");
  assert.equal(obterTextoRegistroLogin({ autorId: 1 }, "autorId"), "");
  assert.equal(
    obterAutorIdObraLogin({
      autorId: "  primeiro  ",
      user_id: "segundo",
      userId: "terceiro",
      autor_id: "quarto",
    }),
    "primeiro",
  );
  assert.equal(
    obterAutorIdObraLogin({
      autorId: "   ",
      user_id: " segundo ",
      userId: "terceiro",
      autor_id: "quarto",
    }),
    "segundo",
  );
  assert.equal(obterAutorIdObraLogin({ userId: " terceiro ", autor_id: "quarto" }), "terceiro");
  assert.equal(obterAutorIdObraLogin({ autor_id: " quarto " }), "quarto");
});

test("obraPertenceAoUsuarioLogin exige valores não vazios e comparação exata trimada", () => {
  assert.equal(obraPertenceAoUsuarioLogin({ autorId: " usuario-1 " }, " usuario-1 "), true);
  assert.equal(obraPertenceAoUsuarioLogin({ autorId: "usuario-1" }, "usuario-2"), false);
  assert.equal(obraPertenceAoUsuarioLogin({ autorId: "" }, "usuario-1"), false);
  assert.equal(obraPertenceAoUsuarioLogin({ autorId: "usuario-1" }, "   "), false);
  assert.equal(obraPertenceAoUsuarioLogin({ autorId: "USUARIO-1" }, "usuario-1"), false);
});

test("Login delega normalização e ownership de obras ao módulo puro", () => {
  assert.match(source, /typeof obra === "object" && !Array\.isArray\(obra\)/);
  assert.match(source, /obterTextoRegistroLogin\(obra, "autorId"\)/);
  assert.match(source, /obterTextoRegistroLogin\(obra, "user_id"\)/);
  assert.match(source, /obterTextoRegistroLogin\(obra, "userId"\)/);
  assert.match(source, /obterTextoRegistroLogin\(obra, "autor_id"\)/);
  assert.doesNotMatch(source, /react|supabase|localStorage|router/i);
  assert.doesNotMatch(
    source,
    /<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
  assert.match(
    pageSource,
    /from "\.\/lib\/login-work-storage-utils";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarObrasStorageLogin\(/);
  assert.doesNotMatch(pageSource, /function obterTextoRegistroLogin\(/);
  assert.doesNotMatch(pageSource, /function obterAutorIdObraLogin\(/);
  assert.doesNotMatch(pageSource, /function obraPertenceAoUsuarioLogin\(/);
  assert.match(pageSource, /function sincronizarStorageUsuarioLogin\(/);
  assert.match(pageSource, /normalizarObrasStorageLogin\(/);
  assert.match(pageSource, /obterAutorIdObraLogin\(obra\)/);
  assert.match(pageSource, /obraPertenceAoUsuarioLogin\(obra, userIdLimpo\)/);
});
