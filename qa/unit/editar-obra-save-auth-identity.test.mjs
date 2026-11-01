import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-save-auth-identity.ts",
    import.meta.url,
  ),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);

let respostaUsuario;
const chamadasProfile = [];

globalThis.__editarObraSaveAuthIdentityDependencies = {
  supabase: {
    auth: {
      getUser() {
        return Promise.resolve(respostaUsuario);
      },
    },
  },
  carregarNomeAutorProfileEdicaoObra(userId, fallback) {
    chamadasProfile.push([userId, fallback]);
    return Promise.resolve("Nome do profile");
  },
  obterTextoMetadataUsuarioEdicaoObra(metadata, chave) {
    const valor = metadata?.[chave];

    return typeof valor === "string" ? valor.trim() : "";
  },
  criarLoginHrefEditarObra(obraId) {
    return `/login?obraId=${obraId}`;
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
    "const { supabase } = globalThis.__editarObraSaveAuthIdentityDependencies;",
  )
  .replace(
    /import \{\s*carregarNomeAutorProfileEdicaoObra,\s*obterTextoMetadataUsuarioEdicaoObra,\s*\} from "\.\/editar-obra-profile-loader";/,
    "const { carregarNomeAutorProfileEdicaoObra, obterTextoMetadataUsuarioEdicaoObra } = globalThis.__editarObraSaveAuthIdentityDependencies;",
  )
  .replace(
    'import { criarLoginHrefEditarObra } from "./editar-obra-navigation-utils";',
    "const { criarLoginHrefEditarObra } = globalThis.__editarObraSaveAuthIdentityDependencies;",
  );

const { obterIdentidadeSalvamentoEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function criarParametros() {
  const erros = [];
  const redirects = [];

  return {
    parametros: {
      obraId: "obra-1",
      autorFormularioFinal: "Autor do formulario",
      router: {
        replace(href) {
          redirects.push(href);
        },
      },
      setErro(mensagem) {
        erros.push(mensagem);
      },
    },
    erros,
    redirects,
  };
}

test("resolve usuario autenticado, metadata e nome do profile", async () => {
  respostaUsuario = {
    data: {
      user: {
        id: "usuario-1",
        user_metadata: {
          nome: "  Ana  ",
          name: "Bia",
          full_name: "Carla",
        },
      },
    },
    error: null,
  };
  chamadasProfile.length = 0;
  const { parametros, erros, redirects } = criarParametros();

  assert.deepEqual(
    await obterIdentidadeSalvamentoEdicaoObra(parametros),
    {
      userId: "usuario-1",
      nomeProfileAtualizado: "Nome do profile",
    },
  );
  assert.deepEqual(chamadasProfile, [["usuario-1", "Ana"]]);
  assert.deepEqual(erros, []);
  assert.deepEqual(redirects, []);
});

test("redireciona e preserva mensagem quando autenticacao ou obra sao invalidas", async () => {
  respostaUsuario = {
    data: { user: null },
    error: new Error("sessao invalida"),
  };
  chamadasProfile.length = 0;
  const { parametros, erros, redirects } = criarParametros();

  assert.equal(await obterIdentidadeSalvamentoEdicaoObra(parametros), null);
  assert.deepEqual(chamadasProfile, []);
  assert.deepEqual(erros, ["Entre na sua conta antes de editar a obra."]);
  assert.deepEqual(redirects, ["/login?obraId=obra-1"]);
});

test("o hook delega somente o inicio autenticado e preserva o salvamento", () => {
  assert.match(
    saveActionSource,
    /await obterIdentidadeSalvamentoEdicaoObra\(\{[\s\S]*?obraId,[\s\S]*?autorFormularioFinal,[\s\S]*?router,[\s\S]*?setErro,[\s\S]*?\}\);/,
  );
  assert.match(
    saveActionSource,
    /const \{ userId, nomeProfileAtualizado \} = identidadeSalvamento;/,
  );
  assert.match(saveActionSource, /\.from\("obras"\)/);
  assert.match(saveActionSource, /enviarArquivoStorage\(/);
  assert.match(saveActionSource, /criarPayloadAtualizacaoObra\(/);
});
