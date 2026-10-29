import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-active-filter-count.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarContarFiltrosAvancadosAtivosExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      /import type \{[\s\S]*?\} from "\.\/explorar-derived-utils";\r?\n\r?\n/,
      "",
    )
    .replace(
      /export function contarFiltrosAvancadosAtivosExplorar\(\{([\s\S]*?)\}: \{[\s\S]*?\n\}\) \{/,
      "function contarFiltrosAvancadosAtivosExplorar({$1}) {",
    );

  return new Function(
    `${executable}\nreturn contarFiltrosAvancadosAtivosExplorar;`,
  )();
}

const filtrosPadrao = {
  usuarioLogado: false,
  filtroColecao: "todos",
  filtroFormato: "todos",
  filtroClassificacao: "todos",
  filtroCapitulos: "todos",
  ordenacao: "relevancia",
};

test("conta exatamente os cinco filtros avançados atuais", async () => {
  const contarFiltrosAvancadosAtivosExplorar =
    await carregarContarFiltrosAvancadosAtivosExplorar();

  assert.equal(contarFiltrosAvancadosAtivosExplorar(filtrosPadrao), 0);
  assert.equal(
    contarFiltrosAvancadosAtivosExplorar({
      ...filtrosPadrao,
      filtroFormato: "Romance",
    }),
    1,
  );
  assert.equal(
    contarFiltrosAvancadosAtivosExplorar({
      ...filtrosPadrao,
      filtroClassificacao: "18+",
      filtroCapitulos: "completas",
    }),
    2,
  );
  assert.equal(
    contarFiltrosAvancadosAtivosExplorar({
      ...filtrosPadrao,
      ordenacao: "recentes",
    }),
    1,
  );
  assert.equal(
    contarFiltrosAvancadosAtivosExplorar({
      ...filtrosPadrao,
      usuarioLogado: true,
      filtroColecao: "favoritas",
    }),
    1,
  );
  assert.equal(
    contarFiltrosAvancadosAtivosExplorar({
      ...filtrosPadrao,
      filtroColecao: "favoritas",
    }),
    0,
  );
  assert.equal(
    contarFiltrosAvancadosAtivosExplorar({
      usuarioLogado: true,
      filtroColecao: "favoritas",
      filtroFormato: "Original",
      filtroClassificacao: "18+",
      filtroCapitulos: "completas",
      ordenacao: "recentes",
    }),
    5,
  );
});

test("preserva as cinco expressões e mantém filtrosAtivos e tradução na página", async () => {
  const [source, pageRaw] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");

  for (const regra of [
    'usuarioLogado && filtroColecao !== "todos"',
    'filtroFormato !== "todos"',
    'filtroClassificacao !== "todos"',
    'filtroCapitulos !== "todos"',
    'ordenacao !== "relevancia"',
  ]) {
    assert.ok(source.includes(regra), `Regra ausente: ${regra}`);
  }
  assert.match(source, /\.filter\(Boolean\)\.length/);
  assert.match(
    page,
    /import \{ contarFiltrosAvancadosAtivosExplorar \} from "\.\/lib\/explorar-active-filter-count";/,
  );
  assert.match(
    page,
    /const totalFiltrosAvancadosAtivos = contarFiltrosAvancadosAtivosExplorar\(\{[\s\S]*?ordenacao,\n  \}\);/,
  );
  assert.match(page, /const filtrosAtivos = Boolean\([\s\S]*?categoriaSelecionada \|\|[\s\S]*?termoBusca/);
  assert.match(
    page,
    /const textoBotaoFiltrosAvancados = traduzirTextoExplorar\([\s\S]*?`Explorar \(\$\{totalFiltrosAvancadosAtivos\}\)`/,
  );
});
