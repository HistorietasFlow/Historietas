import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-adult-filter-state.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarFiltroConteudo18EstaAtivoExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      "export function filtroConteudo18EstaAtivoExplorar",
      "function filtroConteudo18EstaAtivoExplorar",
    )
    .replace(/: string/g, "");

  return new Function(
    `${executable}\nreturn filtroConteudo18EstaAtivoExplorar;`,
  )();
}

test("reconhece somente a classificação exatamente igual a 18+", async () => {
  const filtroConteudo18EstaAtivoExplorar =
    await carregarFiltroConteudo18EstaAtivoExplorar();

  assert.equal(filtroConteudo18EstaAtivoExplorar("18+"), true);
  for (const classificacao of ["todos", "16+", "18", " 18+", "18+ "]) {
    assert.equal(filtroConteudo18EstaAtivoExplorar(classificacao), false);
  }
});

test("mantém a condição pura e deixa controles de idade na página", async () => {
  const [source, pageRaw] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");

  assert.match(source, /filtroClassificacao === "18\+"/);
  assert.doesNotMatch(source, /includes|trim|toLowerCase|ACESSO_CONTEUDO_18/i);
  assert.match(
    page,
    /import \{ filtroConteudo18EstaAtivoExplorar \} from "\.\/lib\/explorar-adult-filter-state";/,
  );
  assert.match(
    page,
    /const filtroConteudo18Ativo =\n    filtroConteudo18EstaAtivoExplorar\(\n      filtroClassificacao,\n    \);/,
  );
  assert.match(page, /ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO/);
  assert.match(page, /confirmarFiltroConteudo18Explorar/);
});
