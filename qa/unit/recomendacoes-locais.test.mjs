import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const id = (n) => "ca000000-0000-4000-8000-" + String(n).padStart(12, "0");
const leitor = id(99);
const origem = "http://127.0.0.1:56421";
const rota = origem + "/rest/v1/rpc/qa5_recomendar_obras_autorizadas";
const fixture = Array.from({ length: 20 }, (_, i) => ({
  obra_id: id(i),
  cursor_valor: 0,
  cursor_data: "2026-10-01T00:00:00+00:00",
  cursor_id: id(i),
  metadados: {
    id: id(i), user_id: id(30 + Math.floor(i / 3)), titulo: "Obra " + i,
    autor: "Autor", genero: "Fantasia", formato: "Conto", classificacao_indicativa: "Livre",
    avisos_conteudo: [], sinopse: "", tags: [], slug: "obra-" + i, criada_em: null,
    publicado: true, visualizacoes: i, total_capitulos: 1, possui_arquivo: false,
  },
}));

function carregar(t, { genero = "Fantasia", url = origem, ambiente = "development", sessao = { user: { id: leitor }, access_token: "qa5-token" }, authError = null } = {}) {
  const valores = {
    NODE_ENV: ambiente,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_qa5",
    NEXT_PUBLIC_HISTORIETAS_RECOMENDACOES_LOCAL: "1",
    NEXT_PUBLIC_HISTORIETAS_RECOMENDACOES_GENEROS: genero,
  };
  const antigos = new Map(Object.keys(valores).map((nome) => [nome, process.env[nome]]));
  Object.assign(process.env, valores);
  t.after(() => {
    for (const [nome, valor] of antigos) {
      if (valor === undefined) delete process.env[nome];
      else process.env[nome] = valor;
    }
  });
  return loadApplicationModule("lib/recomendacoes-locais.ts", {
    "./supabase/client": {
      supabase: { auth: { getSession: async () => ({ data: { session: sessao }, error: authError }) } },
    },
  });
}

function responderPagina(_, init, linhas = fixture) {
  const { p_limite: limite, p_cursor_id: cursor } = JSON.parse(init.body);
  const comeco = cursor ? linhas.findIndex((obra) => obra.obra_id === cursor) + 1 : 0;
  const fim = comeco + limite;
  return Response.json(linhas.slice(comeco, fim).map((obra) => ({
    ...obra,
    tem_mais: fim < linhas.length,
  })));
}

test("Explorar e Ver mais recebem a mesma ordem em leituras independentes", async (t) => {
  const { carregarRecomendacoesLocais } = carregar(t);
  const fetch = t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, rota);
    assert.equal(init.headers.get("Authorization"), "Bearer qa5-token");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    assert.equal(JSON.parse(init.body).p_genero, "Fantasia");
    return responderPagina(url, init);
  });
  const carregarTela = () => carregarRecomendacoesLocais(leitor, new AbortController().signal);
  const primeira = (await carregarTela()).slice(0, 12);
  const verMais = await carregarTela();
  assert.equal(fetch.mock.callCount(), 6);
  assert.equal(verMais.length, 14);
  assert.deepEqual(verMais.slice(0, 12), primeira);
  const desempate = (obra) => createHash("sha256").update("desempate|" + obra.id).digest().readUInt32BE();
  const quantidades = new Map();
  const esperadas = fixture.map((linha) => linha.metadados).sort((a, b) => desempate(a) - desempate(b))
    .filter((obra) => {
      const total = (quantidades.get(obra.user_id) ?? 0) + 1;
      quantidades.set(obra.user_id, total);
      return total <= 2;
    });
  assert.deepEqual(verMais.map((obra) => obra.id), esperadas.map((obra) => obra.id));
});

test("catálogo de um autor retorna duas obras nas duas telas", async (t) => {
  const { carregarRecomendacoesLocais } = carregar(t);
  const obrasDoAutor = fixture.slice(0, 9).map((linha) => ({
    ...linha,
    metadados: { ...linha.metadados, user_id: id(30) },
  }));
  const fetch = t.mock.method(globalThis, "fetch", (url, init) =>
    responderPagina(url, init, obrasDoAutor));
  const explorar = (await carregarRecomendacoesLocais(leitor, AbortSignal.timeout(5000))).slice(0, 12);
  const verMais = await carregarRecomendacoesLocais(leitor, AbortSignal.timeout(5000));
  assert.equal(fetch.mock.callCount(), 4);
  assert.equal(explorar.length, 2);
  assert.deepEqual(verMais, explorar);
});

test("visitante usa somente uma página de descoberta e não envia credencial de leitor", async (t) => {
  const { carregarRecomendacoesLocais } = carregar(t, { genero: "", sessao: null });
  const fetch = t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, rota);
    assert.equal(init.headers.has("Authorization"), false);
    assert.equal(JSON.parse(init.body).p_limite, 28);
    return responderPagina(url, init);
  });
  assert.equal((await carregarRecomendacoesLocais("", new AbortController().signal)).length, 14);
  assert.equal(fetch.mock.callCount(), 1);
});

test("401 na segunda página não entrega dados parciais nem tenta outro catálogo", async (t) => {
  const { carregarRecomendacoesLocais } = carregar(t);
  let chamadas = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, rota);
    assert.equal(init.headers.get("Authorization"), "Bearer qa5-token");
    chamadas++;
    return chamadas === 1 ? responderPagina(url, init) : Response.json({ code: "PT401" }, { status: 401 });
  });
  await assert.rejects(carregarRecomendacoesLocais(leitor, new AbortController().signal), /Não foi possível/);
  assert.equal(chamadas, 2);
});

test("sessão de outra conta não inicia a consulta", async (t) => {
  const { carregarRecomendacoesLocais } = carregar(t);
  const fetch = t.mock.method(globalThis, "fetch", async () => assert.fail("requisição indevida"));
  await assert.rejects(carregarRecomendacoesLocais(id(100), new AbortController().signal));
  assert.equal(fetch.mock.callCount(), 0);
});

test("erro ao recuperar a sessão não vira consulta anônima", async (t) => {
  const { carregarRecomendacoesLocais } = carregar(t, { sessao: null, authError: Error("sessão inválida") });
  const fetch = t.mock.method(globalThis, "fetch", async () => assert.fail("requisição indevida"));
  await assert.rejects(carregarRecomendacoesLocais("", new AbortController().signal));
  assert.equal(fetch.mock.callCount(), 0);
});

test("destino remoto e build de produção desativam o piloto", async (t) => {
  assert.equal(carregar(t, { url: "https://example.invalid" }).recomendacoesLocaisAtivas, false);
  assert.equal(carregar(t, { ambiente: "production" }).recomendacoesLocaisAtivas, false);
});

test("Listas mantém a ordem recebida para as recomendações do piloto", () => {
  const { filtrarOrdenarObrasPublicasListas } = loadApplicationModule("app/listas/lib/listas-filter-sort-utils.ts");
  const obras = [
    { titulo: "Zeta", autor: "Autor", genero: "Conto", formato: "Conto" },
    { titulo: "Alfa", autor: "Autor", genero: "Conto", formato: "Conto" },
  ];
  assert.deepEqual(filtrarOrdenarObrasPublicasListas(obras, "", "titulo", "recomendacoes", true), obras);
  assert.deepEqual(filtrarOrdenarObrasPublicasListas(obras, "", "titulo", "recomendacoes"), obras.toReversed());
});

test("Explorar monta a seção mesmo quando o catálogo comum está vazio", () => {
  const Recomendacoes = () => null;
  const { ExplorarCreativeWorkSections } = loadApplicationModule(
    "app/explorar/components/explorar-creative-work-sections.tsx",
    {
      "../../../lib/recomendacoes-locais": { recomendacoesLocaisAtivas: true },
      "./explorar-recomendacoes-locais": { ExplorarRecomendacoesLocais: Recomendacoes },
      "./explorar-obra-publicada-card": { default: () => assert.fail("card legado") },
      "./explorar-section-components": {},
      "../lib/explorar-content-styles": {},
    },
  );
  const props = { mostrarRecomendacoes: true, leitor, isDesktop: true, tema: {} };
  const vazio = ExplorarCreativeWorkSections({ ...props, secoes: [] });
  assert.equal(vazio.props.children[0].type, Recomendacoes);
  assert.equal(vazio.props.children[0].props.leitor, leitor);
  const legado = ExplorarCreativeWorkSections({
    ...props,
    secoes: [{ titulo: "Recomendações para você", obras: [{ id: "legado" }] }],
  });
  assert.deepEqual(legado.props.children[1], [null]);
});
