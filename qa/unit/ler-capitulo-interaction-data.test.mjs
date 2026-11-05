import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-interaction-data.ts");
const fonteEstado = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comments-state.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const mockada = fonte
  .replace('import { useEffect, useEffectEvent } from "react";', "const useEffect = (...args) => globalThis.__interacaoLeitor.useEffect(...args); const useEffectEvent = (...args) => globalThis.__interacaoLeitor.useEffectEvent(...args);")
  .replace(/import \{\s*execucaoIdentidadeLeitorEstaAtual,[\s\S]*?\} from "\.\.\/lib\/ler-capitulo-auth-identity";/, "const execucaoIdentidadeLeitorEstaAtual = (...args) => globalThis.__interacaoLeitor.identidadeAtual(...args);")
  .replace('import { carregarComentariosCapituloSupabase } from "../lib/ler-capitulo-comments-read-loader";', "const carregarComentariosCapituloSupabase = (...args) => globalThis.__interacaoLeitor.comentarios(...args);")
  .replace('import { aplicarCurtidasComentariosCapitulosLocais } from "../lib/ler-capitulo-local-storage";', "const aplicarCurtidasComentariosCapitulosLocais = (...args) => globalThis.__interacaoLeitor.curtidasLocais(...args);");
const js = typescript.transpileModule(mockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const tick = () => new Promise((resolve) => setImmediate(resolve));
const adiado = () => {
  let resolver;
  const promise = new Promise((resolve) => { resolver = resolve; });
  return { promise, resolver };
};
const vazias = { totalVisualizacoes: 0, totalCurtidas: 0, totalSalvos: 0, totalComentarios: 0, curtiu: false, salvo: false, carregado: false };
const capitulo = { id: "cap-1", curtiu: false, salvo: false };
const locais = { ...vazias, totalVisualizacoes: 3, totalComentarios: 2 };
const remotas = { ...vazias, totalVisualizacoes: 8, totalComentarios: 2, curtiu: true, salvo: true, carregado: true };

async function cenario(opcoes, teste) {
  const janelaAnterior = globalThis.window;
  const eventos = [];
  const efeitos = [];
  const timers = [];
  const refComentarios = { current: opcoes.idCarregado || "" };
  let valorMetricas = opcoes.metricas || vazias;
  let callbackAtual;
  const contexto = {
    useEffect(callback, deps) { efeitos.push({ callback, deps }); },
    useEffectEvent(callback) { callbackAtual = callback; return (...args) => callbackAtual(...args); },
    identidadeAtual({ cancelada, identidadeEsperada, identidadeAtual }) { return !cancelada && identidadeEsperada.versao === identidadeAtual.versao && identidadeEsperada.usuarioId === identidadeAtual.usuarioId; },
    comentarios(...args) { eventos.push(["carregarComentarios", ...args]); return opcoes.comentariosPromise || Promise.resolve([{ id: "comentario" }]); },
    curtidasLocais(...args) { eventos.push(["curtidasLocais", ...args]); return args[0]; },
  };
  globalThis.window = { setTimeout(callback, atraso) { eventos.push(["timer", atraso]); timers.push(callback); } };
  globalThis.__interacaoLeitor = contexto;
  const { useLerCapituloInteractionData: executarInteracao } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const parametros = {
    capituloAtual: opcoes.capitulo === undefined ? capitulo : opcoes.capitulo,
    comentariosCapitulo: opcoes.comentarios || [{ id: "a" }, { id: "b" }],
    usuarioIdLogado: opcoes.usuario === undefined ? "leitor" : opcoes.usuario,
    identidadeDadosAplicada: opcoes.identidadeDadosAplicada === undefined ? { usuarioId: opcoes.usuario === undefined ? "leitor" : opcoes.usuario, versao: 1 } : opcoes.identidadeDadosAplicada,
    identidadeAutenticadaLeitorRef: { current: opcoes.identidadeAtual || { usuarioId: opcoes.usuario === undefined ? "leitor" : opcoes.usuario, versao: 1 } },
    comentariosCapituloCarregadoIdRef: refComentarios,
    curtidaCapituloSalvandoRef: { current: Boolean(opcoes.salvandoCurtida) },
    salvoCapituloSalvandoRef: { current: Boolean(opcoes.salvandoSalvo) },
    setComentariosCapitulo(valor) { eventos.push(["setComentarios", valor]); },
    setComentariosCarregando(valor) { eventos.push(["setCarregando", valor]); },
    setMetricasCapitulo(valor) {
      valorMetricas = typeof valor === "function" ? valor(valorMetricas) : valor;
      eventos.push(["setMetricas", valorMetricas]);
    },
    metricasCapituloVazias: vazias,
    criarMetricasCapituloLocais(...args) {
      eventos.push(["locais", ...args]);
      return { ...locais, totalComentarios: args[1] ?? 0 };
    },
    carregarMetricasCapituloSupabase(...args) { eventos.push(["remotas", ...args]); return opcoes.metricasPromise || Promise.resolve(remotas); },
    atualizarCapitulo(dados) { eventos.push(["atualizar", dados]); },
    TABELA_COMENTARIOS_CAPITULOS_CURTIDAS: "comentarios_capitulos_curtidas",
  };
  try {
    executarInteracao(parametros);
    await teste({ eventos, efeitos, timers, refComentarios, parametros, executarInteracao, definirMetricas: (valor) => { valorMetricas = valor; } });
  } finally {
    if (janelaAnterior === undefined) delete globalThis.window;
    else globalThis.window = janelaAnterior;
    delete globalThis.__interacaoLeitor;
  }
}

test("identidade sem dados aplicados limpa estado de conta e não inicia consultas", async () => {
  await cenario({
    identidadeDadosAplicada: { usuarioId: "usuario-a", versao: 1 },
    identidadeAtual: { usuarioId: "usuario-b", versao: 2 },
  }, async ({ efeitos, eventos, refComentarios }) => {
    efeitos[0].callback();
    efeitos[1].callback();
    efeitos[2].callback();

    assert.equal(refComentarios.current, "");
    assert.ok(!eventos.some(([nome]) => nome === "carregarComentarios"));
    assert.ok(!eventos.some(([nome]) => nome === "remotas"));
    assert.deepEqual(eventos.find(([nome]) => nome === "setComentarios"), ["setComentarios", []]);
    assert.equal(eventos.find(([nome]) => nome === "setMetricas")[1].curtiu, false);
    assert.equal(eventos.find(([nome]) => nome === "setMetricas")[1].salvo, false);
  });
});

test("efeitos, dependências e integração preservam a fronteira original", async () => {
  const inicio = fonte.indexOf("  useEffect(() => {");
  const fim = fonte.lastIndexOf("\n}");
  const corpo = fonte.slice(inicio, fim).replace(
    /    \/\/ (?:O ref e os setters|Helpers de módulo)[^\n]*\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n/g,
    "",
  ).trimEnd();
  assert.match(corpo, /execucaoIdentidadeLeitorEstaAtual/);
  assert.match(pagina, /useLerCapituloInteractionData\(\{[\s\S]*?comentariosCapituloCarregadoIdRef,[\s\S]*?curtidaCapituloSalvandoRef,[\s\S]*?salvoCapituloSalvandoRef,[\s\S]*?atualizarCapitulo,/);
  assert.doesNotMatch(pagina, /const \[comentariosCapitulo, setComentariosCapitulo\]/);
  assert.match(fonteEstado, /const \[comentariosCarregando, setComentariosCarregando\] = useState\(false\);/);
  assert.match(pagina, /const comentariosCapituloCarregadoIdRef = useRef\(""\)/);
  assert.doesNotMatch(pagina, /async function carregarComentariosCapitulo\(/);
  assert.doesNotMatch(pagina, /async function carregarMetricasCapituloAtual\(/);
  assert.match(fonte, /const atualizarCapituloPorMetricas = useEffectEvent\(/);
  await cenario({}, async ({ efeitos, parametros }) => {
    assert.equal(efeitos.length, 3);
    assert.deepEqual(efeitos[0].deps.slice(0, 2), ["cap-1", "leitor"]);
    assert.deepEqual(efeitos[1].deps.slice(0, 2), [capitulo, "leitor"]);
    assert.equal(efeitos[1].deps.includes(2), false);
    assert.deepEqual(efeitos[2].deps.slice(0, 2), ["cap-1", parametros.comentariosCapitulo]);
  });
});

test("sem capítulo limpa comentários no timer e respeita cancelamento", async () => {
  await cenario({ capitulo: null }, async ({ efeitos, eventos, timers }) => {
    efeitos[0].callback();
    assert.deepEqual(eventos, [["timer", 0]]);
    timers[0]();
    assert.deepEqual(eventos.slice(1), [["setComentarios", []], ["setCarregando", false]]);
  });
  await cenario({ capitulo: null }, async ({ efeitos, eventos, timers }) => {
    efeitos[0].callback()();
    timers[0]();
    assert.deepEqual(eventos, [["timer", 0]]);
  });
});

test("comentários carregam com curtidas locais e loading inicial somente por capítulo", async () => {
  const pedido = adiado();
  await cenario({ comentariosPromise: pedido.promise }, async ({ efeitos, eventos, refComentarios }) => {
    efeitos[0].callback();
    assert.deepEqual(eventos[0], ["setCarregando", true]);
    const chamada = eventos[1];
    assert.equal(chamada[0], "carregarComentarios");
    assert.deepEqual(chamada.slice(1, 3), ["cap-1", "leitor"]);
    assert.equal(chamada[3].TABELA_COMENTARIOS_CAPITULOS_CURTIDAS, "comentarios_capitulos_curtidas");
    assert.equal(typeof chamada[3].aplicarCurtidasComentariosCapitulosLocais, "function");
    pedido.resolver([{ id: "novo" }]);
    await tick();
    assert.equal(refComentarios.current, "cap-1");
    assert.deepEqual(eventos.slice(-2), [["setComentarios", [{ id: "novo" }]], ["setCarregando", false]]);
  });
  await cenario({ idCarregado: "cap-1", usuario: "outro" }, async ({ efeitos, eventos }) => {
    efeitos[0].callback();
    await tick();
    assert.equal(eventos[0][0], "carregarComentarios");
    assert.equal(eventos[0][2], "outro");
    assert.ok(!eventos.some(([nome, valor]) => nome === "setCarregando" && valor === true));
  });
});

test("resposta de comentários obsoleta não atualiza estado nem ref", async () => {
  const pedido = adiado();
  await cenario({ comentariosPromise: pedido.promise, idCarregado: "anterior" }, async ({ efeitos, eventos, refComentarios }) => {
    efeitos[0].callback()();
    pedido.resolver([{ id: "tardio" }]);
    await tick();
    assert.equal(refComentarios.current, "anterior");
    assert.ok(!eventos.some(([nome]) => nome === "setComentarios"));
    assert.ok(!eventos.some(([nome, valor]) => nome === "setCarregando" && valor === false));
  });
});

test("métricas respeitam ambas as guardas e resetam sem capítulo", async () => {
  for (const bloqueio of [{ salvandoCurtida: true }, { salvandoSalvo: true }]) {
    await cenario(bloqueio, async ({ efeitos, eventos }) => {
      efeitos[1].callback();
      await tick();
      assert.deepEqual(eventos, []);
    });
  }
  await cenario({ capitulo: null }, async ({ efeitos, eventos }) => {
    efeitos[1].callback();
    assert.deepEqual(eventos, [["setMetricas", vazias]]);
  });
});

test("métricas locais precedem remotas e preservam maiores contadores já aplicados", async () => {
  const pedido = adiado();
  await cenario({ metricasPromise: pedido.promise }, async ({ efeitos, eventos, definirMetricas }) => {
    efeitos[1].callback();
    assert.deepEqual(eventos.slice(0, 3), [["locais", capitulo, 0], ["setMetricas", { ...locais, totalComentarios: 0 }], ["remotas", capitulo, 0]]);
    definirMetricas({ ...locais, totalVisualizacoes: 25, totalComentarios: 7 });
    pedido.resolver(remotas);
    await tick();
    assert.deepEqual(eventos.slice(-2), [["setMetricas", { ...remotas, totalVisualizacoes: 25, totalComentarios: 7 }], ["atualizar", { curtiu: true, salvo: true }]]);
  });
});

test("cancelamento impede métricas tardias e efeito usa callback mais recente", async () => {
  const pedido = adiado();
  await cenario({ metricasPromise: pedido.promise }, async ({ efeitos, eventos }) => {
    efeitos[1].callback()();
    pedido.resolver(remotas);
    await tick();
    assert.equal(eventos.filter(([nome]) => nome === "setMetricas").length, 1);
    assert.ok(!eventos.some(([nome]) => nome === "atualizar"));
  });
  const outro = adiado();
  await cenario({ metricasPromise: outro.promise }, async ({ efeitos, eventos, parametros, executarInteracao }) => {
    efeitos[1].callback();
    executarInteracao({ ...parametros, atualizarCapitulo(dados) { eventos.push(["atualizarRecente", dados]); } });
    outro.resolver(remotas);
    await tick();
    assert.deepEqual(eventos.at(-1), ["atualizarRecente", { curtiu: true, salvo: true }]);
  });
  await cenario({ metricasPromise: Promise.resolve({ ...remotas, curtiu: false, salvo: false }) }, async ({ efeitos, eventos }) => {
    efeitos[1].callback();
    await tick();
    assert.ok(!eventos.some(([nome]) => nome === "atualizar"));
  });
});

test("comentarios carregados atualizam somente o piso local sem repetir a RPC", async () => {
  await cenario({
    idCarregado: "cap-1",
    comentarios: [{ id: "a" }, { id: "b" }, { id: "c" }],
    metricas: { ...vazias, totalComentarios: 1, carregado: true },
  }, async ({ efeitos, eventos }) => {
    efeitos[2].callback();

    assert.equal(eventos.filter(([nome]) => nome === "remotas").length, 0);
    assert.equal(eventos.find(([nome]) => nome === "setMetricas")[1].totalComentarios, 3);
  });

  await cenario({
    idCarregado: "cap-1",
    comentarios: [{ id: "pagina-1" }, { id: "pagina-2" }],
    metricas: { ...vazias, totalComentarios: 7, carregado: true },
  }, async ({ efeitos, eventos }) => {
    efeitos[2].callback();

    assert.equal(eventos.filter(([nome]) => nome === "remotas").length, 0);
    assert.equal(eventos.find(([nome]) => nome === "setMetricas")[1].totalComentarios, 7);
  });
});

test("sincronizacao local ignora comentarios de outro capitulo ou identidade", async () => {
  await cenario({ idCarregado: "cap-anterior" }, async ({ efeitos, eventos }) => {
    efeitos[2].callback();
    assert.equal(eventos.length, 0);
  });

  await cenario({
    idCarregado: "cap-1",
    identidadeDadosAplicada: { usuarioId: "usuario-a", versao: 1 },
    identidadeAtual: { usuarioId: "usuario-b", versao: 2 },
  }, async ({ efeitos, eventos }) => {
    efeitos[2].callback();
    assert.equal(eventos.length, 0);
  });
});
