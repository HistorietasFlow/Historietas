import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-work-storage.ts",
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
const localPersistenceSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-persistence.ts",
    import.meta.url,
  ),
  "utf8",
);
const initialLoadSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);

const chamadas = [];
let obrasArmazenadas = null;
let backupAtual = {};

function criarObra(valor = {}) {
  return {
    id: "obra-1",
    titulo: "Obra",
    autor: "Autora",
    autorId: "",
    genero: "Fantasia",
    formato: "HQ",
    classificacaoIndicativa: "Livre",
    avisosConteudo: [],
    sinopse: "Sinopse",
    tags: ["tag"],
    capa: "",
    capaNome: "",
    arquivoObra: null,
    publicado: false,
    capitulos: [],
    criadaEm: "",
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    visualizacoes: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalSalvos: 0,
    totalLidos: 0,
    slug: "obra",
    link: "/obra/obra",
    ...valor,
  };
}

globalThis.__editarObraLocalWorkStorage = {
  carregarBackupArquivosObras(userId) {
    chamadas.push(["carregar-backup", userId]);
    return backupAtual;
  },
  restaurarArquivoObraComBackup(obra, backup) {
    chamadas.push(["restaurar", obra.id, backup]);
    return obra.arquivoObra ? obra : { ...obra, arquivoObra: backup[`id:${obra.id}`] || null };
  },
  sincronizarBackupArquivosObras(obras, userId) {
    chamadas.push(["sincronizar", obras.map((obra) => obra.id), userId]);
  },
  usuarioPodeEditarObraLocal(obra, userId) {
    chamadas.push(["ownership", obra.id, userId]);
    return obra.autorId.trim().toLowerCase() === userId.trim().toLowerCase();
  },
  prepararObraEdicaoParaStorage(obra) {
    chamadas.push(["preparar", obra.id]);
    return { ...obra, preparado: true };
  },
  lerStorageUsuarioEditarObra(chave, userId) {
    chamadas.push(["ler", chave, userId]);
    return obrasArmazenadas;
  },
  salvarJsonStorageUsuarioEditarObra(chave, userId, valor) {
    chamadas.push(["salvar", chave, userId, valor]);
  },
  normalizarObra(obra, index) {
    chamadas.push(["normalizar", obra.id || "", index]);
    return criarObra({ ...obra, id: obra.id || `obra-${index + 1}` });
  },
};

const sourceComDependencias = source
  .replace(
    /import \{[\s\S]*?carregarBackupArquivosObras,[\s\S]*?restaurarArquivoObraComBackup,[\s\S]*?sincronizarBackupArquivosObras,[\s\S]*?\} from "\.\/editar-obra-file-backup-storage";/,
    [
      "const carregarBackupArquivosObras = globalThis.__editarObraLocalWorkStorage.carregarBackupArquivosObras;",
      "const restaurarArquivoObraComBackup = globalThis.__editarObraLocalWorkStorage.restaurarArquivoObraComBackup;",
      "const sincronizarBackupArquivosObras = globalThis.__editarObraLocalWorkStorage.sincronizarBackupArquivosObras;",
    ].join("\n"),
  )
  .replace(
    'import { usuarioPodeEditarObraLocal } from "./editar-obra-ownership-utils";',
    "const usuarioPodeEditarObraLocal = globalThis.__editarObraLocalWorkStorage.usuarioPodeEditarObraLocal;",
  )
  .replace(
    'import { prepararObraEdicaoParaStorage } from "./editar-obra-storage-preparation";',
    "const prepararObraEdicaoParaStorage = globalThis.__editarObraLocalWorkStorage.prepararObraEdicaoParaStorage;",
  )
  .replace(
    /import \{[\s\S]*?lerStorageUsuarioEditarObra,[\s\S]*?salvarJsonStorageUsuarioEditarObra,[\s\S]*?\} from "\.\/editar-obra-storage-utils";/,
    [
      "const lerStorageUsuarioEditarObra = globalThis.__editarObraLocalWorkStorage.lerStorageUsuarioEditarObra;",
      "const salvarJsonStorageUsuarioEditarObra = globalThis.__editarObraLocalWorkStorage.salvarJsonStorageUsuarioEditarObra;",
    ].join("\n"),
  )
  .replace(
    'import { normalizarObra } from "./editar-obra-work-normalizer";',
    "const normalizarObra = globalThis.__editarObraLocalWorkStorage.normalizarObra;",
  );

const javascript = typescript.transpileModule(sourceComDependencias, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  carregarObrasLocalStorageEdicaoObra,
  salvarObrasDoUsuarioPreservandoOutrasContas,
} = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

function comBrowser(executar) {
  const windowAnterior = globalThis.window;
  globalThis.window = {};

  try {
    executar();
  } finally {
    globalThis.window = windowAnterior;
  }
}

function reiniciar({ armazenamento = null, backup = {} } = {}) {
  chamadas.length = 0;
  obrasArmazenadas = armazenamento;
  backupAtual = backup;
}

test("persistência local preserva retornos sem browser ou usuário", () => {
  reiniciar();
  const obras = [criarObra()];
  assert.strictEqual(salvarObrasDoUsuarioPreservandoOutrasContas(obras, "usuario"), obras);
  assert.deepEqual(carregarObrasLocalStorageEdicaoObra("usuario"), []);
  assert.equal(chamadas.length, 0);

  comBrowser(() => {
    assert.deepEqual(salvarObrasDoUsuarioPreservandoOutrasContas(obras, "  "), []);
    assert.deepEqual(carregarObrasLocalStorageEdicaoObra("  "), []);
  });
  assert.equal(chamadas.length, 0);
});

test("persistência local normaliza, filtra, prepara e sincroniza obras ao salvar", () => {
  reiniciar();

  comBrowser(() => {
    const resultado = salvarObrasDoUsuarioPreservandoOutrasContas(
      [
        criarObra({ id: "sem-autor", autorId: "" }),
        criarObra({ id: "autor-existente", autorId: "Usuario-A" }),
        criarObra({ id: "outra-conta", autorId: "usuario-b" }),
      ],
      " usuario-a ",
    );

    assert.deepEqual(resultado.map((obra) => obra.id), ["sem-autor", "autor-existente"]);
    assert.deepEqual(resultado.map((obra) => obra.autorId), ["usuario-a", "Usuario-A"]);
  });

  const salvar = chamadas.find(([tipo]) => tipo === "salvar");
  assert.deepEqual(salvar.slice(0, 3), ["salvar", "historietas-obras", "usuario-a"]);
  assert.equal(salvar[3].every((obra) => obra.preparado), true);
  assert.deepEqual(chamadas.at(-1), ["sincronizar", ["sem-autor", "autor-existente"], "usuario-a"]);
});

test("persistência local carrega, restaura e regrava JSON válido sanitizado", () => {
  reiniciar({
    armazenamento: JSON.stringify([
      criarObra({ id: "sem-autor", autorId: "", arquivoObra: null }),
      criarObra({ id: "outra-conta", autorId: "usuario-b" }),
    ]),
    backup: { "id:sem-autor": { nome: "backup.txt" } },
  });

  comBrowser(() => {
    const resultado = carregarObrasLocalStorageEdicaoObra(" usuario-a ");
    assert.deepEqual(resultado.map((obra) => obra.id), ["sem-autor"]);
    assert.equal(resultado[0].autorId, "usuario-a");
    assert.deepEqual(resultado[0].arquivoObra, { nome: "backup.txt" });
  });

  const normalizar = chamadas.filter(([tipo]) => tipo === "normalizar");
  const restaurar = chamadas.filter(([tipo]) => tipo === "restaurar");
  const salvar = chamadas.find(([tipo]) => tipo === "salvar");
  assert.equal(normalizar.length, 2);
  assert.equal(restaurar.length, 2);
  assert.deepEqual(salvar.slice(0, 3), ["salvar", "historietas-obras", "usuario-a"]);
  assert.deepEqual(salvar[3].map((obra) => obra.id), ["sem-autor"]);
  assert.deepEqual(chamadas.at(-1), ["sincronizar", ["sem-autor"], "usuario-a"]);
});

test("persistência local trata JSON inválido e valores que não são lista", () => {
  for (const armazenamento of ["{inválido", JSON.stringify({ id: "obra" })]) {
    reiniciar({ armazenamento });

    comBrowser(() => {
      assert.deepEqual(carregarObrasLocalStorageEdicaoObra("usuario-a"), []);
    });

    const salvar = chamadas.find(([tipo]) => tipo === "salvar");
    assert.deepEqual(salvar, ["salvar", "historietas-obras", "usuario-a", []]);
    assert.deepEqual(chamadas.at(-1), ["sincronizar", [], "usuario-a"]);
  }
});

test("Editar Obra delega somente a persistência local das obras", () => {
  assert.match(
    initialLoadSource,
    /import \{[\s\S]*?carregarObrasLocalStorageEdicaoObra,[\s\S]*?salvarObrasDoUsuarioPreservandoOutrasContas,[\s\S]*?\} from "\.\.\/lib\/editar-obra-local-work-storage";/,
  );
  assert.match(
    saveActionSource,
    /import \{ persistirObraLocalEBackupEdicaoObra \} from "\.\.\/lib\/editar-obra-local-persistence";/,
  );
  assert.match(
    localPersistenceSource,
    /import \{ salvarObrasDoUsuarioPreservandoOutrasContas \} from "\.\/editar-obra-local-work-storage";/,
  );
  assert.doesNotMatch(saveActionSource, /salvarObrasDoUsuarioPreservandoOutrasContas\(/);
  for (const helper of [
    "salvarObrasDoUsuarioPreservandoOutrasContas",
    "carregarObrasLocalStorageEdicaoObra",
  ]) {
    assert.doesNotMatch(saveActionSource, new RegExp(`function ${helper}\\(`));
  }
  assert.doesNotMatch(pageSource, /const STORAGE_KEY = "historietas-obras";/);
  assert.match(source, /const STORAGE_KEY = "historietas-obras";/);
  assert.match(source, /normalizarObra\(/);
  assert.match(source, /usuarioPodeEditarObraLocal\(obra, usuarioId\)/);
  assert.match(source, /restaurarArquivoObraComBackup\(obra, backupArquivosObras\)/);
  assert.match(source, /prepararObraEdicaoParaStorage/);
  assert.match(source, /sincronizarBackupArquivosObras\(obrasDoUsuario, usuarioId\)/);
});
