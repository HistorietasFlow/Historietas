import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-active-filters.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarPossuiFiltrosAtivosExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      /import type \{[\s\S]*?\} from "\.\/explorar-derived-utils";\r?\n\r?\n/,
      "",
    )
    .replace(
      /export function possuiFiltrosAtivosExplorar\(\{([\s\S]*?)\}: \{[\s\S]*?\n\}\) \{/,
      "function possuiFiltrosAtivosExplorar({$1}) {",
    );

  return new Function(
    `${executable}\nreturn possuiFiltrosAtivosExplorar;`,
  )();
}

const filtrosPadrao = {
  categoriaSelecionada: "",
  termoBusca: "",
  filtroFormato: "todos",
  filtroClassificacao: "todos",
  filtroCapitulos: "todos",
  usuarioLogado: false,
  filtroColecao: "todos",
  ordenacao: "relevancia",
};

test("identifica exatamente os sete critérios de filtros ativos", async () => {
  const possuiFiltrosAtivosExplorar =
    await carregarPossuiFiltrosAtivosExplorar();

  assert.equal(possuiFiltrosAtivosExplorar(filtrosPadrao), false);

  for (const filtros of [
    { categoriaSelecionada: "Romance" },
    { termoBusca: "história" },
    { filtroFormato: "Romance" },
    { filtroClassificacao: "16+" },
    { filtroCapitulos: "completas" },
    { usuarioLogado: true, filtroColecao: "favoritas" },
    { ordenacao: "recentes" },
  ]) {
    assert.equal(
      possuiFiltrosAtivosExplorar({ ...filtrosPadrao, ...filtros }),
      true,
    );
  }

  assert.equal(
    possuiFiltrosAtivosExplorar({
      ...filtrosPadrao,
      filtroColecao: "favoritas",
    }),
    false,
  );
});

test("mantém Boolean e as sete regras no helper, sem derivação inline na página", async () => {
  const [source, pageRaw] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");

  for (const regra of [
    "categoriaSelecionada",
    "termoBusca",
    'filtroFormato !== "todos"',
    'filtroClassificacao !== "todos"',
    'filtroCapitulos !== "todos"',
    'usuarioLogado && filtroColecao !== "todos"',
    'ordenacao !== "relevancia"',
  ]) {
    assert.ok(source.includes(regra), `Regra ausente: ${regra}`);
  }

  assert.match(source, /return Boolean\(/);
  assert.match(
    page,
    /import \{ possuiFiltrosAtivosExplorar \} from "\.\/lib\/explorar-active-filters";/,
  );
  assert.match(
    page,
    /const filtrosAtivos =\n    possuiFiltrosAtivosExplorar\(\{[\s\S]*?ordenacao,\n    \}\);/,
  );
  assert.doesNotMatch(page, /const filtrosAtivos = Boolean\(/);
});
