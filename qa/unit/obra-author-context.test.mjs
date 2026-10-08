import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const textosObraTypescript = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
).replace(
  /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";\r?\n/,
  "",
);
const textosObraJavascript = typescript.transpileModule(
  textosObraTypescript,
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { obterContextoAutorObra } = await import(
  `data:text/javascript;base64,${Buffer.from(textosObraJavascript).toString("base64")}`,
);

test("prioriza o perfil publico para nome e identificador do autor", () => {
  assert.deepEqual(
    obterContextoAutorObra(
      { nome: "Perfil publico", userId: "perfil-1" },
      { autor: "Autor da obra", autorId: "obra-1" },
      "perfil-1",
    ),
    {
      autorNome: "Perfil publico",
      autorId: "perfil-1",
      usuarioEhAutor: true,
    },
  );
});

test("recorre aos dados da obra e ao vazio sem normalizacao adicional", () => {
  assert.deepEqual(
    obterContextoAutorObra(
      null,
      { autor: "Autor da obra", autorId: "obra-1" },
      "",
    ),
    {
      autorNome: "Autor da obra",
      autorId: "obra-1",
      usuarioEhAutor: false,
    },
  );
  assert.deepEqual(obterContextoAutorObra(null, null, "autor-1"), {
    autorNome: "Autor não informado",
    autorId: "",
    usuarioEhAutor: false,
  });
});

test("reconhece autoria somente pela igualdade estrita entre IDs nao vazios", () => {
  assert.equal(
    obterContextoAutorObra(
      { userId: "autor-1" },
      { autorId: "obra-1" },
      "autor-2",
    ).usuarioEhAutor,
    false,
  );
  assert.equal(
    obterContextoAutorObra(
      { userId: "" },
      { autorId: "" },
      "",
    ).usuarioEhAutor,
    false,
  );
});
