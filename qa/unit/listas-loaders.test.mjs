import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const recordsSource = readFileSync(
  new URL("../../app/listas/lib/listas-profile-records-loader.ts", import.meta.url),
  "utf8",
);
const worksSource = readFileSync(
  new URL("../../app/listas/lib/listas-published-works-loader.ts", import.meta.url),
  "utf8",
);
const catalogSource = readFileSync(
  new URL("../../app/listas/lib/listas-public-catalog-loader.ts", import.meta.url),
  "utf8",
);

let contadorModulo = 0;

async function importarModulo(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  contadorModulo += 1;
  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${contadorModulo}`,
  );
}

function criarSupabaseMock(respostas) {
  const chamadas = [];
  const indices = new Map();
  const proximaResposta = (tabela) => {
    const lista = respostas[tabela] || [{ data: [], error: null }];
    const indice = indices.get(tabela) || 0;
    indices.set(tabela, indice + 1);
    return lista[Math.min(indice, lista.length - 1)];
  };
  const supabase = {
    from(tabela) {
      const query = {
        select(campos) {
          chamadas.push([tabela, "select", campos]);
          return query;
        },
        eq(campo, valor) {
          chamadas.push([tabela, "eq", campo, valor]);
          return query;
        },
        in(campo, valores) {
          chamadas.push([tabela, "in", campo, valores]);
          return query;
        },
        order(campo, opcoes) {
          chamadas.push([tabela, "order", campo, opcoes]);
          return query;
        },
        limit(valor) {
          chamadas.push([tabela, "limit", valor]);
          return query;
        },
        maybeSingle() {
          chamadas.push([tabela, "maybeSingle"]);
          return Promise.resolve(proximaResposta(tabela));
        },
        then(resolve, reject) {
          return Promise.resolve(proximaResposta(tabela)).then(resolve, reject);
        },
      };
      chamadas.push([tabela, "from"]);
      return query;
    },
    rpc(nome, parametros) {
      chamadas.push(["rpc", nome, parametros]);
      return Promise.resolve(proximaResposta("rpc"));
    },
  };
  return { supabase, chamadas };
}

const idValido = (valor) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(valor).trim(),
  );
const texto = (valor, fallback = "") =>
  typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
const numero = (valor, fallback = 0) => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : fallback;
};

async function importarRecords(supabase) {
  globalThis.__listasSupabase = supabase;
  return importarModulo(
    recordsSource
      .replace('import { supabase } from "../../../lib/supabase/client";', "const supabase = globalThis.__listasSupabase;")
      .replace(/import \{[\s\S]*?\} from "\.\/listas-diary-rating-utils";/, 'const AVALIACAO_DIARIO_LISTAS_VAZIA = { media: 0, total: 0, minhaNota: 0 }; const normalizarAvaliacaoDiarioListas = (data) => data;')
      .replace('import { criarPerfilLista } from "./listas-profile-state-utils";', `const criarPerfilLista = (row, userId, nomeFallback) => ({ userId: row?.user_id || row?.id || userId, nome: row?.nome || nomeFallback.trim() || "Usuário", username: row?.username || "", avatar: row?.avatar_url || "", bio: row?.bio || row?.sobre_bio || "Perfil no Historietas." });`)
      .replace('import { idUsuarioValido } from "./listas-value-utils";', `const idUsuarioValido = ${idValido.toString()};`),
  );
}

async function importarWorks(supabase, carregarMetricasConteudos) {
  globalThis.__listasSupabase = supabase;
  globalThis.__listasMetricas = carregarMetricasConteudos;
  return importarModulo(
    worksSource
      .replace('import { supabase } from "../../../lib/supabase/client";', "const supabase = globalThis.__listasSupabase;")
      .replace('import { carregarMetricasConteudos } from "../../../lib/metricas";', "const carregarMetricasConteudos = globalThis.__listasMetricas;")
      .replace('import { criarObraLista } from "./listas-profile-state-utils";', 'const criarObraLista = (row, index) => ({ id: pegarTexto(row.id, `obra-${index + 1}`), autorId: pegarTexto(row.user_id), titulo: pegarTexto(row.titulo, `Obra ${index + 1}`), autor: pegarTexto(row.autor, "Autor não informado"), genero: pegarTexto(row.genero, "Não informado"), formato: pegarTexto(row.formato, "Não informado"), classificacaoIndicativa: pegarTexto(row.classificacao_indicativa), capa: pegarTexto(row.capa_url), slug: pegarTexto(row.slug, pegarTexto(row.titulo, `obra-${index + 1}`)), link: `/obra/${pegarTexto(row.slug, pegarTexto(row.titulo, `obra-${index + 1}`))}`, publicadaEm: pegarTexto(row.criada_em), visualizacoes: pegarNumero(row.visualizacoes), totalCurtidas: 0, totalComentarios: 0, capitulos: [], notaMedia: 0, totalAvaliacoes: 0 });')
      .replace('import { pegarNumero, pegarTexto } from "./listas-value-utils";', `const pegarNumero = ${numero.toString()}; const pegarTexto = ${texto.toString()};`),
  );
}

async function importarCatalog(supabase, carregarMetricasConteudos) {
  globalThis.__listasSupabase = supabase;
  globalThis.__listasMetricas = carregarMetricasConteudos;
  return importarModulo(
    catalogSource
      .replace('import { supabase } from "../../../lib/supabase/client";', "const supabase = globalThis.__listasSupabase;")
      .replace('import { normalizarTexto } from "../../../lib/utils";', 'const normalizarTexto = (valor) => String(valor || "").trim().toLowerCase();')
      .replace('import { carregarMetricasConteudos } from "../../../lib/metricas";', "const carregarMetricasConteudos = globalThis.__listasMetricas;")
      .replace('import { timestampData } from "./listas-format-utils";', 'const timestampData = (valor) => Date.parse(valor) || 0;')
      .replace('import { criarPerfilLista } from "./listas-profile-state-utils";', 'const criarPerfilLista = (row, userId, nomeFallback) => ({ userId: row?.user_id || row?.id || userId, nome: row?.nome || nomeFallback, username: row?.username || "", avatar: row?.avatar_url || "", bio: row?.bio || row?.sobre_bio || "Perfil no Historietas." });')
      .replace('import { idUsuarioValido, pegarTexto } from "./listas-value-utils";', `const idUsuarioValido = ${idValido.toString()}; const pegarTexto = ${texto.toString()};`),
  );
}

test("Listas delega os carregadores, preservando as fronteiras da página", () => {
  for (const helper of [
    "carregarAvaliacaoDiarioListas",
    "carregarPerfil",
    "carregarRegistrosUsuario",
    "carregarObrasPublicadas",
    "carregarIdsInteracoesUsuario",
    "carregarAutoresPublicos",
  ]) {
    assert.match(page, new RegExp(`import[\\s\\S]*?\\b${helper}\\b`));
    assert.doesNotMatch(page, new RegExp(`async function ${helper}\\(`));
  }
  assert.match(worksSource, /export const CAMPOS_OBRAS =/);
  assert.match(recordsSource, /export type TabelaRegistrosUsuarioListas/);
  assert.match(worksSource, /\.from\("obras"\)[\s\S]*?\.select\(CAMPOS_OBRAS\)[\s\S]*?\.eq\("publicado", true\)[\s\S]*?\.order\("criada_em", \{ ascending: false \}\)/);
  assert.match(worksSource, /\.from\("capitulos"\)[\s\S]*?\.select\("id,obra_id,titulo,ordem,publicado,criado_em"\)[\s\S]*?\.eq\("publicado", true\)[\s\S]*?\.order\("ordem", \{ ascending: true \}\)/);
  assert.match(recordsSource, /\.rpc\("carregar_avaliacao_diario", \{[\s\S]*?p_diario_user_id: userId/);
  assert.match(catalogSource, /const tamanhoChunk = 100/);
});

test("registros preservam UUID inválido, fallback user_id/id e contratos de query", async () => {
  const invalido = criarSupabaseMock({});
  const loaderInvalido = await importarRecords(invalido.supabase);
  assert.deepEqual(await loaderInvalido.carregarRegistrosUsuario("favoritos", "invalido"), []);
  assert.equal(invalido.chamadas.length, 0);

  const mock = criarSupabaseMock({
    profiles_publicos: [
      { data: null, error: null },
      { data: { id: "perfil-id", nome: "Perfil alternativo" }, error: null },
    ],
    favoritos: [{ data: [{ obra_id: "obra-1" }, null], error: null }],
    rpc: [{ data: { media: 4, total: 2, minhaNota: 4 }, error: null }],
  });
  const loader = await importarRecords(mock.supabase);
  const userId = "11111111-1111-4111-8111-111111111111";
  assert.equal((await loader.carregarPerfil(userId, "Fallback")).nome, "Perfil alternativo");
  assert.deepEqual(await loader.carregarRegistrosUsuario("favoritos", userId), [{ obra_id: "obra-1" }]);
  assert.deepEqual(await loader.carregarAvaliacaoDiarioListas(userId), { media: 4, total: 2, minhaNota: 4 });
  assert.deepEqual(
    mock.chamadas.filter(([tabela, metodo]) => tabela === "profiles_publicos" && metodo === "eq").map(([, , campo]) => campo),
    ["user_id", "id"],
  );
  assert.ok(mock.chamadas.some(([tabela, metodo, valor]) => tabela === "favoritos" && metodo === "select" && valor === "obra_id,visibilidade,criado_em"));
  assert.ok(mock.chamadas.some(([tabela, metodo, campo, valor]) => tabela === "favoritos" && metodo === "eq" && campo === "user_id" && valor === userId));
  assert.ok(mock.chamadas.some(([tabela, metodo, valor]) => tabela === "favoritos" && metodo === "limit" && valor === 2000));
});

test("obras preservam capítulos vazios e fallback quando métricas indisponíveis", async () => {
  const mock = criarSupabaseMock({
    obras: [{ data: [{ id: "obra-1", user_id: "autor-1", titulo: "Obra" }], error: null }],
    capitulos: [{ data: [], error: null }],
  });
  const loader = await importarWorks(mock.supabase, async () => ({ carregado: false, obras: new Map() }));
  const obras = await loader.carregarObrasPublicadas();
  assert.equal(obras.length, 1);
  assert.deepEqual(obras[0].capitulos, []);
  assert.equal(obras[0].totalCurtidas, 0);
  assert.ok(mock.chamadas.some(([tabela, metodo, valor]) => tabela === "obras" && metodo === "select" && valor === loader.CAMPOS_OBRAS));
  assert.ok(mock.chamadas.some(([tabela, metodo, valor]) => tabela === "obras" && metodo === "limit" && valor === 500));
  assert.ok(mock.chamadas.some(([tabela, metodo, campo, valor]) => tabela === "capitulos" && metodo === "eq" && campo === "publicado" && valor === true));
});

test("catálogo preserva deduplicação de interações, agrupamento e fallback das obras", async () => {
  const invalido = criarSupabaseMock({});
  const catalogoInvalido = await importarCatalog(invalido.supabase, async () => ({ carregado: false, autores: [] }));
  assert.deepEqual(await catalogoInvalido.carregarIdsInteracoesUsuario("invalido"), []);
  assert.equal(invalido.chamadas.length, 0);

  const mock = criarSupabaseMock({
    favoritos: [{ data: [{ obra_id: "obra-1" }], error: null }],
    seguindo_obras: [{ data: [{ obra_id: "obra-1" }, { obra_id: "obra-2" }], error: null }],
    concluidas: [{ data: [{ obra_id: "obra-2" }], error: null }],
    profiles_publicos: [{ data: [], error: new Error("indisponível") }],
  });
  const catalogo = await importarCatalog(mock.supabase, async () => ({ carregado: false, autores: [] }));
  const userId = "11111111-1111-4111-8111-111111111111";
  assert.deepEqual(await catalogo.carregarIdsInteracoesUsuario(userId), ["obra-1", "obra-2"]);
  const autores = await catalogo.carregarAutoresPublicos([
    { id: "obra-1", autorId: userId, titulo: "A", autor: "Autora", genero: "Fantasia", formato: "", classificacaoIndicativa: "", capa: "", slug: "a", link: "/obra/a", publicadaEm: "2024-01-01", visualizacoes: 0, totalCurtidas: 2, totalComentarios: 1, capitulos: [], notaMedia: 0, totalAvaliacoes: 0 },
    { id: "obra-2", autorId: userId, titulo: "B", autor: "Autora", genero: "Drama", formato: "", classificacaoIndicativa: "", capa: "", slug: "b", link: "/obra/b", publicadaEm: "2024-02-01", visualizacoes: 0, totalCurtidas: 3, totalComentarios: 4, capitulos: [], notaMedia: 0, totalAvaliacoes: 0 },
  ]);
  assert.deepEqual(autores, [{ id: userId, nome: "Autora", username: "", avatar: "", bio: "Autor no Historietas.", totalObras: 2, totalCurtidas: 5, totalComentarios: 5, notaMedia: 0, totalAvaliacoes: 0, generos: ["Fantasia", "Drama"], criadaEm: "2024-02-01" }]);
});
