import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-interactions-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url), "utf8");
let indiceModulo = 0;

function criarMetricas({ carregado = true, obras = [], capitulos = [] } = {}) {
  return { carregado, obras: new Map(obras), capitulos: new Map(capitulos) };
}

function criarConsulta(resposta, chamadas, tabela) {
  const chamada = { tabela, select: "", eq: [], in: [], order: [], range: null };
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
    range(inicio, fim) {
      chamada.range = [inicio, fim];
      return Promise.resolve(resposta);
    },
  };
  return consulta;
}

async function carregarModulo(configurar) {
  const vazio = {
    curtidasPorObra: {}, comentariosPorObra: {}, curtidasPorCapitulo: {},
    comentariosPorCapitulo: {}, salvosPorObra: {}, salvosPorCapitulo: {}, concluidasPorObra: {},
  };
  const dependencias = {
    chamadas: [],
    metricas: criarMetricas(),
    vazio,
    supabase: { from: () => { throw new Error("Consulta Supabase não configurada."); } },
    carregarMetricasConteudos: async () => dependencias.metricas,
    carregarTodasPaginasPorLotesSupabase: async () => [],
    idObraSupabaseValido: (id) => id.startsWith("capitulo-"),
    pegarTexto: (valor) => (typeof valor === "string" ? valor.trim() : ""),
  };
  configurar(dependencias);
  globalThis.__profileInteractionsDependencies = dependencias;
  const javascript = typescript.transpileModule(
    loaderSource
      .replace(
        'import { carregarMetricasConteudos } from "../../../lib/metricas";',
        "const carregarMetricasConteudos = (...args) => globalThis.__profileInteractionsDependencies.carregarMetricasConteudos(...args);",
      )
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileInteractionsDependencies.supabase;",
      )
      .replace(
        'import { carregarTodasPaginasPorLotesSupabase } from "../../../lib/supabase/paginacao.mjs";',
        "const carregarTodasPaginasPorLotesSupabase = (...args) => globalThis.__profileInteractionsDependencies.carregarTodasPaginasPorLotesSupabase(...args);",
      )
      .replace(
        'import { idObraSupabaseValido } from "../../../lib/utils";',
        "const idObraSupabaseValido = globalThis.__profileInteractionsDependencies.idObraSupabaseValido;",
      )
      .replace(
        'import { totaisInteracoesObrasPerfilVazio } from "../constants";',
        "const totaisInteracoesObrasPerfilVazio = globalThis.__profileInteractionsDependencies.vazio;",
      )
      .replace(/import type \{[\s\S]*?\} from "\.\.\/types";\n/, "")
      .replace(
        'import { pegarTexto } from "./data-normalizers";',
        "const pegarTexto = globalThis.__profileInteractionsDependencies.pegarTexto;",
      ),
    { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } },
  ).outputText;
  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );
  return { ...modulo, dependencias };
}

test("deduplica IDs e aplica todas as métricas carregadas", async () => {
  const { carregarTotaisInteracoesObrasPerfilAutor, dependencias } = await carregarModulo((deps) => {
    deps.metricas = criarMetricas({
      obras: [["obra-1", { id: "obra-1", audiencia: { curtidoresUnicos: 3, comentaristasUnicos: 2, salvadoresUnicos: 1 }, interacoesDiretas: { concluidas: 4 } }]],
      capitulos: [["capitulo-1", { id: "capitulo-1", interacoes: { curtidas: 9, comentarios: 8, salvos: 7 } }]],
    });
  });
  let parametros;
  dependencias.carregarMetricasConteudos = async (valor) => {
    parametros = valor;
    return dependencias.metricas;
  };
  const totais = await carregarTotaisInteracoesObrasPerfilAutor([
    { id: " obra-1 ", capitulos: [{ id: " capitulo-1 " }, { id: "capitulo-1" }, { id: "capitulo-2" }] },
    { id: "obra-1", capitulos: [] },
  ]);
  assert.deepEqual(parametros, { obraIds: ["obra-1"], capituloIds: ["capitulo-1", "capitulo-2"] });
  assert.deepEqual(totais, {
    curtidasPorObra: { "obra-1": 3 }, comentariosPorObra: { "obra-1": 2 },
    salvosPorObra: { "obra-1": 1 }, concluidasPorObra: { "obra-1": 4 },
    curtidasPorCapitulo: { "capitulo-1": 9 }, comentariosPorCapitulo: { "capitulo-1": 8 },
    salvosPorCapitulo: { "capitulo-1": 7 },
  });
});

test("preserva o fallback vazio para métricas indisponíveis e IDs ausentes", async () => {
  const { carregarTotaisInteracoesObrasPerfilAutor, dependencias } = await carregarModulo((deps) => {
    deps.metricas = criarMetricas({ carregado: false });
  });
  assert.equal(await carregarTotaisInteracoesObrasPerfilAutor([{ id: "", capitulos: [] }]), dependencias.vazio);
  assert.equal(await carregarTotaisInteracoesObrasPerfilAutor([{ id: "obra-1", capitulos: [] }]), dependencias.vazio);
});

test("isola interações por usuário e preserva comentários, curtidas, salvos e progresso", async () => {
  const { carregarInteracoesCapitulosSupabase, dependencias } = await carregarModulo((deps) => {
    deps.metricas = criarMetricas({
      capitulos: [
        ["capitulo-1", { id: "capitulo-1", usuario: { curtiu: true, salvou: false, leu: true, lidoEm: "2026-01-01" } }],
        ["capitulo-2", { id: "capitulo-2", usuario: { curtiu: false, salvou: true, leu: false, lidoEm: "" } }],
      ],
    });
    deps.supabase = {
      from: (tabela) => criarConsulta({
        data: [
          { capitulo_id: "capitulo-1", comentario: " comentário 1 " },
          { capitulo_id: "", comentario: "ignorado" },
          { capitulo_id: "capitulo-2", comentario: "" },
        ], error: null,
      }, deps.chamadas, tabela),
    };
    deps.carregarTodasPaginasPorLotesSupabase = async (opcoes) => {
      assert.equal(opcoes.nomeColecao, "comentários pessoais do perfil do autor");
      assert.deepEqual(opcoes.itens, ["capitulo-1", "capitulo-2"]);
      return (await opcoes.buscarPaginaLote(opcoes.itens, 10, 19)).data;
    };
  });
  const interacoes = await carregarInteracoesCapitulosSupabase("usuario-1", [
    { id: "obra-1", capitulos: [{ id: "capitulo-1" }, { id: "capitulo-1" }, { id: "capitulo-2" }, { id: "invalido" }] },
  ]);
  assert.deepEqual([...interacoes.curtidas], ["capitulo-1"]);
  assert.deepEqual([...interacoes.salvos], ["capitulo-2"]);
  assert.deepEqual([...interacoes.comentarios], [["capitulo-1", "comentário 1"]]);
  assert.deepEqual([...interacoes.progresso], [["capitulo-1", "2026-01-01"]]);
  assert.deepEqual([...interacoes.capitulosComMetricas], ["capitulo-1", "capitulo-2"]);
  assert.deepEqual(dependencias.chamadas[0], {
    tabela: "comentarios_capitulos", select: "id,capitulo_id,comentario", eq: [["user_id", "usuario-1"]],
    in: [["capitulo_id", ["capitulo-1", "capitulo-2"]]],
    order: [["capitulo_id", { ascending: true }], ["id", { ascending: true }]], range: [10, 19],
  });
});

test("mantém coleções de métricas se a paginação de comentários falhar", async () => {
  const { carregarInteracoesCapitulosSupabase } = await carregarModulo((deps) => {
    deps.metricas = criarMetricas({
      capitulos: [["capitulo-1", { id: "capitulo-1", usuario: { curtiu: true, salvou: true, leu: false, lidoEm: "" } }]],
    });
    deps.carregarTodasPaginasPorLotesSupabase = async () => { throw new Error("paginação indisponível"); };
  });
  const interacoes = await carregarInteracoesCapitulosSupabase("usuario-2", [{ id: "obra-1", capitulos: [{ id: "capitulo-1" }] }]);
  assert.deepEqual([...interacoes.curtidas], ["capitulo-1"]);
  assert.deepEqual([...interacoes.salvos], ["capitulo-1"]);
  assert.deepEqual([...interacoes.comentarios], []);
  assert.deepEqual([...interacoes.progresso], []);
});

test("Perfil de Autor delega os dois carregadores de interações", () => {
  assert.match(pagina, /import \{[\s\S]*?carregarInteracoesCapitulosSupabase,[\s\S]*?carregarTotaisInteracoesObrasPerfilAutor,[\s\S]*?\} from "\.\/lib\/profile-interactions-loader";/);
  for (const helper of ["carregarTotaisInteracoesObrasPerfilAutor", "carregarInteracoesCapitulosSupabase"]) {
    assert.match(loaderSource, new RegExp(`export async function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`async function ${helper}\\(`));
  }
  assert.match(pagina, /await carregarTotaisInteracoesObrasPerfilAutor\(obras\)/);
  assert.match(pagina, /await carregarInteracoesCapitulosSupabase\([\s\S]*?estadoUsuarioSupabase\.userId,[\s\S]*?obrasMescladas/);
  assert.doesNotMatch(loaderSource, /useState|useEffect|localStorage/);
});
