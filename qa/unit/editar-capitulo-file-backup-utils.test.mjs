import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const backupSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-file-backup-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const normalizerSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-file-normalization.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const localWorkStorageSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-local-work-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const transpilar = (source) =>
  typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const { normalizarArquivoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(transpilar(normalizerSource)).toString("base64")}`,
);

const storage = new Map();
const gravacoes = [];
globalThis.__editarCapituloBackupUtils = {
  criarSlugBase: (titulo) =>
    titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "obra",
  normalizarTexto: (texto) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "),
};
globalThis.__editarCapituloBackupStorage = {
  lerStorageUsuarioEditarCapitulo: (chave, userId) =>
    storage.get(`${chave}:${userId}`) ?? null,
  salvarJsonStorageUsuarioEditarCapitulo: (chave, userId, valor) => {
    gravacoes.push({ chave, userId, valor });
    storage.set(`${chave}:${userId}`, JSON.stringify(valor));
  },
};
globalThis.__editarCapituloNormalizarArquivo = { normalizarArquivoObra };

const backupJavascript = transpilar(
  backupSource
    .replace(
      'import { criarSlugBase, normalizarTexto } from "../../../lib/utils";',
      "const { criarSlugBase, normalizarTexto } = globalThis.__editarCapituloBackupUtils;",
    )
    .replace(
      /import \{\r?\n  lerStorageUsuarioEditarCapitulo,\r?\n  salvarJsonStorageUsuarioEditarCapitulo,\r?\n\} from "\.\/editar-capitulo-storage-utils";/,
      "const { lerStorageUsuarioEditarCapitulo, salvarJsonStorageUsuarioEditarCapitulo } = globalThis.__editarCapituloBackupStorage;",
    )
    .replace(
      'import { normalizarArquivoObra } from "./editar-capitulo-file-normalization";',
      "const { normalizarArquivoObra } = globalThis.__editarCapituloNormalizarArquivo;",
    ),
);
const {
  FILE_BACKUP_STORAGE_KEY,
  criarChavesObra,
  carregarBackupArquivosObras,
  sincronizarBackupArquivosObras,
  restaurarArquivoObraComBackup,
} = await import(
  `data:text/javascript;base64,${Buffer.from(backupJavascript).toString("base64")}`,
);

const arquivo = {
  nome: "obra.txt",
  tipo: "text/plain",
  tamanho: 12,
  conteudo: "conteúdo",
  categoria: "texto",
  criadoEm: "2026-01-01",
};
const obra = {
  id: "obra-id",
  slug: "obra-slug",
  titulo: "Obra Título",
};

test("backup de Editar Capítulo preserva chaves, ordem, vazios e duplicados", () => {
  assert.deepEqual(criarChavesObra(obra), ["obra-id", "obra-slug", "obra-titulo", "obra titulo"]);
  assert.deepEqual(
    criarChavesObra({ id: " obra ", slug: "obra", titulo: "Obra" }),
    ["obra"],
  );
  assert.ok(
    criarChavesObra({ id: "", slug: "", titulo: "Obra" }).every(Boolean),
  );
});

test("backup de Editar Capítulo preserva leitura normalizada e falhas", () => {
  const tamanhoInicial = gravacoes.length;
  assert.deepEqual(carregarBackupArquivosObras(" "), {});
  assert.equal(gravacoes.length, tamanhoInicial);

  storage.set(`${FILE_BACKUP_STORAGE_KEY}:usuario`, "{");
  assert.deepEqual(carregarBackupArquivosObras(" usuario "), {});
  storage.set(`${FILE_BACKUP_STORAGE_KEY}:usuario`, "[]");
  assert.deepEqual(carregarBackupArquivosObras("usuario"), {});
  storage.set(
    `${FILE_BACKUP_STORAGE_KEY}:usuario`,
    JSON.stringify({ " obra ": arquivo, invalido: { nome: "", conteudo: "" }, " ": arquivo }),
  );

  assert.deepEqual(carregarBackupArquivosObras("usuario"), { " obra ": arquivo });
  assert.deepEqual(gravacoes.at(-1), {
    chave: FILE_BACKUP_STORAGE_KEY,
    userId: "usuario",
    valor: { " obra ": arquivo },
  });
});

test("backup de Editar Capítulo sincroniza sem apagar entradas e restaura por prioridade", () => {
  storage.set(
    `${FILE_BACKUP_STORAGE_KEY}:usuario`,
    JSON.stringify({ anterior: arquivo }),
  );
  sincronizarBackupArquivosObras([{ ...obra, arquivoObra: arquivo }], "usuario");
  const sincronizado = JSON.parse(storage.get(`${FILE_BACKUP_STORAGE_KEY}:usuario`));
  assert.deepEqual(sincronizado.anterior, arquivo);
  for (const chave of criarChavesObra(obra)) assert.deepEqual(sincronizado[chave], arquivo);

  const comArquivo = { ...obra, arquivoObra: { ...arquivo, nome: "atual.txt" } };
  assert.equal(restaurarArquivoObraComBackup(comArquivo, { "obra-id": arquivo }), comArquivo);
  assert.deepEqual(
    restaurarArquivoObraComBackup(obra, {
      "obra-id": { nome: "", conteudo: "" },
      "obra-slug": arquivo,
    }),
    { ...obra, arquivoObra: arquivo },
  );
  assert.equal(restaurarArquivoObraComBackup(obra, {}), obra);
});

test("Editar Capítulo delega somente o backup de arquivos ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?carregarBackupArquivosObras,[\s\S]*?restaurarArquivoObraComBackup,[\s\S]*?\} from "\.\/lib\/editar-capitulo-file-backup-utils";/,
  );
  for (const helper of [
    "criarChavesObra",
    "carregarBackupArquivosObras",
    "sincronizarBackupArquivosObras",
    "restaurarArquivoObraComBackup",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.match(
    localWorkStorageSource,
    /const backupArquivos = carregarBackupArquivosObras\(userIdLimpo\);/,
  );
  assert.match(
    localWorkStorageSource,
    /restaurarArquivoObraComBackup\(obra, backupArquivos\)/,
  );
  assert.match(
    localWorkStorageSource,
    /import \{[\s\S]*?sincronizarBackupArquivosObras,[\s\S]*?\} from "\.\/editar-capitulo-file-backup-utils";/,
  );
  assert.match(
    localWorkStorageSource,
    /sincronizarBackupArquivosObras\(obrasNormalizadas, userIdLimpo\);/,
  );
});
