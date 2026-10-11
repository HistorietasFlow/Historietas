import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-library-items-builder.ts", import.meta.url),
  "utf8",
);

let moduloIndice = 0;

function carregarModulo() {
  const chamadas = [];
  globalThis.__profileLibraryItemsBuilderDependencies = {
    converterItensDiarioParaBiblioteca(itens, prefixo) {
      chamadas.push(["diario", prefixo, itens.map((item) => item.chave)]);
      return itens.map((item) => ({ chave: `${prefixo}-${item.chave}` }));
    },
    converterCapitulosSalvosParaBiblioteca(obras) {
      chamadas.push(["salvos", obras.map((obra) => obra.id)]);
      return obras.map((obra) => ({ chave: `salvo-${obra.id}` }));
    },
  };

  const javascript = typescript.transpileModule(
    source.replace(
      /import \{[\s\S]*?\} from "\.\/library-normalizers";/,
      [
        "const {",
        "  converterCapitulosSalvosParaBiblioteca,",
        "  converterItensDiarioParaBiblioteca,",
        "} = globalThis.__profileLibraryItemsBuilderDependencies;",
      ].join("\n"),
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  moduloIndice += 1;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${moduloIndice}`
  ).then((modulo) => ({ ...modulo, chamadas }));
}

function item(chave, tipo) {
  return { chave, tipo };
}

test("Biblioteca oculta retorna todas as listas vazias sem converter dados", async () => {
  const modulo = await carregarModulo();
  const resultado = modulo.montarItensBibliotecaPerfilAutor({
    bibliotecaPerfilVisivel: false,
    queroLer: [item("q", "quero_ler")],
    lendoAgora: [item("l", "lendo")],
    favoritas: [item("f", "favorita")],
    concluidas: [item("c", "concluida")],
    atividades: [item("a", "lendo")],
    obras: [{ id: "obra-1" }],
  });

  assert.deepEqual(resultado, {
    queroLer: [],
    lendoAgora: [],
    favoritas: [],
    concluidas: [],
    historico: [],
    salvos: [],
  });
  assert.deepEqual(modulo.chamadas, []);
});

test("Biblioteca visível preserva prefixos e fontes das quatro coleções principais", async () => {
  const modulo = await carregarModulo();
  const resultado = modulo.montarItensBibliotecaPerfilAutor({
    bibliotecaPerfilVisivel: true,
    queroLer: [item("q", "quero_ler")],
    lendoAgora: [item("l", "lendo")],
    favoritas: [item("f", "favorita")],
    concluidas: [item("c", "concluida")],
    atividades: [],
    obras: [],
  });

  assert.deepEqual(resultado.queroLer, [{ chave: "quero-ler-q" }]);
  assert.deepEqual(resultado.lendoAgora, [{ chave: "lendo-agora-l" }]);
  assert.deepEqual(resultado.favoritas, [{ chave: "favorita-f" }]);
  assert.deepEqual(resultado.concluidas, [{ chave: "concluida-c" }]);
  assert.deepEqual(
    modulo.chamadas.filter((chamada) => chamada[0] === "diario").slice(0, 4),
    [
      ["diario", "quero-ler", ["q"]],
      ["diario", "lendo-agora", ["l"]],
      ["diario", "favorita", ["f"]],
      ["diario", "concluida", ["c"]],
    ],
  );
});

test("Histórico usa somente atividades de leitura e salvos usam as obras carregadas", async () => {
  const modulo = await carregarModulo();
  const resultado = modulo.montarItensBibliotecaPerfilAutor({
    bibliotecaPerfilVisivel: true,
    queroLer: [],
    lendoAgora: [],
    favoritas: [],
    concluidas: [],
    atividades: [
      item("lendo-1", "lendo"),
      item("review-1", "review"),
      item("lendo-2", "lendo"),
    ],
    obras: [{ id: "obra-1" }, { id: "obra-2" }],
  });

  assert.deepEqual(resultado.historico, [
    { chave: "historico-lendo-1" },
    { chave: "historico-lendo-2" },
  ]);
  assert.deepEqual(resultado.salvos, [
    { chave: "salvo-obra-1" },
    { chave: "salvo-obra-2" },
  ]);
  assert.deepEqual(modulo.chamadas.at(-2), [
    "diario",
    "historico",
    ["lendo-1", "lendo-2"],
  ]);
  assert.deepEqual(modulo.chamadas.at(-1), [
    "salvos",
    ["obra-1", "obra-2"],
  ]);
});
