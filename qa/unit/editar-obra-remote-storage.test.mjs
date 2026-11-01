import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-remote-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url), "utf8");
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const saveAssetsPreparationSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-save-assets-preparation.ts",
    import.meta.url,
  ),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  contentType = "image/png",
  cacheControl = "31536000",
  uploadError = null,
  publicUrl = "https://cdn.example/capa.png",
  removeErrors = {},
} = {}) {
  const chamadas = [];
  const dependencias = {
    supabase: {
      storage: {
        from(bucket) {
          chamadas.push(["from", bucket]);
          return {
            async upload(caminho, arquivo, opcoes) {
              chamadas.push(["upload", bucket, caminho, arquivo.name, opcoes]);
              return { error: uploadError };
            },
            getPublicUrl(caminho) {
              chamadas.push(["public-url", bucket, caminho]);
              return { data: { publicUrl } };
            },
            async remove(caminhos) {
              chamadas.push(["remove", bucket, caminhos]);
              return { error: removeErrors[`${bucket}:${caminhos[0]}`] || null };
            },
          };
        },
      },
    },
    limparNomeArquivoStorage(nome) {
      chamadas.push(["limpar", nome]);
      return "nome-sanitizado.png";
    },
    obterTipoMimeUploadStorage(bucket, arquivo) {
      chamadas.push(["mime", bucket, arquivo.name]);
      return contentType;
    },
    obterCacheControlUploadStorage(bucket) {
      chamadas.push(["cache", bucket]);
      return cacheControl;
    },
    mensagemAmigavelErroUploadStorage(mensagem) {
      chamadas.push(["mensagem", mensagem]);
      return `amigável: ${mensagem}`;
    },
  };
  globalThis.__editarObraRemoteStorageDependencies = dependencias;

  const javascript = typescript
    .transpileModule(
      source
        .replace(
          'import { supabase } from "../../../lib/supabase/client";',
          "const supabase = globalThis.__editarObraRemoteStorageDependencies.supabase;",
        )
        .replace(
          /import \{[\s\S]*?mensagemAmigavelErroUploadStorage,[\s\S]*?obterCacheControlUploadStorage,[\s\S]*?obterTipoMimeUploadStorage,[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/storageUploads";/,
          [
            "const mensagemAmigavelErroUploadStorage = globalThis.__editarObraRemoteStorageDependencies.mensagemAmigavelErroUploadStorage;",
            "const obterCacheControlUploadStorage = globalThis.__editarObraRemoteStorageDependencies.obterCacheControlUploadStorage;",
            "const obterTipoMimeUploadStorage = globalThis.__editarObraRemoteStorageDependencies.obterTipoMimeUploadStorage;",
          ].join("\n"),
        )
        .replace(
          'import { limparNomeArquivoStorage } from "./editar-obra-storage-path-utils";',
          "const limparNomeArquivoStorage = globalThis.__editarObraRemoteStorageDependencies.limparNomeArquivoStorage;",
        ),
      {
        compilerOptions: {
          module: typescript.ModuleKind.ESNext,
          target: typescript.ScriptTarget.ES2022,
        },
      },
    )
    .outputText;
  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas };
}

function criarArquivo(nome = "Nome da Capa.png") {
  return { name: nome };
}

function comAmbienteBrowser({ randomUUID } = {}, executar) {
  const windowAnterior = globalThis.window;
  const dateNowAnterior = Date.now;
  const randomAnterior = Math.random;
  Date.now = () => 1700000000000;
  Math.random = () => 0.5;
  globalThis.window = randomUUID ? { crypto: { randomUUID } } : {};

  try {
    return executar();
  } finally {
    globalThis.window = windowAnterior;
    Date.now = dateNowAnterior;
    Math.random = randomAnterior;
  }
}

test("upload de capa preserva MIME, cache, UUID, nome sanitizado e URL pública", async () => {
  const modulo = await carregarModulo();
  const resultado = await comAmbienteBrowser(
    { randomUUID: () => "uuid-seguro" },
    () => modulo.enviarArquivoStorage("capas-obras", " usuario ", criarArquivo()),
  );

  assert.deepEqual(resultado, {
    bucket: "capas-obras",
    caminho: " usuario /1700000000000-uuid-seguro-nome-sanitizado.png",
    referencia: "https://cdn.example/capa.png",
  });
  const upload = modulo.chamadas.find(([tipo]) => tipo === "upload");
  assert.deepEqual(upload, [
    "upload",
    "capas-obras",
    resultado.caminho,
    "Nome da Capa.png",
    { cacheControl: "31536000", contentType: "image/png", upsert: false },
  ]);
  assert.deepEqual(modulo.chamadas.at(-1), ["public-url", "capas-obras", resultado.caminho]);
});

test("upload de arquivo preserva fallback sem UUID e retorna somente o caminho", async () => {
  const modulo = await carregarModulo({ contentType: "application/pdf", cacheControl: "3600" });
  const resultado = await comAmbienteBrowser(
    {},
    () => modulo.enviarArquivoStorage("arquivos-obras", "usuario", criarArquivo("obra.pdf")),
  );

  assert.match(resultado.caminho, /^usuario\/1700000000000-1700000000000-8-nome-sanitizado\.png$/);
  assert.deepEqual(resultado, {
    bucket: "arquivos-obras",
    caminho: resultado.caminho,
    referencia: resultado.caminho,
  });
  assert.equal(modulo.chamadas.some(([tipo]) => tipo === "public-url"), false);
});

test("upload rejeita MIME inválido e traduz erros do Storage", async () => {
  const mimeInvalido = await carregarModulo({ contentType: "" });
  await assert.rejects(
    () => mimeInvalido.enviarArquivoStorage("capas-obras", "usuario", criarArquivo()),
    /Tipo de arquivo não permitido para capas-obras\./,
  );
  assert.equal(mimeInvalido.chamadas.some(([tipo]) => tipo === "from"), false);

  const comErro = await carregarModulo({ uploadError: { message: "falha do storage" } });
  await assert.rejects(
    () => comAmbienteBrowser({}, () => comErro.enviarArquivoStorage("capas-obras", "usuario", criarArquivo())),
    /Erro ao enviar Nome da Capa\.png: amigável: falha do storage/,
  );
  assert.deepEqual(comErro.chamadas.at(-1), ["mensagem", "falha do storage"]);
});

test("remoção ignora vazios, deduplica, usa caminhos com trim e tolera erros individuais", async () => {
  const modulo = await carregarModulo({
    removeErrors: { "arquivos-obras:falha.pdf": { message: "sem permissão" } },
  });
  const warnAnterior = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);

  try {
    await modulo.removerArquivosStorageEdicaoObra([]);
    await modulo.removerArquivosStorageEdicaoObra([
      { bucket: "capas-obras", caminho: "  " },
      { bucket: "capas-obras", caminho: " capa.png " },
      { bucket: "capas-obras", caminho: " capa.png " },
      { bucket: "arquivos-obras", caminho: "falha.pdf" },
      { bucket: "arquivos-obras", caminho: " arquivo.pdf " },
    ]);
  } finally {
    console.warn = warnAnterior;
  }

  const removidas = modulo.chamadas.filter(([tipo]) => tipo === "remove");
  assert.deepEqual(removidas, [
    ["remove", "capas-obras", ["capa.png"]],
    ["remove", "arquivos-obras", ["falha.pdf"]],
    ["remove", "arquivos-obras", ["arquivo.pdf"]],
  ]);
  assert.deepEqual(avisos, [
    ["Não consegui remover o arquivo antigo de arquivos-obras:", "sem permissão"],
  ]);
});

test("Editar Obra delega somente operações remotas de Storage", () => {
  assert.match(
    saveAssetsPreparationSource,
    /import \{[\s\S]*?enviarArquivoStorage,[\s\S]*?type ArquivoStorageEdicaoObra,[\s\S]*?\} from "\.\/editar-obra-remote-storage";/,
  );
  assert.match(
    saveActionSource,
    /import \{[\s\S]*?removerArquivosStorageEdicaoObra,[\s\S]*?type ArquivoStorageEdicaoObra,[\s\S]*?\} from "\.\.\/lib\/editar-obra-remote-storage";/,
  );
  for (const helper of ["enviarArquivoStorage", "removerArquivosStorageEdicaoObra"]) {
    assert.doesNotMatch(saveAssetsPreparationSource, new RegExp(`async function ${helper}\\(`));
    assert.match(source, new RegExp(`export async function ${helper}\\(`));
  }
  assert.doesNotMatch(pageSource, /mensagemAmigavelErroUploadStorage/);
  assert.doesNotMatch(pageSource, /obterCacheControlUploadStorage/);
  assert.doesNotMatch(pageSource, /obterTipoMimeUploadStorage/);
  assert.match(source, /supabase\.storage\.from\(bucket\)\.upload/);
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /\$\{arquivo\.bucket\}:\$\{arquivo\.caminho\}/);
});
