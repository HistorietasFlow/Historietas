import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-published-works-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

function criarNormalizadores() {
  return {
    normalizarObraSupabase: (obra, index) => ({
      id: obra.id || `obra-${index + 1}`,
      titulo: obra.titulo || `Obra ${index + 1}`,
      capitulos: [],
      progressoLeitura: 0,
    }),
    normalizarCapituloSupabase: (capitulo, index, obraIndex) => ({
      id: capitulo.id || `capitulo-${obraIndex + 1}-${index + 1}`,
      titulo: capitulo.titulo || `Capítulo ${index + 1}`,
      obraId: capitulo.obra_id || "",
      lido: false,
    }),
    calcularProgressoLeitura: (capitulos) =>
      capitulos.length === 0
        ? 0
        : Math.round(
            (capitulos.filter((capitulo) => capitulo.lido).length / capitulos.length) * 100,
          ),
  };
}

function criarConsulta(resposta, chamadas, tabela) {
  const chamada = { tabela, select: "", eq: [], in: [], order: [], limit: null, range: null };
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
    in(campo, valores) {
      chamada.in.push([campo, valores]);
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
  const chamadas = [];
  const normalizadores = criarNormalizadores();
  const dependencias = {
    ...normalizadores,
    chamadas,
    supabase: {
      from: () => {
        throw new Error("Consulta Supabase não configurada.");
      },
    },
    carregarTodasPaginasSupabase: async () => [],
    carregarTodasPaginasPorLotesSupabase: async () => [],
  };

  configurar(dependencias);
  globalThis.__profilePublishedWorksDependencies = dependencias;

  const javascript = typescript.transpileModule(
    loaderSource
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profilePublishedWorksDependencies.supabase;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/paginacao\.mjs";\n/,
        `const carregarTodasPaginasSupabase = (...args) =>
  globalThis.__profilePublishedWorksDependencies.carregarTodasPaginasSupabase(...args);
const carregarTodasPaginasPorLotesSupabase = (...args) =>
  globalThis.__profilePublishedWorksDependencies.carregarTodasPaginasPorLotesSupabase(...args);\n`,
      )
      .replace(/import type \{[\s\S]*?\} from "\.\.\/types";\n/, "")
      .replace(
        /import \{[\s\S]*?\} from "\.\/data-normalizers";\n/,
        `const normalizarObraSupabase = (...args) =>
  globalThis.__profilePublishedWorksDependencies.normalizarObraSupabase(...args);
const normalizarCapituloSupabase = (...args) =>
  globalThis.__profilePublishedWorksDependencies.normalizarCapituloSupabase(...args);\n`,
      )
      .replace(
        'import { calcularProgressoLeitura } from "./work-normalizers";',
        `const calcularProgressoLeitura = (...args) =>
  globalThis.__profilePublishedWorksDependencies.calcularProgressoLeitura(...args);`,
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

test("carrega obras publicadas paginadas, capítulos em lotes e preserva a ordenação", async () => {
  const { carregarObrasPublicadasSupabase, dependencias } = await carregarModulo(
    (dependencias) => {
      dependencias.supabase = {
        from: (tabela) =>
          criarConsulta(
            tabela === "obras"
              ? {
                  data: [
                    { id: "obra-2", titulo: "Obra 2" },
                    { id: "obra-1", titulo: "Obra 1" },
                  ],
                  error: null,
                }
              : { data: [], error: null },
            dependencias.chamadas,
            tabela,
          ),
      };
      dependencias.carregarTodasPaginasSupabase = async (opcoes) => {
        assert.equal(opcoes.nomeColecao, "obras publicadas do perfil do autor");
        const resposta = await opcoes.buscarPagina(10, 19);
        return resposta.data;
      };
      dependencias.carregarTodasPaginasPorLotesSupabase = async (opcoes) => {
        assert.equal(opcoes.nomeColecao, "capítulos publicados do perfil do autor");
        assert.deepEqual(opcoes.itens, ["obra-2", "obra-1"]);
        await opcoes.buscarPaginaLote(opcoes.itens, 20, 29);
        return [
          { id: "capitulo-2", obra_id: "obra-2", titulo: "Capítulo 2" },
          { id: "capitulo-1", obra_id: "obra-1", titulo: "Capítulo 1" },
          { id: "sem-obra", obra_id: "", titulo: "Ignorado" },
        ];
      };
    },
  );

  const obras = await carregarObrasPublicadasSupabase();

  assert.deepEqual(obras.map((obra) => obra.id), ["obra-2", "obra-1"]);
  assert.deepEqual(obras.map((obra) => obra.capitulos.map((capitulo) => capitulo.id)), [
    ["capitulo-2"],
    ["capitulo-1"],
  ]);
  assert.deepEqual(obras.map((obra) => obra.progressoLeitura), [0, 0]);
  assert.deepEqual(dependencias.chamadas[0], {
    tabela: "obras",
    select:
      "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,criada_em,atualizado_em",
    eq: [["publicado", true]],
    in: [],
    order: [
      ["criada_em", { ascending: false }],
      ["id", { ascending: false }],
    ],
    limit: null,
    range: [10, 19],
  });
  assert.deepEqual(dependencias.chamadas[1], {
    tabela: "capitulos",
    select: "id,obra_id,titulo,ordem,publicado,criado_em,atualizado_em",
    eq: [["publicado", true]],
    in: [["obra_id", ["obra-2", "obra-1"]]],
    order: [
      ["obra_id", { ascending: true }],
      ["ordem", { ascending: true }],
      ["id", { ascending: true }],
    ],
    limit: null,
    range: [20, 29],
  });
});

test("deduplica IDs, preserva obras por IDs e agrupa seus capítulos", async () => {
  const { carregarObrasPublicadasPorIdsSupabase, dependencias } = await carregarModulo(
    (dependencias) => {
      dependencias.supabase = {
        from: (tabela) =>
          criarConsulta(
            tabela === "obras"
              ? {
                  data: [
                    { id: "obra-2", titulo: "Obra 2" },
                    { id: "obra-1", titulo: "Obra 1" },
                  ],
                  error: null,
                }
              : {
                  data: [
                    { id: "capitulo-2a", obra_id: "obra-2", titulo: "Dois A" },
                    { id: "capitulo-2b", obra_id: "obra-2", titulo: "Dois B" },
                    { id: "capitulo-1", obra_id: "obra-1", titulo: "Um" },
                  ],
                  error: null,
                },
            dependencias.chamadas,
            tabela,
          ),
      };
    },
  );

  const obras = await carregarObrasPublicadasPorIdsSupabase([
    " obra-1 ",
    "obra-2",
    "obra-1",
    " ",
    "obra-2",
  ]);

  assert.deepEqual(obras.map((obra) => obra.id), ["obra-2", "obra-1"]);
  assert.deepEqual(obras[0].capitulos.map((capitulo) => capitulo.id), [
    "capitulo-2a",
    "capitulo-2b",
  ]);
  assert.deepEqual(obras[1].capitulos.map((capitulo) => capitulo.id), ["capitulo-1"]);
  assert.deepEqual(dependencias.chamadas[0].in, [["id", ["obra-1", "obra-2"]]]);
  assert.equal(dependencias.chamadas[0].limit, 2);
  assert.deepEqual(dependencias.chamadas[1].in, [["obra_id", ["obra-2", "obra-1"]]]);
  assert.equal(dependencias.chamadas[1].limit, 40);
});

test("preserva listas vazias e fallbacks quando consultas de obras ou capítulos falham", async () => {
  const moduloVazio = await carregarModulo(() => {});
  assert.deepEqual(await moduloVazio.carregarObrasPublicadasPorIdsSupabase([]), []);
  assert.deepEqual(moduloVazio.dependencias.chamadas, []);

  const moduloFalhaObras = await carregarModulo((dependencias) => {
    dependencias.supabase = {
      from: (tabela) =>
        criarConsulta({ data: null, error: new Error("obras indisponíveis") }, dependencias.chamadas, tabela),
    };
  });
  assert.deepEqual(await moduloFalhaObras.carregarObrasPublicadasPorIdsSupabase(["obra-1"]), []);

  const moduloFalhaCapitulos = await carregarModulo((dependencias) => {
    dependencias.supabase = {
      from: (tabela) =>
        criarConsulta(
          tabela === "obras"
            ? { data: [{ id: "obra-1", titulo: "Obra 1" }], error: null }
            : { data: null, error: new Error("capítulos indisponíveis") },
          dependencias.chamadas,
          tabela,
        ),
    };
  });
  const obras = await moduloFalhaCapitulos.carregarObrasPublicadasPorIdsSupabase(["obra-1"]);
  assert.deepEqual(obras.map((obra) => obra.id), ["obra-1"]);
  assert.deepEqual(obras[0].capitulos, []);
});

test("mantém obras paginadas quando capítulos falham e retorna vazio na falha de obras", async () => {
  const moduloFalhaCapitulos = await carregarModulo((dependencias) => {
    dependencias.carregarTodasPaginasSupabase = async () => [
      { id: "obra-1", titulo: "Obra 1" },
    ];
    dependencias.carregarTodasPaginasPorLotesSupabase = async () => {
      throw new Error("capítulos indisponíveis");
    };
  });
  const obras = await moduloFalhaCapitulos.carregarObrasPublicadasSupabase();
  assert.deepEqual(obras.map((obra) => obra.id), ["obra-1"]);
  assert.deepEqual(obras[0].capitulos, []);

  const moduloFalhaObras = await carregarModulo((dependencias) => {
    dependencias.carregarTodasPaginasSupabase = async () => {
      throw new Error("obras indisponíveis");
    };
  });
  assert.deepEqual(await moduloFalhaObras.carregarObrasPublicadasSupabase(), []);
});

test("Perfil de Autor delega somente os carregadores publicados ao módulo extraído", () => {
  assert.match(
    loaderSource,
    /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(
    loaderSource,
    /import \{[\s\S]*?carregarTodasPaginasPorLotesSupabase,[\s\S]*?carregarTodasPaginasSupabase,[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/paginacao\.mjs";/,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?carregarObrasPublicadasPorIdsSupabase,[\s\S]*?carregarObrasPublicadasSupabase,[\s\S]*?\} from "\.\/lib\/profile-published-works-loader";/,
  );

  for (const helper of [
    "carregarObrasPublicadasSupabase",
    "carregarObrasPublicadasPorIdsSupabase",
  ]) {
    assert.match(loaderSource, new RegExp(`export async function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`async function ${helper}\\(`));
  }

  assert.match(pagina, /await carregarObrasPublicadasSupabase\(\)/);
  assert.match(pagina, /await carregarObrasPublicadasPorIdsSupabase\([\s\S]*?idsObrasFaltantes/);
  assert.match(pagina, /supabase\s*\.from\("profiles"\)/);
  assert.doesNotMatch(loaderSource, /useState|useEffect|localStorage/);
});
