import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const storageSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-local-work-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const initialLoadHookSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/hooks/useEditarCapituloInitialLoad.ts",
    import.meta.url,
  ),
  "utf8",
);

const eventos = [];
const armazenamento = new Map();
let backupAtual = {};

globalThis.__editarCapituloLocalWorkBackup = {
  carregarBackupArquivosObras: (userId) => {
    eventos.push(["carregar-backup", userId]);
    return backupAtual;
  },
  restaurarArquivoObraComBackup: (obra, backup) => {
    eventos.push(["restaurar", obra.id]);

    return obra.arquivoObra
      ? obra
      : { ...obra, arquivoObra: backup[obra.id] || null };
  },
  sincronizarBackupArquivosObras: (obras, userId) => {
    eventos.push(["sincronizar", userId, obras.map((obra) => obra.id)]);
  },
};
globalThis.__editarCapituloLocalWorkStorage = {
  lerStorageUsuarioEditarCapitulo: (chave, userId) => {
    eventos.push(["ler", chave, userId]);
    return armazenamento.get(`${chave}:${userId}`) ?? null;
  },
  salvarJsonStorageUsuarioEditarCapitulo: (chave, userId, valor) => {
    eventos.push(["salvar", chave, userId, valor.map((obra) => obra.id)]);
    armazenamento.set(`${chave}:${userId}`, JSON.stringify(valor));
  },
};
globalThis.__editarCapituloLocalWorkNormalizer = {
  normalizarObra: (obra, index) => {
    eventos.push(["normalizar", obra.id, index]);

    return {
      ...obra,
      id: typeof obra.id === "string" && obra.id.trim() ? obra.id : `obra-${index + 1}`,
      titulo: typeof obra.titulo === "string" ? obra.titulo : "Obra sem título",
      autorId: typeof obra.autorId === "string" && obra.autorId.trim() ? obra.autorId.trim() : "",
      slug: typeof obra.slug === "string" ? obra.slug : "",
      arquivoObra: obra.arquivoObra || null,
    };
  },
};

const storageJavascript = typescript.transpileModule(
  storageSource
    .replace(
      /import \{\r?\n  carregarBackupArquivosObras,\r?\n  restaurarArquivoObraComBackup,\r?\n  sincronizarBackupArquivosObras,\r?\n\} from "\.\/editar-capitulo-file-backup-utils";/,
      "const { carregarBackupArquivosObras, restaurarArquivoObraComBackup, sincronizarBackupArquivosObras } = globalThis.__editarCapituloLocalWorkBackup;",
    )
    .replace(
      /import \{\r?\n  lerStorageUsuarioEditarCapitulo,\r?\n  salvarJsonStorageUsuarioEditarCapitulo,\r?\n\} from "\.\/editar-capitulo-storage-utils";/,
      "const { lerStorageUsuarioEditarCapitulo, salvarJsonStorageUsuarioEditarCapitulo } = globalThis.__editarCapituloLocalWorkStorage;",
    )
    .replace(
      'import { normalizarObra } from "./editar-capitulo-work-normalizer";',
      "const { normalizarObra } = globalThis.__editarCapituloLocalWorkNormalizer;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  obraPertenceAoUsuarioEditarCapitulo,
  carregarObrasLocaisNormalizadas,
  salvarObrasEditarCapituloStorage,
} = await import(
  `data:text/javascript;base64,${Buffer.from(storageJavascript).toString("base64")}`,
);

function prepararCenario() {
  eventos.length = 0;
  armazenamento.clear();
  backupAtual = {};
}

test("storage local de Editar Capítulo preserva ownership por usuário", () => {
  assert.equal(obraPertenceAoUsuarioEditarCapitulo({ autorId: "usuario" }, ""), false);
  assert.equal(
    obraPertenceAoUsuarioEditarCapitulo({ autorId: " usuario " }, " usuario "),
    true,
  );
  assert.equal(
    obraPertenceAoUsuarioEditarCapitulo({ autorId: "outro" }, "usuario"),
    false,
  );
});

test("storage local de Editar Capítulo carrega, restaura, filtra e persiste na ordem atual", () => {
  prepararCenario();
  assert.deepEqual(carregarObrasLocaisNormalizadas(" "), []);
  assert.deepEqual(eventos, []);

  armazenamento.set("historietas-obras:usuario", "{");
  assert.deepEqual(carregarObrasLocaisNormalizadas("usuario"), []);
  assert.deepEqual(eventos.at(-2), ["sincronizar", "usuario", []]);
  assert.deepEqual(eventos.at(-1), ["salvar", "historietas-obras", "usuario", []]);

  prepararCenario();
  backupAtual = { proprietaria: { nome: "restaurado.txt", conteudo: "arquivo" } };
  armazenamento.set(
    "historietas-obras:usuario",
    JSON.stringify([
      { id: "proprietaria", titulo: "Minha obra", autorId: " usuario " },
      { id: "estrangeira", titulo: "Outra obra", autorId: "outra" },
    ]),
  );

  const obras = carregarObrasLocaisNormalizadas(" usuario ");

  assert.deepEqual(obras.map((obra) => obra.id), ["proprietaria"]);
  assert.equal(obras[0].autorId, "usuario");
  assert.equal(obras[0].arquivoObra.nome, "restaurado.txt");
  assert.deepEqual(eventos.slice(0, 6), [
    ["ler", "historietas-obras", "usuario"],
    ["carregar-backup", "usuario"],
    ["normalizar", "proprietaria", 0],
    ["normalizar", "estrangeira", 1],
    ["restaurar", "proprietaria"],
    ["restaurar", "estrangeira"],
  ]);
  assert.deepEqual(eventos.at(-2), ["sincronizar", "usuario", ["proprietaria"]]);
  assert.deepEqual(eventos.at(-1), ["salvar", "historietas-obras", "usuario", ["proprietaria"]]);
});

test("storage local de Editar Capítulo normaliza e persiste somente obras da conta", () => {
  prepararCenario();
  assert.deepEqual(salvarObrasEditarCapituloStorage([], " "), []);
  assert.deepEqual(eventos, []);

  const obras = salvarObrasEditarCapituloStorage(
    [
      { id: "sem-autor", titulo: "Minha obra", autorId: "" },
      { id: "estrangeira", titulo: "Outra obra", autorId: "outra" },
    ],
    " usuario ",
  );

  assert.deepEqual(obras.map((obra) => obra.id), ["sem-autor"]);
  assert.equal(obras[0].autorId, "usuario");
  assert.deepEqual(eventos.slice(0, 2), [
    ["normalizar", "sem-autor", 0],
    ["normalizar", "estrangeira", 1],
  ]);
  assert.deepEqual(eventos.at(-2), ["sincronizar", "usuario", ["sem-autor"]]);
  assert.deepEqual(eventos.at(-1), ["salvar", "historietas-obras", "usuario", ["sem-autor"]]);
});

test("Editar Capítulo delega apenas o storage local de obras ao módulo extraído", () => {
  assert.match(
    initialLoadHookSource,
    /import \{[\s\S]*?carregarObrasLocaisNormalizadas,[\s\S]*?salvarObrasEditarCapituloStorage,[\s\S]*?\} from "\.\.\/lib\/editar-capitulo-local-work-storage";/,
  );
  for (const helper of [
    "obraPertenceAoUsuarioEditarCapitulo",
    "carregarObrasLocaisNormalizadas",
    "salvarObrasEditarCapituloStorage",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.doesNotMatch(pageSource, /const STORAGE_KEY = "historietas-obras";/);
  assert.match(initialLoadHookSource, /carregarObrasLocaisNormalizadas\(userId\)/);
  assert.match(pageSource, /salvarObrasEditarCapituloStorage\([\s\S]*?userId/);
  assert.match(storageSource, /const STORAGE_KEY = "historietas-obras";/);
  assert.match(storageSource, /obraPertenceAoUsuarioEditarCapitulo\(obra, userIdLimpo\)/);
  assert.match(storageSource, /sincronizarBackupArquivosObras\(obrasNormalizadas, userIdLimpo\);/);
  assert.match(
    storageSource,
    /salvarJsonStorageUsuarioEditarCapitulo\([\s\S]*?STORAGE_KEY,[\s\S]*?userIdLimpo,[\s\S]*?obrasNormalizadas/,
  );
  assert.doesNotMatch(storageSource, /supabase|\.from\(|useState|useEffect|useRouter/);
});
