import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-persistence.ts",
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

async function carregarModulo() {
  const chamadas = [];
  globalThis.__editarObraLocalPersistenceDependencies = {
    atualizarObraNaListaLocalEdicao(dados) {
      chamadas.push(["atualizar", dados]);
      return [{ id: "obra", titulo: dados.titulo }];
    },
    salvarObrasDoUsuarioPreservandoOutrasContas(obras, userId) {
      chamadas.push(["salvar", obras, userId]);
      return [{ ...obras[0], dono: userId }];
    },
    criarAlvoBackupArquivoEdicaoObra(dados) {
      chamadas.push(["alvo", dados]);
      return { id: dados.obraId };
    },
    salvarArquivoObraNoBackup(alvo, arquivo, userId) {
      chamadas.push(["remover-backup", alvo, arquivo, userId]);
    },
    sincronizarBackupArquivosObras(obras, userId) {
      chamadas.push(["sincronizar-backup", obras, userId]);
    },
  };

  const javascript = typescript
    .transpileModule(
      source
        .replace(
          'import { criarAlvoBackupArquivoEdicaoObra } from "./editar-obra-backup-target";',
          "const criarAlvoBackupArquivoEdicaoObra = globalThis.__editarObraLocalPersistenceDependencies.criarAlvoBackupArquivoEdicaoObra;",
        )
        .replace(
          /import \{[\s\S]*?salvarArquivoObraNoBackup,[\s\S]*?sincronizarBackupArquivosObras,[\s\S]*?\} from "\.\/editar-obra-file-backup-storage";/,
          "const { salvarArquivoObraNoBackup, sincronizarBackupArquivosObras } = globalThis.__editarObraLocalPersistenceDependencies;",
        )
        .replace(
          'import { atualizarObraNaListaLocalEdicao } from "./editar-obra-local-update";',
          "const atualizarObraNaListaLocalEdicao = globalThis.__editarObraLocalPersistenceDependencies.atualizarObraNaListaLocalEdicao;",
        )
        .replace(
          'import { salvarObrasDoUsuarioPreservandoOutrasContas } from "./editar-obra-local-work-storage";',
          "const salvarObrasDoUsuarioPreservandoOutrasContas = globalThis.__editarObraLocalPersistenceDependencies.salvarObrasDoUsuarioPreservandoOutrasContas;",
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
    obras: [{ id: "obra", titulo: "Antes" }],
    obraId: "obra",
    tituloFinal: "Depois",
    autor: "Autora",
    genero: "Fantasia",
    formato: "HQ",
    classificacaoIndicativa: "Livre",
    avisosConteudo: [],
    sinopse: "Sinopse",
    tags: [],
    capa: "capa.png",
    capaNome: "Capa.png",
    arquivoObra: null,
    userId: "usuario",
    arquivoObraRemovidoManualmente: false,
    obraLocalAtual: { id: "obra", slug: "obra" },
    ...sobrescrever,
  };
}

test("atualiza e persiste a lista da conta antes de sincronizar o backup", async () => {
  const modulo = await carregarModulo();
  const resultado = modulo.persistirObraLocalEBackupEdicaoObra(criarParametros());

  assert.deepEqual(modulo.chamadas.map(([tipo]) => tipo), [
    "atualizar",
    "salvar",
    "sincronizar-backup",
  ]);
  assert.equal(modulo.chamadas[0][1].titulo, "Depois");
  assert.equal(modulo.chamadas[1][2], "usuario");
  assert.deepEqual(resultado, [{ id: "obra", titulo: "Depois", dono: "usuario" }]);
});

test("remove o backup da obra quando o arquivo foi removido manualmente", async () => {
  const modulo = await carregarModulo();

  modulo.persistirObraLocalEBackupEdicaoObra(
    criarParametros({ arquivoObraRemovidoManualmente: true }),
  );

  assert.deepEqual(modulo.chamadas.map(([tipo]) => tipo), [
    "atualizar",
    "salvar",
    "alvo",
    "remover-backup",
  ]);
  assert.deepEqual(modulo.chamadas.at(-1), [
    "remover-backup",
    { id: "obra" },
    null,
    "usuario",
  ]);
});

test("o hook delega a persistência local e mantém Diário e estados finais", () => {
  assert.match(
    saveActionSource,
    /import \{ persistirObraLocalEBackupEdicaoObra \} from "\.\.\/lib\/editar-obra-local-persistence";/,
  );
  assert.match(
    saveActionSource,
    /const novasObrasDoUsuario = persistirObraLocalEBackupEdicaoObra\(\{[\s\S]*?tituloFinal,[\s\S]*?arquivoObraRemovidoManualmente,[\s\S]*?obraLocalAtual,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(saveActionSource, /atualizarObraNaListaLocalEdicao\(/);
  assert.doesNotMatch(saveActionSource, /salvarObrasDoUsuarioPreservandoOutrasContas\(/);
  assert.doesNotMatch(saveActionSource, /salvarArquivoObraNoBackup\(/);
  assert.doesNotMatch(saveActionSource, /sincronizarBackupArquivosObras\(/);
  assert.match(saveActionSource, /registrarDiarioEdicaoObra\([\s\S]*?obra: obraAtualizadaDiario/);
  assert.match(saveActionSource, /setObras\(novasObrasDoUsuario\);/);
  assert.match(source, /atualizarObraNaListaLocalEdicao\([\s\S]*?salvarObrasDoUsuarioPreservandoOutrasContas[\s\S]*?if \(arquivoObraRemovidoManualmente\)/);
  assert.doesNotMatch(source, /supabase|storage\.from|useState|useEffect|await|registrarDiarioEdicaoObra/);
});
