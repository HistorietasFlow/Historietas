import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-result-count.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarCalcularTotalResultadosExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      'import type { ModoConteudoExplorar } from "../components/explorar-section-components";\n\n',
      "",
    )
    .replace("export function calcularTotalResultadosExplorar", "function calcularTotalResultadosExplorar")
    .replace(/: ModoConteudoExplorar|: number/g, "");

  return new Function(
    `${executable}\nreturn calcularTotalResultadosExplorar;`,
  )();
}

test("calcula o total do modo autores e dos demais modos", async () => {
  const calcularTotalResultadosExplorar =
    await carregarCalcularTotalResultadosExplorar();

  assert.equal(calcularTotalResultadosExplorar("autores", 7, 12), 7);
  assert.equal(calcularTotalResultadosExplorar("obras", 7, 12), 12);
});

test("a página preserva os lengths no call site", async () => {
  const [source, pageRaw] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");

  assert.match(
    source,
    /import type \{ ModoConteudoExplorar \} from "\.\.\/components\/explorar-section-components";/,
  );
  assert.match(source, /modoConteudo === "autores" \? totalAutores : totalObras/);
  assert.match(page, /import \{ calcularTotalResultadosExplorar \} from "\.\/lib\/explorar-result-count";/);
  assert.match(
    page,
    /const totalResultados =\n    calcularTotalResultadosExplorar\(\n      modoConteudo,\n      autoresFiltrados\.length,\n      obrasLocaisFiltradas\.length,\n    \);/,
  );
  assert.doesNotMatch(page, /modoConteudo === "autores"\n      \? autoresFiltrados\.length/);
});
