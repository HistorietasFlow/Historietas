import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-local-work-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

const eventos = [];
const armazenamento = new Map();
let backupAtual = {};

globalThis.__adicionarCapituloLocalWorkStorage = {
  lerStorageUsuarioAdicionarCapitulo(chave, userId) {
    eventos.push(["ler", chave, userId]);
    return armazenamento.get(`${chave}:${userId}`) ?? null;
  },
  salvarJsonStorageUsuarioAdicionarCapitulo(chave, userId, valor) {
    eventos.push(["salvar", chave, userId, valor]);
    armazenamento.set(`${chave}:${userId}`, JSON.stringify(valor));
  },
};
globalThis.__adicionarCapituloLocalWorkNormalizer = {
  normalizarObra(obra, index) {
    eventos.push(["normalizar", obra.id, index]);
    return {
      ...obra,
      id: typeof obra.id === "string" && obra.id.trim() ? obra.id : `obra-${index + 1}`,
      titulo: typeof obra.titulo === "string" ? obra.titulo : "Obra sem título",
      autorId: typeof obra.autorId === "string" ? obra.autorId : "",
      capa: typeof obra.capa === "string" ? obra.capa : "",
      arquivoObra: obra.arquivoObra || null,
      slug: typeof obra.slug === "string" ? obra.slug : "",
      link: typeof obra.link === "string" ? obra.link : "",
    };
  },
};
globalThis.__adicionarCapituloLocalWorkBackup = {
  carregarBackupArquivosObras(userId) {
    eventos.push(["carregar-backup", userId]);
    return backupAtual;
  },
  restaurarArquivoObraComBackup(obra, backup) {
    eventos.push(["restaurar", obra.id]);
    return obra.arquivoObra
      ? obra
      : { ...obra, arquivoObra: backup[obra.id] || null };
  },
  sincronizarBackupArquivosObras(obras, userId) {
    eventos.push(["sincronizar", userId, obras]);
  },
};
globalThis.__adicionarCapituloLocalWorkOwnership = {
  obraPertenceAoUsuario(obra, userId) {
    eventos.push(["ownership", obra.id, userId]);
    return obra.autorId === userId;
  },
};
globalThis.__adicionarCapituloLocalWorkPreparation = {
  prepararObraAdicionarCapituloParaStorage(obra) {
    eventos.push(["preparar", obra.id]);
    return { ...obra, persistivel: true };
  },
};

const javascript = typescript.transpileModule(
  source
    .replace(
      /import \{\r?\n  lerStorageUsuarioAdicionarCapitulo,\r?\n  salvarJsonStorageUsuarioAdicionarCapitulo,\r?\n\} from "\.\/adicionar-capitulo-storage-utils";/,
      "const { lerStorageUsuarioAdicionarCapitulo, salvarJsonStorageUsuarioAdicionarCapitulo } = globalThis.__adicionarCapituloLocalWorkStorage;",
    )
    .replace(
      'import { normalizarObra } from "./adicionar-capitulo-work-normalizer";',
      "const { normalizarObra } = globalThis.__adicionarCapituloLocalWorkNormalizer;",
    )
    .replace(
      /import \{\r?\n  restaurarArquivoObraComBackup,\r?\n\} from "\.\/adicionar-capitulo-file-backup-utils";/,
      "const { restaurarArquivoObraComBackup } = globalThis.__adicionarCapituloLocalWorkBackup;",
    )
    .replace(
      /import \{\r?\n  carregarBackupArquivosObras,\r?\n  sincronizarBackupArquivosObras,\r?\n\} from "\.\/adicionar-capitulo-file-backup-storage";/,
      "const { carregarBackupArquivosObras, sincronizarBackupArquivosObras } = globalThis.__adicionarCapituloLocalWorkBackup;",
    )
    .replace(
      /import \{\r?\n  obraPertenceAoUsuario,\r?\n\} from "\.\/adicionar-capitulo-ownership-utils";/,
      "const { obraPertenceAoUsuario } = globalThis.__adicionarCapituloLocalWorkOwnership;",
    )
    .replace(
      /import \{\r?\n  prepararObraAdicionarCapituloParaStorage,\r?\n\} from "\.\/adicionar-capitulo-storage-preparation";/,
      "const { prepararObraAdicionarCapituloParaStorage } = globalThis.__adicionarCapituloLocalWorkPreparation;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { carregarObrasLocais, salvarObrasAdicionarCapituloStorage } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function prepararCenario() {
  eventos.length = 0;
  armazenamento.clear();
  backupAtual = {};
}

test("storage local de Adicionar Capítulo carrega, normaliza, restaura e persiste na ordem atual", () => {
  prepararCenario();

  assert.deepEqual(carregarObrasLocais(" usuario "), []);
  assert.deepEqual(eventos, [
    ["ler", "historietas-obras", "usuario"],
    ["carregar-backup", "usuario"],
    ["sincronizar", "usuario", []],
    ["salvar", "historietas-obras", "usuario", []],
  ]);

  prepararCenario();
  armazenamento.set("historietas-obras:usuario", JSON.stringify({ id: "obra" }));
  assert.deepEqual(carregarObrasLocais("usuario"), []);
  assert.equal(eventos.some(([tipo]) => tipo === "normalizar"), false);

  prepararCenario();
  backupAtual = {
    proprietaria: { nome: "restaurado.txt", conteudo: "arquivo" },
  };
  armazenamento.set(
    "historietas-obras:usuario",
    JSON.stringify([
      { id: "proprietaria", autorId: " usuario " },
      { id: "sem-autor" },
      { id: "estrangeira", autorId: "outra" },
    ]),
  );

  const obras = carregarObrasLocais(" usuario ");

  assert.deepEqual(obras.map((obra) => obra.id), ["proprietaria", "sem-autor"]);
  assert.equal(obras[0].autorId, "usuario");
  assert.equal(obras[1].autorId, "usuario");
  assert.equal(obras[0].arquivoObra.nome, "restaurado.txt");
  assert.deepEqual(eventos.slice(0, 8), [
    ["ler", "historietas-obras", "usuario"],
    ["carregar-backup", "usuario"],
    ["normalizar", "proprietaria", 0],
    ["restaurar", "proprietaria"],
    ["normalizar", "sem-autor", 1],
    ["restaurar", "sem-autor"],
    ["normalizar", "estrangeira", 2],
    ["restaurar", "estrangeira"],
  ]);
  const indiceSincronizacao = eventos.findIndex(([tipo]) => tipo === "sincronizar");
  const indicePersistencia = eventos.findIndex(([tipo]) => tipo === "salvar");
  assert.ok(indiceSincronizacao < indicePersistencia);
  assert.ok(eventos.filter(([tipo]) => tipo === "preparar").length === 2);

  prepararCenario();
  armazenamento.set("historietas-obras:", JSON.stringify([{ id: "sem-autor" }]));
  const obrasSemUsuario = carregarObrasLocais("");
  assert.deepEqual(obrasSemUsuario.map((obra) => obra.id), ["sem-autor"]);
  assert.equal(eventos.some(([tipo]) => tipo === "ownership"), false);
});

test("storage local de Adicionar Capítulo mantém o parse exposto e salva a conta na ordem atual", () => {
  prepararCenario();
  armazenamento.set("historietas-obras:usuario", "{");
  assert.throws(() => carregarObrasLocais("usuario"), SyntaxError);

  prepararCenario();
  assert.equal(salvarObrasAdicionarCapituloStorage([], "   "), undefined);
  assert.deepEqual(eventos, []);

  const obraCompleta = {
    id: "proprietaria",
    autorId: "usuario",
    capa: "data:image/png;base64,capa",
    arquivoObra: { conteudo: "data:text/plain;base64,arquivo" },
  };
  const obraEstrangeira = {
    id: "estrangeira",
    autorId: "outra",
    capa: "capa",
  };

  salvarObrasAdicionarCapituloStorage(
    [obraCompleta, obraEstrangeira],
    " usuario ",
  );

  assert.deepEqual(
    eventos.filter(([tipo]) => tipo === "preparar").map(([, id]) => id),
    ["proprietaria", "estrangeira"],
  );
  assert.ok(
    eventos.findIndex(([tipo]) => tipo === "preparar") <
      eventos.findIndex(([tipo]) => tipo === "ownership"),
  );
  const salvamento = eventos.find(([tipo]) => tipo === "salvar");
  assert.deepEqual(salvamento[3].map((obra) => obra.id), ["proprietaria"]);
  assert.equal(salvamento[3][0].persistivel, true);
  const sincronizacao = eventos.find(([tipo]) => tipo === "sincronizar");
  assert.strictEqual(sincronizacao[2][0], obraCompleta);
  assert.strictEqual(sincronizacao[2][1], obraEstrangeira);
  assert.ok(eventos.findIndex(([tipo]) => tipo === "salvar") < eventos.findIndex(([tipo]) => tipo === "sincronizar"));
});

test("Adicionar Capítulo delega somente o storage local de obras ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?carregarObrasLocais,[\s\S]*?salvarObrasAdicionarCapituloStorage,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-local-work-storage";/,
  );
  assert.doesNotMatch(pageSource, /function carregarObrasLocais\(/);
  assert.doesNotMatch(pageSource, /function salvarObrasAdicionarCapituloStorage\(/);
  assert.doesNotMatch(pageSource, /const STORAGE_KEY = "historietas-obras";/);
  assert.equal((pageSource.match(/carregarObrasLocais\(/g) || []).length, 2);
  assert.equal(
    (pageSource.match(/salvarObrasAdicionarCapituloStorage\(/g) || []).length,
    2,
  );
  assert.match(source, /const STORAGE_KEY = "historietas-obras";/);
  assert.doesNotMatch(
    source,
    /from\s+["']react["']|useState|useEffect|useMemo|useRef|supabase|router/i,
  );
  assert.doesNotMatch(
    source,
    /<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:(?:\s+[A-Za-z][\w-]*=)|\s*\/?>)/,
  );
});
