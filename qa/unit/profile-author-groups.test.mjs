import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-author-groups.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const targetViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-target-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

globalThis.__profileAuthorGroupsDependencies = {
  criarChaveAutorPerfil(autorId, nome) {
    return autorId.trim().toLowerCase() || nome.trim().replace(/\s+/g, " ").toLowerCase();
  },
  obterTotalCurtidasObraPerfilAutor(obra) {
    return obra.__curtidas || 0;
  },
  obterTotalComentariosObraPerfilAutor(obra) {
    return obra.__comentarios || 0;
  },
};

const javascript = typescript.transpileModule(
  source
    .replace(
      /import \{[\s\S]*?obterTotalComentariosObraPerfilAutor,[\s\S]*?obterTotalCurtidasObraPerfilAutor,[\s\S]*?\} from "\.\/data-normalizers";/,
      [
        "const {",
        "  obterTotalComentariosObraPerfilAutor,",
        "  obterTotalCurtidasObraPerfilAutor,",
        "} = globalThis.__profileAuthorGroupsDependencies;",
      ].join("\n"),
    )
    .replace(
      'import { criarChaveAutorPerfil } from "./profile-formatters";',
      "const { criarChaveAutorPerfil } = globalThis.__profileAuthorGroupsDependencies;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const { montarPerfisAutoresPorObras } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function obra({
  id,
  autorId,
  autor,
  publicado = true,
  capitulos = [],
  curtidas = 0,
  comentarios = 0,
}) {
  return {
    id,
    autorId,
    autor,
    publicado,
    capitulos,
    __curtidas: curtidas,
    __comentarios: comentarios,
  };
}

const totaisVazios = {
  curtidasPorObra: {},
  comentariosPorObra: {},
  curtidasPorCapitulo: {},
  comentariosPorCapitulo: {},
  salvosPorObra: {},
  salvosPorCapitulo: {},
  concluidasPorObra: {},
};

test("agrupa obras do mesmo autor por ID e soma métricas", () => {
  const resultado = montarPerfisAutoresPorObras(
    [
      obra({
        id: "obra-1",
        autorId: " USER-1 ",
        autor: "Ana",
        publicado: true,
        capitulos: [{ id: "c1" }, { id: "c2" }],
        curtidas: 4,
        comentarios: 2,
      }),
      obra({
        id: "obra-2",
        autorId: "user-1",
        autor: "Ana",
        publicado: false,
        capitulos: [{ id: "c3" }],
        curtidas: 3,
        comentarios: 5,
      }),
    ],
    totaisVazios,
  );

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].autorId, "USER-1");
  assert.equal(resultado[0].nome, "Ana");
  assert.deepEqual(resultado[0].obras.map((item) => item.id), ["obra-1", "obra-2"]);
  assert.equal(resultado[0].totalCapitulos, 3);
  assert.equal(resultado[0].totalPublicadas, 1);
  assert.equal(resultado[0].totalCurtidas, 7);
  assert.equal(resultado[0].totalComentarios, 7);
});

test("usa nome normalizado quando não há ID e preserva fallback de autor", () => {
  const resultado = montarPerfisAutoresPorObras(
    [
      obra({
        id: "obra-a",
        autorId: "",
        autor: "  Bia   Silva  ",
        capitulos: [],
      }),
      obra({
        id: "obra-b",
        autorId: "",
        autor: "Bia Silva",
        capitulos: [],
      }),
      obra({
        id: "obra-c",
        autorId: "",
        autor: "   ",
        capitulos: [],
      }),
    ],
    totaisVazios,
  );

  assert.equal(resultado.length, 2);
  assert.deepEqual(resultado.map((perfil) => perfil.nome), [
    "Autor não informado",
    "Bia   Silva",
  ]);
  assert.equal(resultado[1].obras.length, 2);
});

test("ordena perfis alfabeticamente", () => {
  const resultado = montarPerfisAutoresPorObras(
    [
      obra({ id: "z", autorId: "z", autor: "Zoe" }),
      obra({ id: "a", autorId: "a", autor: "Ana" }),
      obra({ id: "m", autorId: "m", autor: "Maria" }),
    ],
    totaisVazios,
  );

  assert.deepEqual(resultado.map((perfil) => perfil.nome), [
    "Ana",
    "Maria",
    "Zoe",
  ]);
});

test("lista vazia retorna nenhum perfil", () => {
  assert.deepEqual(montarPerfisAutoresPorObras([], totaisVazios), []);
});


test("helper monta perfis de autores sem useMemo", () => {
  assert.match(
    targetViewStateSource,
    /const perfisAutores = montarPerfisAutoresPorObras\(/,
  );
  assert.doesNotMatch(
    targetViewStateSource,
    /const perfisAutores = useMemo/,
  );
  assert.match(pagina, /obterEstadoAlvoPerfilAutor\(/);
});
