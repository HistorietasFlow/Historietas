import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-file-backup-key-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
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
    'import { criarSlugBase, normalizarTexto } from "../../../lib/utils";',
    [
      'const normalizarTexto = (texto) => String(texto)',
      '  .normalize("NFD")',
      '  .replace(/[\\u0300-\\u036f]/g, "")',
      '  .trim()',
      '  .toLowerCase()',
      '  .replace(/\\s+/g, " ");',
      'const criarSlugBase = (titulo) => normalizarTexto(titulo)',
      '  .replace(/[^a-z0-9\\s-]/g, "")',
      '  .replace(/\\s+/g, "-")',
      '  .replace(/-+/g, "-")',
      '  .replace(/^-+|-+$/g, "") || "obra";',
    ].join("\n"),
  );
const { obterChavesBackupArquivoPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("obterChavesBackupArquivoPainel preserva ordem, chaves e normalização", () => {
  assert.deepEqual(
    obterChavesBackupArquivoPainel({
      id: "obra-7",
      slug: "minha-obra",
      titulo: " Minha Obra ",
      link: " /obra/minha-obra ",
    }),
    [
      "id:obra-7",
      "obra-7",
      "slug:minha-obra",
      "titulo:minha obra",
      "link: /obra/minha-obra",
    ],
  );
});

test("obterChavesBackupArquivoPainel usa slug do título, remove vazios e deduplica", () => {
  assert.deepEqual(
    obterChavesBackupArquivoPainel({
      id: "",
      slug: "",
      titulo: " Coração & Ação ",
      link: "",
    }),
    ["slug:coracao-acao", "titulo:coracao & acao"],
  );
});

test("Painel do Autor delega somente as chaves de backup ao módulo extraído", () => {
  assert.match(
    pagina,
    /import \{ obterChavesBackupArquivoPainel \} from "\.\/lib\/painel-autor-file-backup-key-utils";/,
  );
  assert.doesNotMatch(pagina, /function obterChavesBackupArquivoPainel\(/);
  assert.equal(
    (pagina.match(/\bobterChavesBackupArquivoPainel\b/g) || []).length,
    4,
  );
  assert.match(
    utilsSource,
    /import \{ criarSlugBase, normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(utilsSource, /obra\.id \? `id:\$\{obra\.id\}` : ""/);
  assert.match(utilsSource, /`titulo:\$\{normalizarTexto\(obra\.titulo\)\}`/);
  assert.match(utilsSource, /\.map\(\(chave\) => chave\.trim\(\)\)/);
  assert.match(utilsSource, /\.filter\(Boolean\)/);
  assert.doesNotMatch(utilsSource, /localStorage|supabase|useState|useEffect/);
});
