import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-avatar-upload.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  idValido = true,
  contentType = "image/png",
  caminho = "avatars/usuario-1/avatar.png",
  uploadError = null,
  publicUrl = "https://cdn.example/avatar.png",
  falharStorage = false,
} = {}) {
  const chamadas = [];
  const dependencias = {
    bucket: "avatars",
    idAutorSupabaseValido() {
      return idValido;
    },
    obterTipoMimeUploadStorage(categoria, arquivo) {
      chamadas.push(["mime", categoria, arquivo.name]);
      return contentType;
    },
    criarCaminhoAvatarStorage(userId, arquivo) {
      chamadas.push(["caminho", userId, arquivo.name]);
      return caminho;
    },
    obterCacheControlUploadStorage(categoria) {
      chamadas.push(["cache", categoria]);
      return "3600";
    },
    mensagemAmigavelErroUploadStorage(mensagem) {
      chamadas.push(["mensagem", mensagem]);
      return `amigável: ${mensagem}`;
    },
    versionarUrlPublicaStorage(url, versao) {
      chamadas.push(["versionar", url, typeof versao]);
      return url ? `${url}?v=teste` : "";
    },
    supabase: {
      storage: {
        from(bucket) {
          chamadas.push(["from", bucket]);
          if (falharStorage) {
            throw new Error("Storage indisponível");
          }
          return {
            async upload(path, arquivo, opcoes) {
              chamadas.push([
                "upload",
                path,
                arquivo.name,
                opcoes,
              ]);
              return { error: uploadError };
            },
            getPublicUrl(path) {
              chamadas.push(["getPublicUrl", path]);
              return { data: { publicUrl } };
            },
          };
        },
      },
    },
  };
  globalThis.__profileAvatarUploadDependencies = dependencias;

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileAvatarUploadDependencies.supabase;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/storageUploads";/,
        `const {
  criarCaminhoAvatarStorage,
  mensagemAmigavelErroUploadStorage,
  obterCacheControlUploadStorage,
  obterTipoMimeUploadStorage,
  versionarUrlPublicaStorage,
} = globalThis.__profileAvatarUploadDependencies;`,
      )
      .replace(
        'import { AVATAR_STORAGE_BUCKET } from "../constants";',
        "const AVATAR_STORAGE_BUCKET = globalThis.__profileAvatarUploadDependencies.bucket;",
      )
      .replace(
        'import { idAutorSupabaseValido } from "./profile-formatters";',
        "const idAutorSupabaseValido = globalThis.__profileAvatarUploadDependencies.idAutorSupabaseValido;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas };
}

function criarArquivo(nome = "avatar.png") {
  return { name: nome };
}

test("rejeita ID inválido sem acessar Storage", async () => {
  const modulo = await carregarModulo({ idValido: false });

  assert.deepEqual(
    await modulo.enviarAvatarPerfilUsuarioSupabase({
      userId: " usuario-invalido ",
      arquivo: criarArquivo(),
    }),
    {
      ok: false,
      url: "",
      caminho: "",
      erro: "ID de usuário inválido para enviar avatar.",
    },
  );
  assert.deepEqual(modulo.chamadas, []);
});

test("rejeita tipo ou caminho inválido antes do upload", async () => {
  const modulo = await carregarModulo({ contentType: "" });

  assert.deepEqual(
    await modulo.enviarAvatarPerfilUsuarioSupabase({
      userId: " usuario-1 ",
      arquivo: criarArquivo(),
    }),
    {
      ok: false,
      url: "",
      caminho: "",
      erro: "Tipo de imagem não permitido para avatar.",
    },
  );
  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "upload"),
    false,
  );
});

test("preserva bucket, caminho, cache, contentType e upsert no upload", async () => {
  const modulo = await carregarModulo();

  assert.deepEqual(
    await modulo.enviarAvatarPerfilUsuarioSupabase({
      userId: " usuario-1 ",
      arquivo: criarArquivo(),
    }),
    {
      ok: true,
      url: "https://cdn.example/avatar.png?v=teste",
      caminho: "avatars/usuario-1/avatar.png",
      erro: "",
    },
  );

  assert.deepEqual(
    modulo.chamadas.find((chamada) => chamada[0] === "upload"),
    [
      "upload",
      "avatars/usuario-1/avatar.png",
      "avatar.png",
      {
        cacheControl: "3600",
        contentType: "image/png",
        upsert: true,
      },
    ],
  );
  assert.equal(
    modulo.chamadas.filter((chamada) => chamada[0] === "from").every(
      (chamada) => chamada[1] === "avatars",
    ),
    true,
  );
  assert.deepEqual(
    modulo.chamadas.find((chamada) => chamada[0] === "getPublicUrl"),
    ["getPublicUrl", "avatars/usuario-1/avatar.png"],
  );
});

test("preserva mensagem amigável de erro do upload", async () => {
  const modulo = await carregarModulo({
    uploadError: new Error("upload bloqueado"),
  });

  assert.deepEqual(
    await modulo.enviarAvatarPerfilUsuarioSupabase({
      userId: "usuario-2",
      arquivo: criarArquivo(),
    }),
    {
      ok: false,
      url: "",
      caminho: "",
      erro: "amigável: upload bloqueado",
    },
  );
});

test("preserva falha de URL pública e exceções inesperadas", async () => {
  const semUrl = await carregarModulo({ publicUrl: "" });
  assert.deepEqual(
    await semUrl.enviarAvatarPerfilUsuarioSupabase({
      userId: "usuario-3",
      arquivo: criarArquivo(),
    }),
    {
      ok: false,
      url: "",
      caminho: "",
      erro: "Storage não retornou URL pública do avatar.",
    },
  );

  const excecao = await carregarModulo({ falharStorage: true });
  assert.deepEqual(
    await excecao.enviarAvatarPerfilUsuarioSupabase({
      userId: "usuario-4",
      arquivo: criarArquivo(),
    }),
    {
      ok: false,
      url: "",
      caminho: "",
      erro: "Storage indisponível",
    },
  );
});

test("Perfil de Autor delega o upload do avatar para o novo módulo", () => {
  assert.match(
    pagina,
    /import \{ enviarAvatarPerfilUsuarioSupabase \} from "\.\/lib\/profile-avatar-upload";/,
  );
  assert.doesNotMatch(
    pagina,
    /async function enviarAvatarPerfilUsuarioSupabase\(/,
  );
  assert.match(
    source,
    /export async function enviarAvatarPerfilUsuarioSupabase\(/,
  );
  assert.match(source, /\.upload\(caminho, arquivo, \{/);
  assert.match(source, /\.getPublicUrl\(caminho\)/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage/);
});
