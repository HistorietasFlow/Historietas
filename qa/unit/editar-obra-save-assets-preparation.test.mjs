import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-save-assets-preparation.ts",
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
let indiceModulo = 0;

async function carregarModulo({ erroRemoverCapa = null } = {}) {
  const chamadas = [];
  const dependencias = {
    supabase: {
      storage: {
        from(bucket) {
          chamadas.push(["from", bucket]);

          return {
            async remove(caminhos) {
              chamadas.push(["remove", bucket, caminhos]);
              return { error: erroRemoverCapa };
            },
          };
        },
      },
    },
    identificarCategoriaArquivo(arquivo) {
      chamadas.push(["categoria", arquivo.name]);
      return "documento";
    },
    prepararAssetsAtuaisEdicaoObra() {
      chamadas.push(["preparar"]);
      return {
        capaFinalInicial: "capa-atual",
        capaNomeFinalInicial: "Capa atual",
        arquivoObraFinalInicial: {
          nome: "arquivo-atual.pdf",
          tipo: "application/pdf",
          tamanho: 10,
          conteudo: "arquivo-atual.pdf",
          categoria: "documento",
          criadoEm: "atual",
        },
        caminhoCapaRemotaAtual: "usuario/capa-atual.png",
        caminhoArquivoRemotoAtual: "usuario/arquivo-atual.pdf",
      };
    },
    async enviarArquivoStorage(bucket, userId, arquivo) {
      chamadas.push(["upload", bucket, userId, arquivo.name]);

      return {
        bucket,
        caminho: `${userId}/${arquivo.name}`,
        referencia:
          bucket === "capas-obras"
            ? `https://cdn.example/${arquivo.name}`
            : `${userId}/${arquivo.name}`,
      };
    },
  };
  globalThis.__editarObraSaveAssetsDependencies = dependencias;

  const javascript = typescript
    .transpileModule(
      source
        .replace(
          'import { supabase } from "../../../lib/supabase/client";',
          "const supabase = globalThis.__editarObraSaveAssetsDependencies.supabase;",
        )
        .replace(
          'import { identificarCategoriaArquivo } from "./editar-obra-file-validation";',
          "const identificarCategoriaArquivo = globalThis.__editarObraSaveAssetsDependencies.identificarCategoriaArquivo;",
        )
        .replace(
          'import { prepararAssetsAtuaisEdicaoObra } from "./editar-obra-current-assets-preparation";',
          "const prepararAssetsAtuaisEdicaoObra = globalThis.__editarObraSaveAssetsDependencies.prepararAssetsAtuaisEdicaoObra;",
        )
        .replace(
          /import \{\s*enviarArquivoStorage,\s*type ArquivoStorageEdicaoObra,\s*\} from "\.\/editar-obra-remote-storage";/,
          "const enviarArquivoStorage = globalThis.__editarObraSaveAssetsDependencies.enviarArquivoStorage;",
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

function criarParametros(sobrescrever = {}) {
  return {
    capa: "capa-local.png",
    capaNome: "Capa local",
    arquivoObra: {
      nome: "rascunho.pdf",
      tipo: "application/pdf",
      tamanho: 2,
      conteudo: "rascunho.pdf",
      categoria: "documento",
      criadoEm: "rascunho",
    },
    obraRemotaAtual: {},
    obraLocalAtual: null,
    backupArquivosObras: {},
    capaRemovidaManualmente: false,
    arquivoObraRemovidoManualmente: false,
    capaBloqueadaPorClassificacao: false,
    capaArquivo: { name: "nova-capa.png" },
    arquivoObraArquivo: {
      name: "nova-obra.pdf",
      type: "application/pdf",
      size: 42,
    },
    userId: "usuario",
    agora: "2026-11-01T00:00:00.000Z",
    arquivosNovosEnviados: [],
    ...sobrescrever,
  };
}

test("prepara e envia capa e arquivo na mesma ordem, preservando rollback e arquivos antigos", async () => {
  const modulo = await carregarModulo();
  const parametros = criarParametros();

  const resultado = await modulo.prepararEEnviarAssetsEdicaoObra(parametros);

  assert.deepEqual(modulo.chamadas, [
    ["preparar"],
    ["upload", "capas-obras", "usuario", "nova-capa.png"],
    ["upload", "arquivos-obras", "usuario", "nova-obra.pdf"],
    ["categoria", "nova-obra.pdf"],
  ]);
  assert.equal(resultado.capaFinal, "https://cdn.example/nova-capa.png");
  assert.equal(resultado.capaNomeFinal, "nova-capa.png");
  assert.deepEqual(resultado.arquivoObraFinal, {
    nome: "nova-obra.pdf",
    tipo: "application/pdf",
    tamanho: 42,
    conteudo: "usuario/nova-obra.pdf",
    categoria: "documento",
    criadoEm: "rascunho",
  });
  assert.equal(resultado.arquivosNovosEnviados, parametros.arquivosNovosEnviados);
  assert.deepEqual(resultado.arquivosNovosEnviados, [
    {
      bucket: "capas-obras",
      caminho: "usuario/nova-capa.png",
      referencia: "https://cdn.example/nova-capa.png",
    },
    {
      bucket: "arquivos-obras",
      caminho: "usuario/nova-obra.pdf",
      referencia: "usuario/nova-obra.pdf",
    },
  ]);
  assert.deepEqual(resultado.arquivosAntigosParaRemover, [
    { bucket: "capas-obras", caminho: "usuario/capa-atual.png" },
    { bucket: "arquivos-obras", caminho: "usuario/arquivo-atual.pdf" },
  ]);
});

test("bloqueia capa de obra 18+ removendo-a imediatamente antes de qualquer upload", async () => {
  const modulo = await carregarModulo();
  const parametros = criarParametros({
    capaBloqueadaPorClassificacao: true,
    capaArquivo: { name: "nao-enviar.png" },
    arquivoObraArquivo: null,
  });

  const resultado = await modulo.prepararEEnviarAssetsEdicaoObra(parametros);

  assert.deepEqual(modulo.chamadas, [
    ["preparar"],
    ["from", "capas-obras"],
    ["remove", "capas-obras", ["usuario/capa-atual.png"]],
  ]);
  assert.equal(resultado.capaFinal, "");
  assert.equal(resultado.capaNomeFinal, "");
  assert.deepEqual(resultado.arquivosNovosEnviados, []);
  assert.deepEqual(resultado.arquivosAntigosParaRemover, []);
});

test("preserva a mensagem de erro ao nao remover a capa bloqueada", async () => {
  const modulo = await carregarModulo({
    erroRemoverCapa: { message: "sem permissao" },
  });

  await assert.rejects(
    () => modulo.prepararEEnviarAssetsEdicaoObra(
      criarParametros({
        capaBloqueadaPorClassificacao: true,
        capaArquivo: null,
        arquivoObraArquivo: null,
      }),
    ),
    /Nao consegui remover a capa publica antes de bloquear a obra 18\+: sem permissao/,
  );
});

test("o hook delega a preparacao e os uploads, mantendo update e rollback posterior", () => {
  assert.match(
    saveActionSource,
    /import \{[\s\S]*?prepararEEnviarAssetsEdicaoObra,[\s\S]*?type ArquivoAntigoEdicaoObra,[\s\S]*?\} from "\.\.\/lib\/editar-obra-save-assets-preparation";/,
  );
  assert.match(
    saveActionSource,
    /const assetsPreparados = await prepararEEnviarAssetsEdicaoObra\(\{[\s\S]*?obraRemotaAtual,[\s\S]*?capaBloqueadaPorClassificacao,[\s\S]*?arquivosNovosEnviados,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(saveActionSource, /prepararAssetsAtuaisEdicaoObra\(/);
  assert.doesNotMatch(saveActionSource, /enviarArquivoStorage\(/);
  assert.doesNotMatch(saveActionSource, /identificarCategoriaArquivo\(/);
  assert.match(saveActionSource, /const \{ data: obraAtualizadaSupabase, error: erroAtualizarObra \} =/);
  assert.match(saveActionSource, /await removerArquivosStorageEdicaoObra\([\s\S]*?arquivosNovosEnviados\.map/);
  assert.match(source, /await supabase\.storage[\s\S]*?\.from\("capas-obras"\)[\s\S]*?\.remove\(\[caminhoCapaRemotaAtual\]\)/);
  assert.match(source, /await enviarArquivoStorage\([\s\S]*?"capas-obras"/);
  assert.match(source, /await enviarArquivoStorage\([\s\S]*?"arquivos-obras"/);
  assert.doesNotMatch(source, /\.from\("obras"\)|\.update\(|removerArquivosStorageEdicaoObra|localStorage|useState|useEffect/);
});
