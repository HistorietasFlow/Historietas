import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-categories.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

const categoriasEsperadas = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Ficção",
  "Mistério",
  "Romance",
  "Suspense",
  "Terror",
  "Sobrenatural",
  "Histórico",
  "Biografia",
];

test("o catálogo de categorias preserva os treze itens, ordem e usos da página", async () => {
  const [source, pageRaw] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");
  const categorias = new Function(
    `${source.replace("export const categorias", "const categorias")}\nreturn categorias;`,
  )();

  assert.match(source, /export const categorias = \[/);
  assert.equal(categorias.length, 13);
  assert.deepEqual(categorias, categoriasEsperadas);
  assert.match(page, /import \{ categorias \} from "\.\/lib\/explorar-categories";/);
  assert.doesNotMatch(page, /const categorias = \[/);
  assert.match(page, /categorias,\n      /);
  assert.match(page, /categorias\.map\(\(categoria\) =>/);
});
