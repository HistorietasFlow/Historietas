import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-storage-path-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const currentAssetsPreparationSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-current-assets-preparation.ts",
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
const remoteStorageSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-remote-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript
  .transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { normalizarTexto } from "../../../lib/utils";',
    `const normalizarTexto = (valor) => valor
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .trim();`,
  );
const { limparNomeArquivoStorage, obterCaminhoStorageEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("nome de arquivo de Storage preserva extensões, pontos e normalização", () => {
  assert.equal(limparNomeArquivoStorage("obra"), "obra");
  assert.equal(limparNomeArquivoStorage("Capa.PNG"), "capa.png");
  assert.equal(limparNomeArquivoStorage("minha.obra.final.PdF"), "minha-obra-final.pdf");
  assert.equal(limparNomeArquivoStorage("  Crônica & Espaços .jpg"), "cronica-espacos.jpg");
  assert.equal(limparNomeArquivoStorage("@@@.webp"), "arquivo.webp");
});

test("caminho de Storage preserva caminhos diretos e URLs reconhecidas", () => {
  assert.equal(obterCaminhoStorageEdicaoObra("capas-obras", ""), "");
  assert.equal(obterCaminhoStorageEdicaoObra("capas-obras", "data:image/png;base64,x"), "");
  assert.equal(obterCaminhoStorageEdicaoObra("capas-obras", "usuario/capa.png"), "usuario/capa.png");
  assert.equal(obterCaminhoStorageEdicaoObra("capas-obras", "capas-obras//usuario/capa.png"), "usuario/capa.png");
  assert.equal(obterCaminhoStorageEdicaoObra("arquivos-obras", "/usuario/obra.pdf"), "usuario/obra.pdf");
  assert.equal(
    obterCaminhoStorageEdicaoObra("capas-obras", "https://x.test/storage/v1/object/public/capas-obras/usuario/capa%20nova.png"),
    "usuario/capa nova.png",
  );
  assert.equal(
    obterCaminhoStorageEdicaoObra("arquivos-obras", "https://x.test/storage/v1/object/sign/arquivos-obras/usuario/obra.pdf?token=x"),
    "usuario/obra.pdf",
  );
  assert.equal(
    obterCaminhoStorageEdicaoObra("arquivos-obras", "https://x.test/storage/v1/object/authenticated/arquivos-obras/usuario/obra.pdf"),
    "usuario/obra.pdf",
  );
});

test("caminho de Storage rejeita URLs sem prefixo válido ou inválidas", () => {
  assert.equal(obterCaminhoStorageEdicaoObra("capas-obras", "https://x.test/capa.png"), "");
  assert.equal(obterCaminhoStorageEdicaoObra("capas-obras", "https://[inválida"), "");
});

test("Editar Obra delega apenas caminhos de Storage ao módulo extraído", () => {
  assert.match(
    saveAssetsPreparationSource,
    /import \{ prepararAssetsAtuaisEdicaoObra \} from "\.\/editar-obra-current-assets-preparation";/,
  );
  assert.match(
    currentAssetsPreparationSource,
    /import \{ obterCaminhoStorageEdicaoObra \} from "\.\/editar-obra-storage-path-utils";/,
  );
  assert.doesNotMatch(pageSource, /function limparNomeArquivoStorage\(/);
  assert.doesNotMatch(pageSource, /function obterCaminhoStorageEdicaoObra\(/);
  assert.match(
    remoteStorageSource,
    /import \{ limparNomeArquivoStorage \} from "\.\/editar-obra-storage-path-utils";/,
  );
  assert.match(source, /from "\.\.\/\.\.\/\.\.\/lib\/utils";/);
  assert.match(source, /\/storage\/v1\/object\/public\/\$\{bucket\}\//);
  assert.match(source, /\/storage\/v1\/object\/sign\/\$\{bucket\}\//);
  assert.match(source, /\/storage\/v1\/object\/authenticated\/\$\{bucket\}\//);
  assert.match(
    currentAssetsPreparationSource,
    /obterCaminhoStorageEdicaoObra\([\s\S]*?"capas-obras"/,
  );
  assert.match(
    currentAssetsPreparationSource,
    /obterCaminhoStorageEdicaoObra\([\s\S]*?"arquivos-obras"/,
  );
  assert.doesNotMatch(source, /supabase|useState|useEffect/);
});
