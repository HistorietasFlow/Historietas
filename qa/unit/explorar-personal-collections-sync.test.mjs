import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const codigo = readFileSync(
  new URL(
    "../../app/explorar/hooks/use-explorar-personal-collections-sync.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const executavel = codigo.replace(/^import[\s\S]*?from "[^"]+";\n/gm, "");
const injecao = `
const useRef = (...args) => globalThis.__colecoesExplorarTeste.useRef(...args);
const useEffect = (...args) => globalThis.__colecoesExplorarTeste.useEffect(...args);
const obraTemAtividadeLeitura = (...args) => globalThis.__colecoesExplorarTeste.obraTemAtividadeLeitura(...args);
const carregarListaIdsUsuarioExplorar = (...args) => globalThis.__colecoesExplorarTeste.carregarLista(...args);
const salvarListaIdsUsuarioExplorar = (...args) => globalThis.__colecoesExplorarTeste.salvarLista(...args);
const carregarColecoesUsuarioExplorar = (...args) => globalThis.__colecoesExplorarTeste.carregarColecoes(...args);
`;
const javascript = typescript.transpileModule(injecao + executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const modulo = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

const adiar = () => {
  let resolve;
  const promise = new Promise((resolver) => { resolve = resolver; });
  return { promise, resolve };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

function preparar(t) {
  const chamadas = [];
  const estado = {};
  const respostas = [];
  const refs = [];
  let indiceRef = 0;
  let efeito;
  let cleanup;
  const deps = {
    useRef(valor) {
      const indice = indiceRef++;
      refs[indice] ??= { current: valor };
      return refs[indice];
    },
    useEffect(fn) { efeito = fn; },
    obraTemAtividadeLeitura: (obra) => Boolean(obra.lida),
    carregarLista(chave, userId) {
      chamadas.push(["carregarLista", chave, userId]);
      return chave === "favoritas" ? [`local-${userId}`] : [];
    },
    salvarLista(...args) { chamadas.push(["salvarLista", ...args]); },
    carregarColecoes(userId) {
      chamadas.push(["carregarColecoes", userId]);
      return respostas.shift() || Promise.resolve({
        favoritas: [],
        concluidas: [],
        comLeitura: [],
        falhaTemporaria: false,
      });
    },
  };
  globalThis.__colecoesExplorarTeste = deps;
  t.after(() => { delete globalThis.__colecoesExplorarTeste; });

  const props = {
    usuarioIdExplorar: "",
    versaoRetryColecoes: 0,
    obrasCacheLocalRef: { current: [{ id: "cache-lida", lida: true }] },
    FAVORITES_STORAGE_KEY: "favoritas",
    COMPLETED_STORAGE_KEY: "concluidas",
  };
  for (const nome of [
    "ObrasFavoritas", "ObrasConcluidas", "ObrasComLeitura",
    "ColecoesCarregadas", "ErroColecoesExplorar",
  ]) {
    props[`set${nome}`] = (valor) => {
      const resolvido = typeof valor === "function" ? valor(estado[nome]) : valor;
      chamadas.push([`set${nome}`, resolvido]);
      estado[nome] = resolvido;
    };
  }

  function render(alteracoes = {}) {
    cleanup?.();
    Object.assign(props, alteracoes);
    indiceRef = 0;
    modulo.useExplorarPersonalCollectionsSync(props);
    cleanup = efeito?.();
  }

  return { chamadas, estado, respostas, render };
}

test("logout limpa coleções e marca o estado anônimo como carregado", (t) => {
  const c = preparar(t);
  c.render();
  assert.deepEqual(c.estado.ObrasFavoritas, []);
  assert.deepEqual(c.estado.ObrasConcluidas, []);
  assert.deepEqual(c.estado.ObrasComLeitura, []);
  assert.equal(c.estado.ErroColecoesExplorar, false);
  assert.equal(c.estado.ColecoesCarregadas, true);
  assert.equal(c.chamadas.some(([nome]) => nome === "carregarColecoes"), false);
});

test("identidade combina cache e remoto, incluindo leitura fora da amostra", async (t) => {
  const c = preparar(t);
  c.respostas.push(Promise.resolve({
    favoritas: ["remota"],
    concluidas: ["concluida"],
    comLeitura: ["fora-da-primeira-pagina"],
    falhaTemporaria: false,
  }));
  c.render({ usuarioIdExplorar: "A" });
  assert.deepEqual(c.estado.ObrasFavoritas, ["local-A"]);
  assert.deepEqual(c.estado.ObrasComLeitura, ["cache-lida"]);
  await tick();
  assert.deepEqual(c.estado.ObrasFavoritas, ["local-A", "remota"]);
  assert.deepEqual(c.estado.ObrasConcluidas, ["concluida"]);
  assert.deepEqual(c.estado.ObrasComLeitura, [
    "cache-lida",
    "fora-da-primeira-pagina",
  ]);
  assert.equal(c.estado.ColecoesCarregadas, true);
  assert.equal(c.estado.ErroColecoesExplorar, false);
});

test("troca rápida A para B ignora resposta antiga e retry preserva identidade", async (t) => {
  const c = preparar(t);
  const respostaA = adiar();
  const respostaB = adiar();
  c.respostas.push(respostaA.promise, respostaB.promise);
  c.render({ usuarioIdExplorar: "A" });
  c.render({ usuarioIdExplorar: "B" });
  respostaA.resolve({
    favoritas: ["favorita-A"], concluidas: [], comLeitura: [], falhaTemporaria: false,
  });
  await tick();
  assert.notDeepEqual(c.estado.ObrasFavoritas, ["favorita-A"]);
  respostaB.resolve({
    favoritas: ["favorita-B"], concluidas: [], comLeitura: [], falhaTemporaria: true,
  });
  await tick();
  assert.deepEqual(c.estado.ObrasFavoritas, ["local-B", "favorita-B"]);
  assert.equal(c.estado.ErroColecoesExplorar, true);

  c.respostas.push(Promise.resolve({
    favoritas: ["favorita-B-atual"], concluidas: [], comLeitura: [], falhaTemporaria: false,
  }));
  c.render({ versaoRetryColecoes: 1 });
  await tick();
  assert.deepEqual(c.estado.ObrasFavoritas, ["local-B", "favorita-B-atual"]);
  assert.equal(c.estado.ErroColecoesExplorar, false);
  assert.deepEqual(
    c.chamadas.filter(([nome]) => nome === "carregarColecoes").map(([, id]) => id),
    ["A", "B", "B"],
  );
});
