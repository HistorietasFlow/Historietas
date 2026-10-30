import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const libraryViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-library-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-library-totals.ts", import.meta.url),
  "utf8",
);

globalThis.__profileLibraryTotalsDependencies = {
  colecaoTemObraPerfilBiblioteca(colecao, obra) {
    return colecao.includes(obra.id) || colecao.includes(obra.slug);
  },
};

const javascript = typescript.transpileModule(
  source.replace(
    'import { colecaoTemObraPerfilBiblioteca } from "./library-normalizers";',
    "const { colecaoTemObraPerfilBiblioteca } = globalThis.__profileLibraryTotalsDependencies;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const { obterTotaisBibliotecaPerfilAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

const obras = [
  { id: "a", slug: "obra-a" },
  { id: "b", slug: "obra-b" },
  { id: "c", slug: "obra-c" },
];

test("seguidas usa o maior total entre obras carregadas e Quero ler", () => {
  const resultado = obterTotaisBibliotecaPerfilAutor({
    obras,
    obrasSeguidasBiblioteca: ["a", "b"],
    obrasConcluidas: [],
    itensBibliotecaQueroLerTotal: 5,
    itensBibliotecaConcluidasTotal: 0,
    obrasConcluidasPerfilPorObrasDoAutor: 0,
  });

  assert.equal(resultado.obrasSeguidasPerfilTotal, 5);
});

test("seguidas preserva contagem das obras carregadas quando ela é maior", () => {
  const resultado = obterTotaisBibliotecaPerfilAutor({
    obras,
    obrasSeguidasBiblioteca: ["a", "obra-b"],
    obrasConcluidas: [],
    itensBibliotecaQueroLerTotal: 1,
    itensBibliotecaConcluidasTotal: 0,
    obrasConcluidasPerfilPorObrasDoAutor: 0,
  });

  assert.equal(resultado.obrasSeguidasPerfilTotal, 2);
});

test("concluídas usa o maior total entre remoto, obras carregadas e Biblioteca", () => {
  const resultado = obterTotaisBibliotecaPerfilAutor({
    obras,
    obrasSeguidasBiblioteca: [],
    obrasConcluidas: ["a", "b"],
    itensBibliotecaQueroLerTotal: 0,
    itensBibliotecaConcluidasTotal: 4,
    obrasConcluidasPerfilPorObrasDoAutor: 7,
  });

  assert.equal(resultado.obrasConcluidasPerfilTotal, 7);
});

test("concluídas preserva fallback local quando remoto é menor", () => {
  const resultado = obterTotaisBibliotecaPerfilAutor({
    obras,
    obrasSeguidasBiblioteca: [],
    obrasConcluidas: ["a", "obra-b", "c"],
    itensBibliotecaQueroLerTotal: 0,
    itensBibliotecaConcluidasTotal: 2,
    obrasConcluidasPerfilPorObrasDoAutor: 1,
  });

  assert.equal(resultado.obrasConcluidasPerfilTotal, 3);
});

test("listas vazias retornam totais zero", () => {
  assert.deepEqual(
    obterTotaisBibliotecaPerfilAutor({
      obras: [],
      obrasSeguidasBiblioteca: [],
      obrasConcluidas: [],
      itensBibliotecaQueroLerTotal: 0,
      itensBibliotecaConcluidasTotal: 0,
      obrasConcluidasPerfilPorObrasDoAutor: 0,
    }),
    {
      obrasSeguidasPerfilTotal: 0,
      obrasConcluidasPerfilTotal: 0,
    },
  );
});


test("página deriva os totais de itens da Biblioteca antes do helper", () => {
  assert.match(
    libraryViewStateSource,
    /const itensBibliotecaQueroLerTotal = itensBibliotecaQueroLer\.length;/,
  );
  assert.match(
    libraryViewStateSource,
    /const itensBibliotecaConcluidasTotal = itensBibliotecaConcluidas\.length;/,
  );
  assert.match(
    libraryViewStateSource,
    /obterTotaisBibliotecaPerfilAutor\(\{[\s\S]*?itensBibliotecaQueroLerTotal,[\s\S]*?itensBibliotecaConcluidasTotal,/,
  );
  assert.doesNotMatch(
    libraryViewStateSource,
    /itensBibliotecaQueroLerTotal: itensBibliotecaQueroLer\.length/,
  );
  assert.doesNotMatch(
    libraryViewStateSource,
    /itensBibliotecaConcluidasTotal: itensBibliotecaConcluidas\.length/,
  );
});
