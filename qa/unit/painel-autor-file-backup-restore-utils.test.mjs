import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-file-backup-restore-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const localCleanupSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-deleted-work-local-cleanup.ts",
    import.meta.url,
  ),
  "utf8",
);
const backupSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-file-backup-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript
  .transpileModule(utilsSource, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { obterChavesBackupArquivoPainel } from "./painel-autor-file-backup-key-utils";',
    'const obterChavesBackupArquivoPainel = () => ["primeira", "segunda", "terceira"];',
  )
  .replace(
    'import { normalizarArquivoObra } from "./painel-autor-file-normalizer";',
    'const normalizarArquivoObra = (arquivo) => arquivo?.valido ? arquivo : null;',
  );
const { restaurarArquivoObraComBackup } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const arquivoValido = {
  valido: true,
  nome: "arquivo.txt",
  tipo: "text/plain",
  tamanho: 12,
  conteudo: "conteúdo",
  categoria: "texto",
  criadoEm: "2026-01-01",
};

test("restaurarArquivoObraComBackup preserva a obra quando já há arquivo", () => {
  const obra = { id: "1", slug: "obra", titulo: "Obra", arquivoObra: arquivoValido };

  assert.strictEqual(
    restaurarArquivoObraComBackup(obra, { primeira: arquivoValido }),
    obra,
  );
});

test("restaurarArquivoObraComBackup usa o primeiro backup válido na ordem das chaves", () => {
  const obra = { id: "1", slug: "obra", titulo: "Obra", arquivoObra: null };
  const terceiroArquivo = { ...arquivoValido, nome: "terceiro.txt" };

  const resultado = restaurarArquivoObraComBackup(obra, {
    primeira: { valido: false },
    segunda: arquivoValido,
    terceira: terceiroArquivo,
  });

  assert.deepEqual(resultado, { ...obra, arquivoObra: arquivoValido });
  assert.notStrictEqual(resultado, obra);
  assert.strictEqual(resultado.arquivoObra, arquivoValido);
});

test("restaurarArquivoObraComBackup preserva referência sem backup válido", () => {
  const obra = { id: "1", slug: "obra", titulo: "Obra" };

  assert.strictEqual(
    restaurarArquivoObraComBackup(obra, {
      primeira: { valido: false },
      segunda: null,
    }),
    obra,
  );
});

test("Painel do Autor delega somente a restauração de backup ao módulo extraído", () => {
  const initialDataHook = readFileSync(
    new URL("../../app/painel-autor/hooks/use-painel-autor-initial-data.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    initialDataHook,
    /import \{ restaurarArquivoObraComBackup \} from "\.\.\/lib\/painel-autor-file-backup-restore-utils";/,
  );
  assert.doesNotMatch(pagina, /function restaurarArquivoObraComBackup\(/);
  assert.equal((initialDataHook.match(/\brestaurarArquivoObraComBackup\b/g) || []).length, 2);
  assert.match(initialDataHook, /const backupArquivosObras = carregarBackupArquivosObras\(usuarioIdLogado\);/);
  assert.match(
    utilsSource,
    /import \{ obterChavesBackupArquivoPainel \} from "\.\/painel-autor-file-backup-key-utils";/,
  );
  assert.match(
    utilsSource,
    /import \{ normalizarArquivoObra \} from "\.\/painel-autor-file-normalizer";/,
  );
  assert.doesNotMatch(utilsSource, /localStorage|supabase|useState|useEffect/);
});

const dadosStorage = new Map();
let salvarStorageDeveFalhar = false;
const chaveStorage = (chave, userId) => `${chave}:${userId.trim()}`;

globalThis.__painelAutorBackupArquivoChaves = (obra) =>
  [
    `id:${obra.id}`,
    `slug:${obra.slug}`,
    `titulo:${obra.titulo}`,
    obra.link,
  ].filter(Boolean);
globalThis.__painelAutorBackupNormalizarArquivo = (arquivo) =>
  arquivo?.valido ? { nome: arquivo.nome, conteudo: arquivo.conteudo } : null;
globalThis.__painelAutorBackupLerStorage = (chave, userId) =>
  dadosStorage.get(chaveStorage(chave, userId)) ?? null;
globalThis.__painelAutorBackupSalvarStorage = (chave, userId, valor) => {
  if (salvarStorageDeveFalhar) {
    throw new Error("storage unavailable");
  }
  dadosStorage.set(chaveStorage(chave, userId), JSON.stringify(valor));
};

const backupJavascript = typescript.transpileModule(
  backupSource
    .replace(
      'import { obterChavesBackupArquivoPainel } from "./painel-autor-file-backup-key-utils";',
      "const obterChavesBackupArquivoPainel = globalThis.__painelAutorBackupArquivoChaves;",
    )
    .replace(
      'import { normalizarArquivoObra } from "./painel-autor-file-normalizer";',
      "const normalizarArquivoObra = globalThis.__painelAutorBackupNormalizarArquivo;",
    )
    .replace(
      /import \{\s*lerStorageUsuarioPainel,\s*salvarJsonStorageUsuarioPainel,\s*\} from "\.\/painel-autor-storage-utils";/,
      [
        "const lerStorageUsuarioPainel = globalThis.__painelAutorBackupLerStorage;",
        "const salvarJsonStorageUsuarioPainel = globalThis.__painelAutorBackupSalvarStorage;",
      ].join("\n"),
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  FILE_BACKUP_STORAGE_KEY,
  carregarBackupArquivosObras,
  sincronizarBackupArquivosObras,
} = await import(
  `data:text/javascript;base64,${Buffer.from(backupJavascript).toString("base64")}`,
);

const arquivoBackupValido = (nome) => ({
  valido: true,
  nome,
  conteudo: `conteúdo ${nome}`,
});

test("backup local de arquivos preserva leitura, normalização e fallback", () => {
  dadosStorage.clear();
  assert.deepEqual(carregarBackupArquivosObras(""), {});
  assert.equal(dadosStorage.size, 0);

  dadosStorage.set(
    chaveStorage(FILE_BACKUP_STORAGE_KEY, "autor-1"),
    JSON.stringify({
      " obra-1 ": arquivoBackupValido("obra-1.txt"),
      "": arquivoBackupValido("ignorado.txt"),
      invalido: { valido: false },
    }),
  );

  assert.deepEqual(carregarBackupArquivosObras("autor-1"), {
    " obra-1 ": { nome: "obra-1.txt", conteudo: "conteúdo obra-1.txt" },
  });
  assert.deepEqual(
    JSON.parse(dadosStorage.get(chaveStorage(FILE_BACKUP_STORAGE_KEY, "autor-1"))),
    { " obra-1 ": { nome: "obra-1.txt", conteudo: "conteúdo obra-1.txt" } },
  );

  dadosStorage.set(chaveStorage(FILE_BACKUP_STORAGE_KEY, "autor-1"), "{inválido");
  assert.deepEqual(carregarBackupArquivosObras("autor-1"), {});
  assert.equal(dadosStorage.get(chaveStorage(FILE_BACKUP_STORAGE_KEY, "autor-1")), "{}");
  dadosStorage.set(chaveStorage(FILE_BACKUP_STORAGE_KEY, "autor-1"), "[]");
  assert.deepEqual(carregarBackupArquivosObras("autor-1"), {});
});

test("backup local de arquivos preserva chaves e persistência", () => {
  dadosStorage.clear();
  sincronizarBackupArquivosObras([], "");
  assert.equal(dadosStorage.size, 0);

  sincronizarBackupArquivosObras(
    [
      {
        id: "obra-1",
        slug: "obra-um",
        titulo: "Obra um",
        link: "/obra/obra-um",
        arquivoObra: arquivoBackupValido("obra-um.txt"),
      },
      {
        id: "obra-2",
        slug: "obra-dois",
        titulo: "Obra dois",
        arquivoObra: { valido: false },
      },
    ],
    "autor-1",
  );

  const backup = JSON.parse(
    dadosStorage.get(chaveStorage(FILE_BACKUP_STORAGE_KEY, "autor-1")),
  );
  const arquivoNormalizado = {
    nome: "obra-um.txt",
    conteudo: "conteúdo obra-um.txt",
  };
  assert.deepEqual(backup, {
    "id:obra-1": arquivoNormalizado,
    "slug:obra-um": arquivoNormalizado,
    "titulo:Obra um": arquivoNormalizado,
    "/obra/obra-um": arquivoNormalizado,
  });
});

test("backup local de arquivos ignora falha de persistência durante a sincronização", () => {
  salvarStorageDeveFalhar = true;
  assert.doesNotThrow(() =>
    sincronizarBackupArquivosObras(
      [
        {
          id: "obra-3",
          slug: "obra-tres",
          titulo: "Obra três",
          arquivoObra: arquivoBackupValido("obra-tres.txt"),
        },
      ],
      "autor-1",
    ),
  );
  salvarStorageDeveFalhar = false;
});

test("Painel do Autor delega somente a persistência local de backup de arquivos", () => {
  const initialDataHook = readFileSync(
    new URL("../../app/painel-autor/hooks/use-painel-autor-initial-data.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    initialDataHook,
    /import \{[\s\S]*?carregarBackupArquivosObras,[\s\S]*?sincronizarBackupArquivosObras,[\s\S]*?\} from "\.\.\/lib\/painel-autor-file-backup-storage";/,
  );
  assert.doesNotMatch(pagina, /const FILE_BACKUP_STORAGE_KEY =/);
  assert.doesNotMatch(pagina, /type ArquivosObrasBackup =/);
  assert.doesNotMatch(pagina, /function carregarBackupArquivosObras\(/);
  assert.doesNotMatch(pagina, /function sincronizarBackupArquivosObras\(/);
  assert.match(initialDataHook, /carregarBackupArquivosObras\(usuarioIdLogado\)/);
  assert.match(initialDataHook, /sincronizarBackupArquivosObras\(obrasFinais, usuarioIdLogado\)/);
  assert.match(
    localCleanupSource,
    /import \{[\s\S]*?FILE_BACKUP_STORAGE_KEY,[\s\S]*?carregarBackupArquivosObras,[\s\S]*?\} from "\.\/painel-autor-file-backup-storage";/,
  );
  assert.match(backupSource, /export const FILE_BACKUP_STORAGE_KEY/);
  assert.match(backupSource, /export type ArquivosObrasBackup/);
  assert.match(backupSource, /Parameters<[\s\S]*?typeof obterChavesBackupArquivoPainel/);
  assert.match(backupSource, /lerStorageUsuarioPainel\(/);
  assert.match(backupSource, /JSON\.parse\(backupTexto\)/);
  assert.match(backupSource, /normalizarArquivoObra\(arquivo\)/);
  assert.match(backupSource, /obterChavesBackupArquivoPainel\(obra\)\.forEach/);
  assert.match(backupSource, /salvarJsonStorageUsuarioPainel\(/);
  assert.doesNotMatch(backupSource, /localStorage|supabase|useState|useEffect/);
});
