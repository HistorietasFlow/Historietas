import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";
import { montarLeitor } from "../helpers/ler-capitulo-dom-harness.mjs";

const fonte = readFileSync(
  new URL(
    "../../app/ler-capitulo/lib/ler-capitulo-navigation-actions.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const js = typescript.transpileModule(fonte, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText.replace(
  /import \{\s*criarHrefLeituraCapituloLeitor,?\s*\} from "\.\/ler-capitulo-chapter-route";/,
  "const criarHrefLeituraCapituloLeitor = (...args) => globalThis.__lerCapituloNavigation.href(...args);",
);
const {
  criarAcaoTrocaCapituloLeitor,
  criarEstadoHistoricoLeitor,
  obterIdentidadeHistoricoLeitor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`,
);
const fonteEstadoRota = readFileSync(
  new URL(
    "../../app/ler-capitulo/hooks/use-ler-capitulo-route-identity-state.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");

function cenario(obraAtual) {
  const eventos = [];
  globalThis.__lerCapituloNavigation = {
    href(obra, capituloId) {
      eventos.push(["href", obra, capituloId]);
      return `/obra/${obra.id}/${capituloId}`;
    },
  };
  const acao = criarAcaoTrocaCapituloLeitor({
    obraAtual,
    capituloId: "anterior",
    setCapituloId(capituloId) {
      eventos.push(["setter", capituloId]);
    },
  });

  return { acao, eventos };
}

test("ação preserva a fronteira visual sem persistência", () => {
  assert.match(fonte, /export function criarAcaoTrocaCapituloLeitor\(/);
  assert.match(fonte, /window\.history\.pushState\(/);
  assert.match(fonte, /window\.scrollTo\(/);
  assert.match(fonte, /top: 0,/);
  assert.match(fonte, /behavior: "smooth",/);
  assert.doesNotMatch(fonte, /\b(?:supabase|localStorage|useState|useEffect|router)\b/);
});

test("estado do histórico preserva o estado do Next e valida a identidade do capítulo", () => {
  const estado = criarEstadoHistoricoLeitor(
    { __NA: true },
    { obraId: "obra-a", capituloId: "capitulo-2" },
  );

  assert.deepEqual(estado, {
    __NA: true,
    __historietasLeitorCapitulo: {
      obraId: "obra-a",
      capituloId: "capitulo-2",
    },
  });
  assert.deepEqual(obterIdentidadeHistoricoLeitor(estado), {
    obraId: "obra-a",
    capituloId: "capitulo-2",
  });
  assert.equal(obterIdentidadeHistoricoLeitor(null), null);
  assert.equal(
    obterIdentidadeHistoricoLeitor({
      __historietasLeitorCapitulo: { obraId: "obra-a" },
    }),
    null,
  );
});

test("estado da rota registra e limpa o listener de popstate", () => {
  assert.match(fonteEstadoRota, /window\.history\.replaceState\(/);
  assert.match(
    fonteEstadoRota,
    /window\.addEventListener\("popstate", sincronizarIdentidadeComHistorico\)/,
  );
  assert.match(
    fonteEstadoRota,
    /window\.removeEventListener\("popstate", sincronizarIdentidadeComHistorico\)/,
  );
  assert.match(fonteEstadoRota, /setObraId\(identidade\?\.obraId \|\| ""\)/);
  assert.match(fonteEstadoRota, /setCapituloId\(identidade\?\.capituloId \|\| ""\)/);
});

test("sem obra não há setter, navegação nem rolagem", () => {
  const anterior = globalThis.window;
  const atual = cenario(null);
  globalThis.window = {
    history: { state: null, pushState: () => atual.eventos.push(["push"]) },
    scrollTo: () => atual.eventos.push(["scroll"]),
  };
  try {
    atual.acao.trocarCapitulo("novo");
    assert.deepEqual(atual.eventos, []);
  } finally {
    if (anterior === undefined) delete globalThis.window;
    else globalThis.window = anterior;
  }
});

test("identifica a origem e confirma pushState antes de setter e scrollTo", () => {
  const anterior = globalThis.window;
  const obra = { id: "obra", capitulos: [{ id: "anterior" }, { id: "novo" }] };
  const atual = cenario(obra);
  globalThis.window = {
    history: {
      state: { __NA: true },
      replaceState(...args) {
        atual.eventos.push(["replace", ...args]);
      },
      pushState(...args) {
        atual.eventos.push(["push", ...args]);
      },
    },
    scrollTo(args) {
      atual.eventos.push(["scroll", args]);
    },
  };
  try {
    atual.acao.trocarCapitulo("novo");
    assert.deepEqual(atual.eventos, [
      ["replace", {
        __NA: true,
        __historietasLeitorCapitulo: { obraId: "obra", capituloId: "anterior" },
      }, ""],
      ["href", obra, "novo"],
      [
        "push",
        {
          __historietasLeitorCapitulo: {
            obraId: "obra",
            capituloId: "novo",
          },
        },
        "",
        "/obra/obra/novo",
      ],
      ["setter", "novo"],
      ["scroll", { top: 0, behavior: "smooth" }],
    ]);
  } finally {
    if (anterior === undefined) delete globalThis.window;
    else globalThis.window = anterior;
  }
});

test("navegação externa deixa o Next sincronizar a URL e copiar seu estado interno", () => {
  const anterior = globalThis.window;
  const obra = { id: "obra", capitulos: [{ id: "anterior" }, { id: "novo" }] };
  const atual = cenario(obra);
  const estadoNext = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: "capitulo-1" } };
  let restauracoes = 0;
  let estadoPersistido;
  globalThis.window = {
    history: {
      state: estadoNext,
      replaceState(data) {
        this.state = data;
      },
      pushState(data) {
        // Contrato do patch nativo do App Router: marcadores internos desviam
        // da sincronização; chamadas externas recebem os campos do Next.
        if (!data?.__NA && !data?._N) restauracoes += 1;
        estadoPersistido = { ...data, ...estadoNext };
      },
    },
    scrollTo() {},
  };
  try {
    atual.acao.trocarCapitulo("novo");
    assert.equal(restauracoes, 1);
    assert.deepEqual(estadoPersistido, {
      ...estadoNext,
      __historietasLeitorCapitulo: { obraId: "obra", capituloId: "novo" },
    });
    assert.deepEqual(estadoNext, { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: "capitulo-1" } });
  } finally {
    if (anterior === undefined) delete globalThis.window;
    else globalThis.window = anterior;
  }
});

const propsIniciais = { obraIdInicial: "obra", capituloIdInicial: "c1" };
const ids = identidade => ({ obraId: identidade.obraId, capituloId: identidade.capituloId });

test("histórico rejeita identidades incompletas, vazias e de tipos inválidos", () => {
  for (const estado of [undefined, null, [], "x", 1, {},
    ...[null, [], "x", {}, { obraId: "obra", capituloId: "" },
      { obraId: " ", capituloId: "c1" }, { obraId: 1, capituloId: "c1" },
      { obraId: "obra", capituloId: 1 }, { obraId: "obra", capituloId: "  " }]
      .map(identidade => ({ __historietasLeitorCapitulo: identidade }))]) {
    assert.equal(obterIdentidadeHistoricoLeitor(estado), null);
  }
});

test("trocar, voltar e avançar restauram obra/capítulo e preservam o estado de origem", t => {
  const c = montarLeitor(t);
  const origem = structuredClone(c.window.history.state);
  let identidade = c.render(propsIniciais);
  const obraAtual = { id: "obra", capitulos: [{ id: "c1" }, { id: "c2" }, { id: "c3" }] };
  for (const novo of ["c2", "c3"]) {
    c.criarAcaoTrocaCapituloLeitor({ obraAtual, ...identidade }).trocarCapitulo(novo);
    identidade = c.render();
    assert.equal(identidade.capituloId, novo);
    assert.equal(c.window.location.search, `?obraId=obra&capituloId=${novo}`);
  }
  c.window.history.back();
  assert.deepEqual(ids(c.render()), { obraId: "obra", capituloId: "c2" });
  c.window.history.back();
  assert.deepEqual(ids(c.render()), { obraId: "obra", capituloId: "c1" });
  assert.deepEqual(c.window.history.state, criarEstadoHistoricoLeitor(origem, ids(c.render())));
  c.window.history.forward();
  assert.deepEqual(ids(c.render()), { obraId: "obra", capituloId: "c2" });
  c.window.history.forward();
  assert.deepEqual(ids(c.render()), { obraId: "obra", capituloId: "c3" });
  assert.equal(c.entradas.length, 3);
  assert.equal(c.rolagens.length, 2); // Histórico não força o topo.
});

test("reutilização com novos IDs iniciais não marca a entrada nova com identidade antiga", t => {
  const c = montarLeitor(t, { url: "/obra/a/capitulo/1?obraId=conflito&capituloId=errado" });
  c.render(propsIniciais);
  c.window.history.pushState({ __NA: true, tree: { nova: true } }, "", "/obra/b/capitulo/4");
  const inicio = c.historico.length;
  const nova = { obraId: "obra-b", capituloId: "c4" };
  assert.deepEqual(ids(c.render({ obraIdInicial: nova.obraId, capituloIdInicial: nova.capituloId })), nova);
  assert.deepEqual(c.historico.slice(inicio), [["replace", {
    __NA: true, tree: { nova: true }, __historietasLeitorCapitulo: nova,
  }]]);
  c.window.history.back();
  assert.deepEqual(ids(c.render()), { obraId: "obra", capituloId: "c1" });
});

test("refresh com os mesmos IDs iniciais não desfaz seleção nem histórico restaurado", t => {
  const c = montarLeitor(t);
  const identidade = c.render(propsIniciais);
  identidade.setCapituloId("c2");
  assert.equal(c.render({ ...propsIniciais }).capituloId, "c2");
  c.window.history.pushState(criarEstadoHistoricoLeitor(null, { obraId: "obra-b", capituloId: "c3" }), "", "/ler-capitulo?obraId=obra-b&capituloId=c3");
  c.emitir("popstate", { state: c.window.history.state });
  assert.deepEqual(ids(c.render({ ...propsIniciais })), { obraId: "obra-b", capituloId: "c3" });
});

test("popstate sem identidade usa query somente no leitor interno e limpa rota canônica desconhecida", t => {
  const c = montarLeitor(t);
  c.render(propsIniciais);
  c.window.history.pushState(null, "", "/ler-capitulo?obraId=local-b&capituloId=privado");
  c.emitir("popstate", { state: null });
  assert.deepEqual(ids(c.render()), { obraId: "local-b", capituloId: "privado" });
  c.window.history.pushState({ __NA: true }, "", "/obra/canonica/capitulo/4?obraId=conflito&capituloId=errado");
  const inicio = c.historico.length;
  c.emitir("popstate", { state: { __historietasLeitorCapitulo: { obraId: "" } } });
  assert.deepEqual(ids(c.render()), { obraId: "", capituloId: "" });
  assert.equal(c.historico.length, inicio); // Não certifica a entrada com IDs obsoletos.
});

test("pageshow de BFCache restaura a identidade; pageshow normal não desfaz seleção", t => {
  const c = montarLeitor(t);
  c.render(propsIniciais);
  const restaurada = { obraId: "obra-b", capituloId: "privado" };
  c.window.history.replaceState(criarEstadoHistoricoLeitor({ __NA: true }, restaurada), "", "/ler-capitulo?obraId=obra-b&capituloId=privado");
  c.emitir("pageshow", { persisted: false });
  assert.deepEqual(ids(c.render()), { obraId: "obra", capituloId: "c1" });
  c.emitir("pageshow", { persisted: true });
  assert.deepEqual(ids(c.render()), restaurada);
  c.desmontar();
  assert.equal(c.listeners.get("popstate").size, 0);
  assert.equal(c.listeners.get("pageshow").size, 0);
});

test("troca ignora capítulo atual/inexistente e mantém capítulos privados já disponíveis", t => {
  const c = montarLeitor(t);
  const identidade = c.render(propsIniciais);
  const obraAtual = { id: "obra", capitulos: [{ id: "c1" }, { id: "privado", publicado: false }] };
  const { trocarCapitulo } = c.criarAcaoTrocaCapituloLeitor({ obraAtual, ...identidade });
  const inicio = c.historico.length;
  trocarCapitulo("c1");
  trocarCapitulo("");
  trocarCapitulo("inexistente");
  assert.equal(c.historico.length, inicio);
  assert.deepEqual(c.rolagens, []);
  trocarCapitulo("privado");
  assert.equal(c.render().capituloId, "privado");
  assert.equal(c.entradas.length, 2);
});

test("falha ao criar a entrada não altera o capítulo selecionado", t => {
  const c = montarLeitor(t);
  const identidade = c.render(propsIniciais);
  c.window.history.pushState = () => { throw new Error("History indisponível"); };
  const { trocarCapitulo } = c.criarAcaoTrocaCapituloLeitor({
    obraAtual: { id: "obra", capitulos: [{ id: "c1" }, { id: "c2" }] }, ...identidade,
  });
  assert.throws(() => trocarCapitulo("c2"), /History indisponível/);
  assert.equal(c.render().capituloId, "c1");
  assert.deepEqual(c.rolagens, []);
});

test("query interna prevalece sobre marcação antiga divergente no popstate", t => {
  const c = montarLeitor(t);
  c.render(propsIniciais);
  c.window.history.pushState(criarEstadoHistoricoLeitor({ __NA: true }, {
    obraId: "obra", capituloId: "c1",
  }), "", "/ler-capitulo?obraId=local&capituloId=privado");
  c.emitir("popstate", { state: c.window.history.state });
  assert.deepEqual(ids(c.render()), { obraId: "local", capituloId: "privado" });
  assert.deepEqual(c.obterIdentidadeHistoricoLeitor(c.window.history.state), {
    obraId: "local", capituloId: "privado",
  });
});

test("acionamento repetido antes do render mantém uma única entrada e origem correta", t => {
  const c = montarLeitor(t);
  const identidade = c.render(propsIniciais);
  const { trocarCapitulo } = c.criarAcaoTrocaCapituloLeitor({
    obraAtual: { id: "obra", capitulos: [{ id: "c1" }, { id: "c2" }] }, ...identidade,
  });
  trocarCapitulo("c2");
  trocarCapitulo("c2");
  c.render();
  assert.equal(c.entradas.length, 2);
  assert.equal(c.rolagens.length, 1);
  c.window.history.back();
  assert.equal(c.render().capituloId, "c1");
});

test("popstate canônico usa a identidade marcada e ignora query conflitante", t => {
  const c = montarLeitor(t, { url: "/obra/slug/capitulo/1?obraId=errada&capituloId=errado" });
  c.render(propsIniciais);
  const destino = { obraId: "outra-obra", capituloId: "c4" };
  c.window.history.pushState(criarEstadoHistoricoLeitor({ __NA: true }, destino), "", "/obra/outra/capitulo/4?obraId=errada&capituloId=errado");
  c.emitir("popstate", { state: c.window.history.state });
  assert.deepEqual(ids(c.render()), destino);
});
