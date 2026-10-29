import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-author-ids.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarObterAutorIdsExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      /import \{[\s\S]*?\} from "\.\/explorar-work-normalizers";\r?\n\r?\n/,
      "",
    )
    .replace("export function obterAutorIdsExplorar(obrasLocais: ObraLocal[])", "function obterAutorIdsExplorar(obrasLocais)");

  return new Function(
    "obraTemConteudoPublicadoExplorar",
    `${executable}\nreturn obterAutorIdsExplorar;`,
  )((obra) => Boolean(obra.temConteudoPublicado));
}

test("deriva IDs publicados com conteúdo, sem vazios ou duplicados, preservando a ordem", async () => {
  const obterAutorIdsExplorar = await carregarObterAutorIdsExplorar();
  const ids = obterAutorIdsExplorar([
    { publicado: false, temConteudoPublicado: true, autorId: "nao-publicado" },
    { publicado: true, temConteudoPublicado: false, autorId: "sem-conteudo" },
    { publicado: true, temConteudoPublicado: true, autorId: " autor-1 " },
    { publicado: true, temConteudoPublicado: true, autorId: "" },
    { publicado: true, temConteudoPublicado: true, autorId: "autor-2" },
    { publicado: true, temConteudoPublicado: true, autorId: "autor-1" },
  ]);

  assert.deepEqual(ids, ["autor-1", "autor-2"]);
});

test("o helper e o effect preservam os contratos de derivação e lifecycle", async () => {
  const [source, pageRaw] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");

  assert.match(source, /obra\.publicado && obraTemConteudoPublicadoExplorar\(obra\)/);
  assert.match(source, /obra\.autorId\?\.trim\(\) \|\| ""/);
  assert.match(source, /\.filter\(Boolean\)/);
  assert.match(source, /new Set\(/);
  assert.match(source, /return Array\.from\(/);
  assert.match(page, /import \{ obterAutorIdsExplorar \} from "\.\/lib\/explorar-author-ids";/);
  assert.match(page, /const autorIds = obterAutorIdsExplorar\(obrasLocais\);/);
  assert.match(page, /let cancelado = false;/);
  assert.match(page, /async function carregarDadosAutores\(\)/);
  assert.match(page, /if \(autorIds\.length === 0\)/);
  assert.match(page, /await Promise\.resolve\(\);/);
  assert.match(page, /Promise\.all\(/);
  assert.match(page, /cancelado = true;/);
});
