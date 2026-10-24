import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/editar-obra/lib/editar-obra-profile-loader.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/editar-obra/page.tsx", import.meta.url), "utf8");
let respostas = [];
const consultas = [];

globalThis.__editarObraProfileLoaderDependencies = {
  supabase: {
    from(tabela) {
      assert.equal(tabela, "profiles");
      return {
        select(selecao) {
          assert.equal(selecao, "nome");
          return this;
        },
        eq(campo, valor) {
          consultas.push([campo, valor]);
          return this;
        },
        limit(limite) {
          assert.equal(limite, 1);
          return this;
        },
        maybeSingle() {
          const resposta = respostas.shift();
          if (resposta instanceof Error) throw resposta;
          return Promise.resolve(resposta);
        },
      };
    },
  },
};

const javascript = typescript
  .transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { supabase } from "../../../lib/supabase/client";',
    "const supabase = globalThis.__editarObraProfileLoaderDependencies.supabase;"
  );
const { carregarNomeAutorProfileEdicaoObra, obterTextoMetadataUsuarioEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

function prepararRespostas(...novasRespostas) {
  respostas = novasRespostas;
  consultas.length = 0;
}

test("metadata preserva ausências, tipos inválidos e trim", () => {
  assert.equal(obterTextoMetadataUsuarioEdicaoObra(undefined, "nome"), "");
  assert.equal(obterTextoMetadataUsuarioEdicaoObra({ nome: 1 }, "nome"), "");
  assert.equal(obterTextoMetadataUsuarioEdicaoObra({ nome: "  Ana  " }, "nome"), "Ana");
});

test("profile preserva user_id primeiro e fallback por id", async () => {
  prepararRespostas({ data: { nome: "  Ana  " }, error: null });
  assert.equal(await carregarNomeAutorProfileEdicaoObra(" usuario ", "Fallback"), "Ana");
  assert.deepEqual(consultas, [["user_id", "usuario"]]);

  prepararRespostas({ data: { nome: "" }, error: null }, { data: { nome: "  Bia  " }, error: null });
  assert.equal(await carregarNomeAutorProfileEdicaoObra("usuario", "Fallback"), "Bia");
  assert.deepEqual(consultas, [["user_id", "usuario"], ["id", "usuario"]]);
});

test("profile mantém fallback após erro ou registros inválidos", async () => {
  prepararRespostas(new Error("profiles indisponível"), { data: ["inválido"], error: null });
  assert.equal(await carregarNomeAutorProfileEdicaoObra("usuario", "  Fallback  "), "Fallback");
  assert.deepEqual(consultas, [["user_id", "usuario"], ["id", "usuario"]]);

  prepararRespostas({ data: { nome: 1 }, error: null }, { data: null, error: new Error("não encontrado") });
  assert.equal(await carregarNomeAutorProfileEdicaoObra("usuario", "Fallback"), "Fallback");
  assert.deepEqual(consultas, [["user_id", "usuario"], ["id", "usuario"]]);
});

test("userId vazio devolve fallback sem consulta", async () => {
  prepararRespostas();
  assert.equal(await carregarNomeAutorProfileEdicaoObra(" ", "  Fallback  "), "Fallback");
  assert.deepEqual(consultas, []);
});

test("Editar Obra delega somente o carregamento de profile", () => {
  assert.match(pageSource, /from "\.\/lib\/editar-obra-profile-loader";/);
  for (const helper of ["obterTextoMetadataUsuarioEdicaoObra", "obterNomeProfileEdicaoObra", "carregarNomeAutorProfileEdicaoObra"]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.match(source, /\.eq\("user_id", userIdLimpo\)/);
  assert.match(source, /\.eq\("id", userIdLimpo\)/);
});
