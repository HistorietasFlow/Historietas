import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-file-backup-key-utils.ts",
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
const javascript = typescript
  .transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { criarSlugBase, normalizarTexto } from "../../../lib/utils";',
    `const normalizarTexto = (texto) => texto
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\\s+/g, " ");
    const criarSlugBase = (titulo) => {
      const slug = normalizarTexto(titulo)
        .replace(/[^a-z0-9\\s-]/g, "")
        .replace(/\\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      return slug || "obra";
    };`,
  );
const { obterChavesBackupArquivoEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("chaves de backup de Editar Obra preservam formato, ordem e normalizacao", () => {
  assert.deepEqual(
    obterChavesBackupArquivoEdicaoObra({
      id: "obra-1",
      slug: "minha-obra",
      titulo: " Minha Obra ",
      link: "/obra/minha-obra",
    }),
    [
      "id:obra-1",
      "slug:minha-obra",
      "titulo:minha obra",
      "link:/obra/minha-obra",
    ],
  );
  assert.deepEqual(
    obterChavesBackupArquivoEdicaoObra({
      id: "obra-2",
      slug: "",
      titulo: "Historia Especial",
      link: "",
    }),
    ["id:obra-2", "slug:historia-especial", "titulo:historia especial"],
  );
});

test("chaves de backup de Editar Obra filtram valores vazios e preservam deduplicacao", () => {
  const chaves = obterChavesBackupArquivoEdicaoObra({
    id: "",
    slug: "",
    titulo: "",
    link: "",
  });

  assert.deepEqual(chaves, ["id:", "slug:obra", "titulo:"]);
  assert.equal(new Set(chaves).size, chaves.length);
});

test("Editar Obra delega somente as chaves de backup de arquivos ao modulo extraido", () => {
  assert.match(
    pageSource,
    /import \{ prepararAssetsAtuaisEdicaoObra \} from "\.\/lib\/editar-obra-current-assets-preparation";/,
  );
  assert.match(
    currentAssetsPreparationSource,
    /import \{ obterChavesBackupArquivoEdicaoObra \} from "\.\/editar-obra-file-backup-key-utils";/,
  );
  assert.doesNotMatch(pageSource, /function obterChavesBackupArquivoEdicaoObra\(/);
  assert.match(
    source,
    /import \{ criarSlugBase, normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(source, /`id:\$\{obra\.id\}`/);
  assert.match(source, /`slug:\$\{obra\.slug \|\| criarSlugBase\(obra\.titulo\)\}`/);
  assert.match(source, /`titulo:\$\{normalizarTexto\(obra\.titulo\)\}`/);
  assert.match(source, /obra\.link \? `link:\$\{obra\.link\}` : ""/);
  assert.match(source, /\.filter\(\(chave\) => Boolean\(chave\.trim\(\)\)\)/);
  assert.match(source, /new Set\(/);
  assert.match(source, /Array\.from\(/);
  assert.match(
    currentAssetsPreparationSource,
    /obterChavesBackupArquivoEdicaoObra\(obraLocalAtual\)/,
  );
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
