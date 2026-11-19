import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const id = (n) => "ca000000-0000-4000-8000-" + String(n).padStart(12, "0");
const leitor = id(99);
const origem = "http://127.0.0.1:56421";
const rpcSinais = "/rest/v1/rpc/qa5_generos_interacoes_autorizadas";
const rpcCatalogo = "/rest/v1/rpc/qa5_recomendar_obras_autorizadas";
const rota = origem + rpcCatalogo;
const homologacao = "https://rvmsnsltlhlnvbrlyoxh.supabase.co";
const preview = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "codex/recomendacoes-homologacao",
  HISTORIETAS_RECOMENDACOES_PREVIEW: "1",
};
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

function carregar(t, {
  url = origem, ambiente = "development",
  sessao = { user: { id: leitor }, access_token: "qa5-token" }, authError = null,
  build = {},
} = {}) {
  const valores = {
    NODE_ENV: ambiente,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_qa5",
    NEXT_PUBLIC_HISTORIETAS_RECOMENDACOES_LOCAL: "1",
    VERCEL: undefined,
    VERCEL_ENV: undefined,
    VERCEL_GIT_COMMIT_REF: undefined,
    HISTORIETAS_RECOMENDACOES_PREVIEW: undefined,
    HISTORIETAS_RECOMENDACOES_ORIGEM_PREVIEW: undefined,
    ...build,
  };
  const antigos = new Map(Object.keys(valores).map((nome) => [nome, process.env[nome]]));
  for (const [nome, valor] of Object.entries(valores)) {
    if (valor === undefined) delete process.env[nome];
    else process.env[nome] = valor;
  }
  t.after(() => {
    for (const [nome, valor] of antigos) {
      if (valor === undefined) delete process.env[nome];
      else process.env[nome] = valor;
    }
  });
  const { default: config } = loadApplicationModule("next.config.ts", {
    "@sentry/nextjs/config": { withSentryConfig: (config) => config },
  });
  Object.assign(process.env, config.env);
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
    assert.equal(init.headers.get("Authorization"), "Bearer qa5-token");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    if (url === origem + rpcSinais) {
      assert.deepEqual(JSON.parse(init.body), {});
      return Response.json(["Fantasia"]);
    }
    assert.equal(url, rota);
    assert.equal(JSON.parse(init.body).p_genero, "Fantasia");
    return responderPagina(url, init);
  });
  const carregarTela = () => carregarRecomendacoesLocais(leitor, new AbortController().signal);
  const primeira = (await carregarTela()).slice(0, 12);
  const verMais = await carregarTela();
  assert.equal(fetch.mock.callCount(), 8);
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
    url === origem + rpcSinais ? Response.json(["Fantasia"]) : responderPagina(url, init, obrasDoAutor));
  const explorar = (await carregarRecomendacoesLocais(leitor, AbortSignal.timeout(5000))).slice(0, 12);
  const verMais = await carregarRecomendacoesLocais(leitor, AbortSignal.timeout(5000));
  assert.equal(fetch.mock.callCount(), 6);
  assert.equal(explorar.length, 2);
  assert.deepEqual(verMais, explorar);
});

test("visitante usa somente uma página de descoberta e não envia credencial de leitor", async (t) => {
  const { carregarRecomendacoesLocais } = carregar(t, { sessao: null });
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
    if (url === origem + rpcSinais) return Response.json(["Fantasia"]);
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

test("Preview da branch dedicada usa os gêneros da sessão no Supabase de homologação", async (t) => {
  const modulo = carregar(t, { url: homologacao + "/", ambiente: "production", build: preview });
  assert.equal(modulo.recomendacoesLocaisAtivas, true);
  assert.equal(modulo.usarRecomendacoesLocais("obras", "recomendacoes"), true);
  assert.equal(modulo.usarRecomendacoesLocais("obras", "ranking"), false);
  const fetch = t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(init.headers.get("Authorization"), "Bearer qa5-token");
    assert.equal(init.headers.get("apikey"), "sb_publishable_qa5");
    assert.equal(init.redirect, "error");
    if (url === homologacao + rpcSinais) return Response.json(["Romance", "Ficção científica"]);
    assert.equal(url, homologacao + rpcCatalogo);
    return Response.json([]);
  });
  assert.deepEqual(await modulo.carregarRecomendacoesLocais(leitor, AbortSignal.timeout(5000)), []);
  assert.deepEqual(fetch.mock.calls.slice(1).map(({ arguments: [, init] }) => JSON.parse(init.body).p_genero),
    ["Romance", "Ficção científica"]);
});

test("leitor autenticado sem sinais usa somente uma página de descoberta autorizada", async (t) => {
  const modulo = carregar(t);
  const fetch = t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(init.headers.get("Authorization"), "Bearer qa5-token");
    if (url === origem + rpcSinais) return Response.json([]);
    assert.equal(url, rota);
    const parametros = JSON.parse(init.body);
    assert.equal(parametros.p_genero, "");
    assert.equal(parametros.p_limite, 28);
    return responderPagina(url, init);
  });
  assert.equal((await modulo.carregarRecomendacoesLocais(leitor, AbortSignal.timeout(5000))).length, 14);
  assert.deepEqual(fetch.mock.calls.map(({ arguments: [url] }) => url), [origem + rpcSinais, rota]);
});

test("falha nos sinais não abre descoberta geral nem consulta o catálogo legado", async (t) => {
  const casos = [
    ["sessão recusada", () => Response.json({ code: "PT401" }, { status: 401 })],
    ["permissão fechada", () => Response.json({ code: "42501" }, { status: 403 })],
    ["falha de rede", () => { throw new TypeError("Failed to fetch"); }],
    ["resposta fora do contrato", () => Response.json({ generos: [] })],
    ["resposta nula", () => Response.json(null)],
    ["gênero em branco", () => Response.json([" "])],
    ["gênero longo", () => Response.json(["a".repeat(65)])],
    ["mais de três gêneros", () => Response.json(["A", "B", "C", "D"])],
  ];
  for (const [rotulo, responder] of casos) {
    await t.test(rotulo, async (subteste) => {
      const modulo = carregar(subteste);
      const fetch = subteste.mock.method(globalThis, "fetch", (url) => {
        assert.equal(url, origem + rpcSinais);
        return responder();
      });
      await assert.rejects(modulo.carregarRecomendacoesLocais(leitor, AbortSignal.timeout(5000)));
      assert.equal(fetch.mock.callCount(), 1);
    });
  }
});

test("consulta abortada durante os sinais não inicia busca de obras", async (t) => {
  const modulo = carregar(t);
  const controller = new AbortController();
  const fetch = t.mock.method(globalThis, "fetch", (url, init) => {
    assert.equal(url, origem + rpcSinais);
    assert.equal(init.signal, controller.signal);
    controller.abort();
    return Response.json(["Romance"]);
  });
  await assert.rejects(modulo.carregarRecomendacoesLocais(leitor, controller.signal), { name: "AbortError" });
  assert.equal(fetch.mock.callCount(), 1);
});

test("piloto recusa ambientes e destinos fora do escopo antes de consultar", async (t) => {
  const casos = [
    ["produção da Vercel", { build: { ...preview, VERCEL_ENV: "production" } }],
    ["build fora da Vercel", { build: { ...preview, VERCEL: undefined } }],
    ["branch diferente", { build: { ...preview, VERCEL_GIT_COMMIT_REF: "codex/outra-branch" } }],
    ["Preview sem ativação", { build: { ...preview, HISTORIETAS_RECOMENDACOES_PREVIEW: undefined } }],
    ["Supabase de produção", { url: "https://drqqgfxrchnymetmpabd.supabase.co" }],
    ["origem com sufixo indevido", { url: homologacao + ".example.invalid" }],
    ["origem com caminho extra", { url: homologacao + "/rest" }],
    ["origem HTTP", { url: homologacao.replace("https:", "http:") }],
    ["Preview sem chave publicável", { build: { ...preview, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined } }],
    ["Preview com chave não publicável", { build: { ...preview, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "chave-de-teste-invalida" } }],
    ["next dev com destino remoto", { ambiente: "development" }],
    ["build de produção com loopback", { url: origem, build: {} }],
  ];
  for (const [rotulo, opcoes] of casos) {
    await t.test(rotulo, async (subteste) => {
      const modulo = carregar(subteste, { url: homologacao, ambiente: "production", build: preview, ...opcoes });
      const fetch = subteste.mock.method(globalThis, "fetch", async () => assert.fail("requisição indevida"));
      assert.equal(modulo.recomendacoesLocaisAtivas, false);
      await assert.rejects(modulo.carregarRecomendacoesLocais(leitor, AbortSignal.timeout(5000)));
      assert.equal(fetch.mock.callCount(), 0);
    });
  }
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
