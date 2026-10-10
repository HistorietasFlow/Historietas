import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-user-collections-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url), "utf8");
let indiceModulo = 0;

function criarConsulta(resposta, chamadas, tabela) {
  const chamada = {
    tabela,
    select: "",
    eq: [],
    order: [],
    limit: null,
    range: null,
  };
  chamadas.push(chamada);

  const consulta = {
    select(valor) {
      chamada.select = valor;
      return consulta;
    },
    eq(campo, valor) {
      chamada.eq.push([campo, valor]);
      return consulta;
    },
    order(campo, opcoes) {
      chamada.order.push([campo, opcoes]);
      return consulta;
    },
    limit(valor) {
      chamada.limit = valor;
      return consulta;
    },
    range(inicio, fim) {
      chamada.range = [inicio, fim];
      return Promise.resolve(resposta);
    },
    then(resolve, reject) {
      return Promise.resolve(resposta).then(resolve, reject);
    },
  };

  return consulta;
}

async function carregarModulo(configurar) {
  const dependencias = {
    chamadas: [],
    supabase: {
      from: () => {
        throw new Error("Consulta Supabase não configurada.");
      },
    },
    carregarTodasPaginasSupabase: async () => [],
    pegarTexto: (valor) => (typeof valor === "string" ? valor.trim() : ""),
    normalizarNomeAutor: (valor) => valor.trim().toLocaleLowerCase(),
    campos: {
      seguindo_obras: "obra_id,visibilidade,criado_em",
      favoritos: "obra_id,visibilidade,criado_em",
      concluidas: "obra_id,visibilidade,criado_em",
      obra_avaliacoes: "obra_id,nota,criado_em,atualizado_em",
      progresso_leitura:
        "obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
      diario_atividades:
        "id,tipo,texto,nota,obra_id,capitulo_id,metadata,visibilidade,criado_em",
    },
  };

  configurar(dependencias);
  globalThis.__profileUserCollectionsDependencies = dependencias;

  const javascript = typescript.transpileModule(
    loaderSource
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileUserCollectionsDependencies.supabase;",
      )
      .replace(
        'import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";',
        `const carregarTodasPaginasSupabase = (...args) =>
  globalThis.__profileUserCollectionsDependencies.carregarTodasPaginasSupabase(...args);`,
      )
      .replace(
        'import { CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR } from "../constants";',
        "const CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR = globalThis.__profileUserCollectionsDependencies.campos;",
      )
      .replace(/import type \{[\s\S]*?\} from "\.\.\/types";\n/, "")
      .replace(
        'import { pegarTexto } from "./data-normalizers";',
        "const pegarTexto = globalThis.__profileUserCollectionsDependencies.pegarTexto;",
      )
      .replace(
        'import { normalizarNomeAutor } from "./profile-formatters";',
        "const normalizarNomeAutor = globalThis.__profileUserCollectionsDependencies.normalizarNomeAutor;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, dependencias };
}

test("pagina e deduplica IDs de obras preservando filtro, ordenação e usuário", async () => {
  const { carregarIdsObrasTabelaUsuario, dependencias } = await carregarModulo(
    (dependencias) => {
      dependencias.supabase = {
        from: (tabela) =>
          criarConsulta(
            {
              data: [
                { obra_id: " obra-1 " },
                { obra_id: "obra-2" },
                { obra_id: "obra-1" },
                { obra_id: " " },
              ],
              error: null,
            },
            dependencias.chamadas,
            tabela,
          ),
      };
      dependencias.carregarTodasPaginasSupabase = async (opcoes) => {
        assert.equal(opcoes.nomeColecao, "favoritos do perfil do autor");
        const resposta = await opcoes.buscarPagina(20, 39);
        return resposta.data;
      };
    },
  );

  assert.deepEqual(
    await carregarIdsObrasTabelaUsuario("favoritos", "usuario-1"),
    ["obra-1", "obra-2"],
  );
  assert.deepEqual(dependencias.chamadas, [
    {
      tabela: "favoritos",
      select: "obra_id",
      eq: [["user_id", "usuario-1"]],
      order: [["obra_id", { ascending: true }]],
      limit: null,
      range: [20, 39],
    },
  ]);
});

test("normaliza autores seguidos, ignora dados inválidos e isola o usuário", async () => {
  const { carregarAutoresSeguidosSupabase, dependencias } = await carregarModulo(
    (dependencias) => {
      dependencias.supabase = {
        from: (tabela) =>
          criarConsulta(
            {
              data: [
                { autor_nome: "  Ana  " },
                { autor_nome: "" },
                null,
                ["inválido"],
                { autor_nome: "Beto" },
              ],
              error: null,
            },
            dependencias.chamadas,
            tabela,
          ),
      };
    },
  );

  assert.deepEqual(await carregarAutoresSeguidosSupabase("usuario-2"), [
    "ana",
    "beto",
  ]);
  assert.deepEqual(dependencias.chamadas, [
    {
      tabela: "seguindo_autores",
      select: "autor_nome",
      eq: [["user_id", "usuario-2"]],
      order: [],
      limit: 1000,
      range: null,
    },
  ]);
});

test("carrega somente registros válidos do Diário para o usuário informado", async () => {
  const { carregarRegistrosDiarioPerfil, dependencias } = await carregarModulo(
    (dependencias) => {
      dependencias.supabase = {
        from: (tabela) =>
          criarConsulta(
            {
              data: [
                { obra_id: "obra-1", visibilidade: "publico" },
                null,
                ["inválido"],
                { obra_id: "obra-2", visibilidade: "privado" },
              ],
              error: null,
            },
            dependencias.chamadas,
            tabela,
          ),
      };
    },
  );

  assert.deepEqual(
    await carregarRegistrosDiarioPerfil("favoritos", "usuario-3"),
    [
      { obra_id: "obra-1", visibilidade: "publico" },
      { obra_id: "obra-2", visibilidade: "privado" },
    ],
  );
  assert.deepEqual(dependencias.chamadas, [
    {
      tabela: "favoritos",
      select: "obra_id,visibilidade,criado_em",
      eq: [["user_id", "usuario-3"]],
      order: [],
      limit: 1000,
      range: null,
    },
  ]);
});

test("preserva fallbacks de falhas de paginação e de consultas", async () => {
  const moduloPaginacao = await carregarModulo((dependencias) => {
    dependencias.carregarTodasPaginasSupabase = async () => {
      throw new Error("paginação indisponível");
    };
  });
  assert.deepEqual(
    await moduloPaginacao.carregarIdsObrasTabelaUsuario(
      "concluidas",
      "usuario-4",
    ),
    [],
  );

  const moduloAutores = await carregarModulo((dependencias) => {
    dependencias.supabase = {
      from: (tabela) =>
        criarConsulta(
          { data: null, error: new Error("consulta indisponível") },
          dependencias.chamadas,
          tabela,
        ),
    };
  });
  assert.deepEqual(
    await moduloAutores.carregarAutoresSeguidosSupabase("usuario-4"),
    [],
  );

  const moduloDiario = await carregarModulo((dependencias) => {
    dependencias.supabase = {
      from: (tabela) =>
        criarConsulta(
          { data: null, error: new Error("consulta indisponível") },
          dependencias.chamadas,
          tabela,
        ),
    };
  });
  const warnOriginal = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(
      await moduloDiario.carregarRegistrosDiarioPerfil(
        "diario_atividades",
        "usuario-4",
      ),
      [],
    );
  } finally {
    console.warn = warnOriginal;
  }
});

test("Perfil de Autor mantém somente o carregador de registros do Diário como dependência direta", () => {
  assert.match(
    pagina,
    /import \{ carregarRegistrosDiarioPerfil \} from "\.\/lib\/profile-user-collections-loader";/,
  );

  for (const helper of [
    "carregarIdsObrasTabelaUsuario",
    "carregarAutoresSeguidosSupabase",
    "carregarRegistrosDiarioPerfil",
  ]) {
    assert.match(loaderSource, new RegExp(`export async function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`async function ${helper}\\(`));
  }

  assert.doesNotMatch(
    pagina,
    /carregarIdsObrasTabelaUsuario\("favoritos", userId\)/,
  );
  assert.doesNotMatch(pagina, /carregarAutoresSeguidosSupabase\(userId\)/);
  assert.match(
    pagina,
    /carregarRegistrosDiarioPerfil\("diario_atividades", userId\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarEstadoUsuarioSupabase/);
  assert.doesNotMatch(loaderSource, /useState|useEffect|localStorage/);
});
