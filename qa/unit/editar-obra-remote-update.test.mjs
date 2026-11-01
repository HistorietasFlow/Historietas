import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-remote-update.ts",
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

async function carregarModulo({ data = { id: "obra" }, error = null } = {}) {
  const chamadas = [];
  globalThis.__editarObraRemoteUpdateDependencies = {
    supabase: {
      from(tabela) {
        chamadas.push(["from", tabela]);
        const consulta = {
          update(payload) {
            chamadas.push(["update", payload]);
            return consulta;
          },
          eq(coluna, valor) {
            chamadas.push(["eq", coluna, valor]);
            return consulta;
          },
          select(campos) {
            chamadas.push(["select", campos]);
            return consulta;
          },
          async maybeSingle() {
            chamadas.push(["maybeSingle"]);
            return { data, error };
          },
        };

        return consulta;
      },
    },
    criarPayloadAtualizacaoObra(dados) {
      chamadas.push(["payload", dados]);
      return { payload: true };
    },
    async removerArquivosStorageEdicaoObra(arquivos) {
      chamadas.push(["rollback", arquivos]);
    },
  };

  const javascript = typescript
    .transpileModule(
      source
        .replace(
          'import { supabase } from "../../../lib/supabase/client";',
          "const supabase = globalThis.__editarObraRemoteUpdateDependencies.supabase;",
        )
        .replace(
          /import \{[\s\S]*?removerArquivosStorageEdicaoObra,[\s\S]*?type ArquivoStorageEdicaoObra,[\s\S]*?\} from "\.\/editar-obra-remote-storage";/,
          "const removerArquivosStorageEdicaoObra = globalThis.__editarObraRemoteUpdateDependencies.removerArquivosStorageEdicaoObra;",
        )
        .replace(
          'import { criarPayloadAtualizacaoObra } from "./editar-obra-update-payload";',
          "const criarPayloadAtualizacaoObra = globalThis.__editarObraRemoteUpdateDependencies.criarPayloadAtualizacaoObra;",
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
    obraId: "obra",
    userId: "usuario",
    tituloFinal: "Obra",
    autorFinal: "Autora",
    generoFinalSalvo: "Fantasia",
    formatoFinalSalvo: "HQ",
    classificacaoFinal: "Livre",
    avisosConteudoFinal: [],
    sinopseFinal: "Sinopse",
    tagsFinais: [],
    capaFinal: "capa.png",
    capaNomeFinal: "Capa.png",
    arquivoObraFinal: null,
    agora: "2026-11-01T00:00:00.000Z",
    arquivosNovosEnviados: [
      { bucket: "capas-obras", caminho: "usuario/capa.png", referencia: "capa" },
      { bucket: "arquivos-obras", caminho: "usuario/obra.pdf", referencia: "obra" },
    ],
    ...sobrescrever,
  };
}

test("atualiza a obra com payload, filtros e confirmação na mesma ordem", async () => {
  const modulo = await carregarModulo();

  await modulo.atualizarObraRemotaEdicaoObra(criarParametros());

  assert.deepEqual(modulo.chamadas.map(([tipo]) => tipo), [
    "from",
    "payload",
    "update",
    "eq",
    "eq",
    "select",
    "maybeSingle",
  ]);
  assert.deepEqual(modulo.chamadas[0], ["from", "obras"]);
  assert.deepEqual(modulo.chamadas[3], ["eq", "id", "obra"]);
  assert.deepEqual(modulo.chamadas[4], ["eq", "user_id", "usuario"]);
  assert.deepEqual(modulo.chamadas[5], ["select", "id"]);
});

test("faz rollback dos uploads novos e preserva a mensagem do erro de update", async () => {
  const modulo = await carregarModulo({ error: { message: "sem permissão" } });

  await assert.rejects(
    () => modulo.atualizarObraRemotaEdicaoObra(criarParametros()),
    /Não consegui atualizar a obra no Supabase: sem permissão/,
  );

  assert.deepEqual(modulo.chamadas.at(-1), [
    "rollback",
    [
      { bucket: "capas-obras", caminho: "usuario/capa.png" },
      { bucket: "arquivos-obras", caminho: "usuario/obra.pdf" },
    ],
  ]);
});

test("faz rollback e falha quando o update não confirma o id da obra", async () => {
  const modulo = await carregarModulo({ data: null });

  await assert.rejects(
    () => modulo.atualizarObraRemotaEdicaoObra(criarParametros()),
    /Não consegui confirmar a atualização da obra no Supabase\./,
  );
  assert.equal(modulo.chamadas.at(-1)[0], "rollback");
});

test("o hook delega update e rollback remoto, mantendo cleanup local posterior", () => {
  assert.match(
    saveActionSource,
    /import \{ atualizarObraRemotaEdicaoObra \} from "\.\.\/lib\/editar-obra-remote-update";/,
  );
  assert.match(
    saveActionSource,
    /await atualizarObraRemotaEdicaoObra\(\{[\s\S]*?obraId,[\s\S]*?userId,[\s\S]*?arquivosNovosEnviados,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(saveActionSource, /supabase\.from\("obras"\)/);
  assert.doesNotMatch(saveActionSource, /criarPayloadAtualizacaoObra\(/);
  assert.match(
    saveActionSource,
    /await removerArquivosStorageEdicaoObra\(arquivosAntigosParaRemover\);[\s\S]*?const novasObrasDoUsuario = persistirObraLocalEBackupEdicaoObra/,
  );
  assert.match(source, /criarPayloadAtualizacaoObra\(dadosAtualizacao\)/);
  assert.match(source, /\.from\("obras"\)[\s\S]*?\.update\([\s\S]*?\.eq\("id", obraId\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.select\("id"\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(source, /arquivosNovosEnviados\.map/);
  assert.doesNotMatch(source, /localStorage|useState|useEffect|registrarDiarioEdicaoObra/);
});
