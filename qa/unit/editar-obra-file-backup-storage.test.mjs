import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-file-backup-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
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
const localWorkStorageSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-work-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const dadosStorage = new Map();

globalThis.__editarObraBackupChaves = (obra) => [
  `id:${obra.id}`,
  `slug:${obra.slug || "obra"}`,
  `titulo:${obra.titulo.toLowerCase()}`,
  obra.link ? `link:${obra.link}` : "",
].filter(Boolean);
globalThis.__editarObraBackupNormalizarArquivo = (arquivo) =>
  arquivo?.valido
    ? {
        nome: arquivo.nome,
        tipo: typeof arquivo.tipo === "string" ? arquivo.tipo : "",
        tamanho: typeof arquivo.tamanho === "number" ? arquivo.tamanho : 0,
        conteudo: arquivo.conteudo,
        categoria: arquivo.categoria || "outro",
        criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
      }
    : null;
globalThis.__editarObraBackupLerStorage = (chave, userId) =>
  dadosStorage.get(`${chave}:${userId.trim()}`) ?? null;
globalThis.__editarObraBackupSalvarStorage = (chave, userId, valor) => {
  dadosStorage.set(`${chave}:${userId.trim()}`, JSON.stringify(valor));
};

const javascript = typescript
  .transpileModule(
    source
      .replace(
        'import { obterChavesBackupArquivoEdicaoObra } from "./editar-obra-file-backup-key-utils";',
        "const obterChavesBackupArquivoEdicaoObra = globalThis.__editarObraBackupChaves;",
      )
      .replace(
        'import { normalizarArquivoObra } from "./editar-obra-file-normalization";',
        "const normalizarArquivoObra = globalThis.__editarObraBackupNormalizarArquivo;",
      )
      .replace(
        /import \{[\s\S]*?lerStorageUsuarioEditarObra,[\s\S]*?salvarJsonStorageUsuarioEditarObra,[\s\S]*?\} from "\.\/editar-obra-storage-utils";/,
        [
          "const lerStorageUsuarioEditarObra = globalThis.__editarObraBackupLerStorage;",
          "const salvarJsonStorageUsuarioEditarObra = globalThis.__editarObraBackupSalvarStorage;",
        ].join("\n"),
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const {
  FILE_BACKUP_STORAGE_KEY,
  carregarBackupArquivosObras,
  salvarArquivoObraNoBackup,
  sincronizarBackupArquivosObras,
  restaurarArquivoObraComBackup,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function comBrowser(executar) {
  const windowAnterior = globalThis.window;
  globalThis.window = {};

  try {
    executar();
  } finally {
    globalThis.window = windowAnterior;
  }
}

function arquivoValido(nome = "arquivo.txt") {
  return {
    valido: true,
    nome,
    tipo: "text/plain",
    tamanho: 12,
    conteudo: `conteudo ${nome}`,
    categoria: "texto",
    criadoEm: "2026-01-01",
  };
}

function arquivoNormalizado(nome) {
  const arquivo = arquivoValido(nome);
  Reflect.deleteProperty(arquivo, "valido");

  return arquivo;
}

test("backup de Editar Obra retorna vazio sem browser ou usuario", () => {
  dadosStorage.clear();
  assert.deepEqual(carregarBackupArquivosObras("usuario-1"), {});
  assert.deepEqual(carregarBackupArquivosObras(""), {});

  comBrowser(() => {
    assert.deepEqual(carregarBackupArquivosObras(""), {});
    salvarArquivoObraNoBackup(
      { id: "obra-1", slug: "obra", titulo: "Obra", link: "" },
      arquivoValido(),
      "",
    );
    sincronizarBackupArquivosObras([], "");
  });

  assert.equal(dadosStorage.size, 0);
});

test("backup de Editar Obra preserva fallbacks e normaliza antes de persistir", () => {
  dadosStorage.clear();
  const chave = `${FILE_BACKUP_STORAGE_KEY}:usuario-1`;
  dadosStorage.set(chave, "{invalido");

  comBrowser(() => {
    assert.deepEqual(carregarBackupArquivosObras("usuario-1"), {});
    assert.equal(dadosStorage.get(chave), "{invalido");

    dadosStorage.set(chave, "[]");
    assert.deepEqual(carregarBackupArquivosObras("usuario-1"), {});

    dadosStorage.set(chave, JSON.stringify("backup invalido"));
    assert.deepEqual(carregarBackupArquivosObras("usuario-1"), {});

    dadosStorage.set(
      chave,
      JSON.stringify({
        " obra-valida ": arquivoValido("roteiro.txt"),
        "   ": arquivoValido("ignorado.txt"),
        invalido: { valido: false },
      }),
    );
    const backup = carregarBackupArquivosObras("usuario-1");
    assert.deepEqual(backup, {
      " obra-valida ": arquivoNormalizado("roteiro.txt"),
    });
    assert.deepEqual(JSON.parse(dadosStorage.get(chave)), backup);
  });
});

test("backup de Editar Obra grava e remove todas as chaves da obra", () => {
  dadosStorage.clear();
  const obra = {
    id: "obra-1",
    slug: "obra-um",
    titulo: "Obra Um",
    link: "/obra/obra-um",
  };

  comBrowser(() => {
    salvarArquivoObraNoBackup(obra, arquivoValido(), "usuario-1");
    const chave = `${FILE_BACKUP_STORAGE_KEY}:usuario-1`;
    const backup = JSON.parse(dadosStorage.get(chave));
    for (const chaveObra of globalThis.__editarObraBackupChaves(obra)) {
      assert.equal(backup[chaveObra].nome, "arquivo.txt");
    }

    salvarArquivoObraNoBackup(obra, null, "usuario-1");
    assert.deepEqual(JSON.parse(dadosStorage.get(chave)), {});
  });
});

test("backup de Editar Obra sincroniza somente obras com arquivo e preserva entradas", () => {
  dadosStorage.clear();
  const chave = `${FILE_BACKUP_STORAGE_KEY}:usuario-1`;
  dadosStorage.set(chave, JSON.stringify({ antiga: arquivoValido("antiga.txt") }));

  comBrowser(() => {
    sincronizarBackupArquivosObras(
      [
        {
          id: "obra-1",
          slug: "obra-um",
          titulo: "Obra Um",
          link: "/obra/obra-um",
          arquivoObra: arquivoValido("nova.txt"),
        },
        {
          id: "obra-2",
          slug: "obra-dois",
          titulo: "Obra Dois",
          link: "",
          arquivoObra: null,
        },
      ],
      "usuario-1",
    );

    const backup = JSON.parse(dadosStorage.get(chave));
    assert.equal(backup.antiga.nome, "antiga.txt");
    assert.equal(backup["id:obra-1"].nome, "nova.txt");
    assert.equal(backup["id:obra-2"], undefined);
  });
});

test("backup de Editar Obra restaura o primeiro arquivo valido sem substituir arquivo atual", () => {
  const obra = {
    id: "obra-1",
    slug: "obra-um",
    titulo: "Obra Um",
    link: "",
    arquivoObra: null,
  };
  const existente = { ...obra, arquivoObra: arquivoValido("existente.txt") };

  assert.strictEqual(restaurarArquivoObraComBackup(existente, {}), existente);
  assert.deepEqual(
    restaurarArquivoObraComBackup(obra, {
      "id:obra-1": { valido: false },
      "slug:obra-um": arquivoValido("primeiro.txt"),
      "titulo:obra um": arquivoValido("segundo.txt"),
    }),
    { ...obra, arquivoObra: arquivoNormalizado("primeiro.txt") },
  );
  assert.strictEqual(restaurarArquivoObraComBackup(obra, {}), obra);
});

test("Editar Obra delega somente o backup local de arquivos ao modulo extraido", () => {
  assert.match(
    saveActionSource,
    /import \{ carregarBackupArquivosObras \} from "\.\.\/lib\/editar-obra-file-backup-storage";/,
  );
  assert.match(
    saveActionSource,
    /import \{ persistirObraLocalEBackupEdicaoObra \} from "\.\.\/lib\/editar-obra-local-persistence";/,
  );
  assert.match(
    localPersistenceSource,
    /import \{[\s\S]*?salvarArquivoObraNoBackup,[\s\S]*?sincronizarBackupArquivosObras,[\s\S]*?\} from "\.\/editar-obra-file-backup-storage";/,
  );
  assert.doesNotMatch(pageSource, /const FILE_BACKUP_STORAGE_KEY =/);
  for (const helper of [
    "carregarBackupArquivosObras",
    "salvarArquivoObraNoBackup",
    "sincronizarBackupArquivosObras",
    "restaurarArquivoObraComBackup",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.doesNotMatch(pageSource, /restaurarArquivoObraComBackup\(obra, backupArquivosObras\)/);
  assert.doesNotMatch(saveActionSource, /salvarArquivoObraNoBackup\(/);
  assert.match(localPersistenceSource, /salvarArquivoObraNoBackup\(/);
  assert.match(localWorkStorageSource, /const backupArquivosObras = carregarBackupArquivosObras\(usuarioId\);/);
  assert.match(localWorkStorageSource, /restaurarArquivoObraComBackup\(obra, backupArquivosObras\)/);
  assert.match(localWorkStorageSource, /sincronizarBackupArquivosObras\(obrasDoUsuarioComDono, usuarioId\);/);
  assert.match(source, /export const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";/);
  assert.match(source, /obterChavesBackupArquivoEdicaoObra\(obra\)\.forEach/);
  assert.match(source, /normalizarArquivoObra\(arquivo\)/);
  assert.match(source, /lerStorageUsuarioEditarObra\(/);
  assert.match(source, /salvarJsonStorageUsuarioEditarObra\(/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
