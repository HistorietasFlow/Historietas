import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-initial-load.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const estadoCarregamento = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-loaded-data-state.ts");
const erroCarregamento = ler("../../app/ler-capitulo/components/ler-capitulo-load-error.tsx");
const mockada = fonte
  .replace('import { useEffect, useRef, useState } from "react";', "const useEffect = (...args) => globalThis.__leitorInicial.useEffect(...args); const useRef = (...args) => globalThis.__leitorInicial.useRef(...args); const useState = (...args) => globalThis.__leitorInicial.useState(...args);")
  .replace(/import \{\s*execucaoIdentidadeLeitorEstaAtual,[\s\S]*?\} from "\.\.\/lib\/ler-capitulo-auth-identity";/, "const execucaoIdentidadeLeitorEstaAtual = (...args) => globalThis.__leitorInicial.identidadeAtual(...args);")
  .replace('import { idObraSupabaseValido } from "../../../lib/utils";', "const idObraSupabaseValido = (...args) => globalThis.__leitorInicial.idValido(...args);")
  .replace(/import \{\s*carregarObrasLocaisNormalizadas,[\s\S]*?\} from "\.\.\/lib\/ler-capitulo-local-storage";/, `
const carregarObrasLocaisNormalizadas = (...args) => globalThis.__leitorInicial.carregarLocal(...args);
const obterAutorIdSeguro = (obra) => obra.autorId;
const salvarObrasPreservandoContas = (...args) => globalThis.__leitorInicial.salvar(...args);
const usuarioPodeAbrirObraNoLeitor = (obra, userId) => obra.publicado || Boolean(userId && obra.autorId === userId);
`)
  .replace(/import \{\s*aplicarInteracoesCapitulosSupabase,[\s\S]*?\} from "\.\.\/lib\/ler-capitulo-work-read-loader";/, `
const aplicarInteracoesCapitulosSupabase = (...args) => globalThis.__leitorInicial.interacoes(...args);
const carregarObraSupabase = (...args) => globalThis.__leitorInicial.carregarRemoto(...args);
`);
const js = typescript.transpileModule(mockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { useLerCapituloInitialLoad: executarInicializacao } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const tick = () => new Promise((resolve) => setImmediate(resolve));
const adiado = () => {
  let resolver;
  let rejeitar;
  const promise = new Promise((resolve, reject) => {
    resolver = resolve;
    rejeitar = reject;
  });
  return { promise, resolver, rejeitar };
};

async function cenario({
  userId = "",
  versao = 0,
  obras = [],
  remoto = null,
  remotoPromise,
  carregarRemoto,
  busca = "?obraId=obra&capituloId=cap",
  pathname = "/ler-capitulo",
  obraIdInicial = "",
  capituloIdInicial = "",
  autenticacaoCarregada = true,
} = {}, teste) {
  const anteriorWindow = globalThis.window;
  const eventos = [];
  const efeitos = [];
  const timers = [];
  const refs = [];
  let indiceRef = 0;
  const identidadeRef = { current: { usuarioId: userId, versao } };
  globalThis.window = {
    location: { search: busca, pathname },
    setTimeout(callback, atraso) { eventos.push(["timer", atraso]); timers.push(callback); },
  };
  globalThis.__leitorInicial = {
    useEffect(callback, deps) { efeitos.push({ callback, deps }); },
    useState() { return [null, (valor) => eventos.push(["setIdentidadeDados", valor])]; },
    useRef(valorInicial) {
      const indiceAtual = indiceRef;
      indiceRef += 1;
      refs[indiceAtual] ||= { current: valorInicial };
      return refs[indiceAtual];
    },
    identidadeAtual({ cancelada, identidadeEsperada, identidadeAtual }) {
      return !cancelada && identidadeEsperada.versao === identidadeAtual.versao && identidadeEsperada.usuarioId === identidadeAtual.usuarioId;
    },
    carregarLocal(id) { eventos.push(["local", id]); return obras; },
    idValido(id) { return id === "obra"; },
    async carregarRemoto(...args) {
      eventos.push(["remoto", ...args]);
      return carregarRemoto ? carregarRemoto(...args) : remotoPromise ? remotoPromise : remoto;
    },
    async interacoes(obra, id) { eventos.push(["interacoes", obra.id, id]); return { ...obra, interacoes: id }; },
    salvar(...args) { eventos.push(["salvar", ...args]); },
  };
  const setters = Object.fromEntries(["setObraId", "setCapituloId", "setObras", "setCarregando", "setErroCarregamento"].map((nome) => [nome, (valor) => eventos.push([nome, valor])]));
  try {
    function render(versaoCarregamento = 0, usuarioId = userId) {
      indiceRef = 0;
      return executarInicializacao({
        autenticacaoCarregada,
        usuarioIdLogado: usuarioId,
        identidadeAutenticadaLeitorRef: identidadeRef,
        versaoCarregamento,
        obraIdInicial,
        capituloIdInicial,
        ...setters,
      });
    }

    const retorno = render();
    await teste({ eventos, efeitos, timers, identidadeRef, retorno, render });
  } finally {
    if (anteriorWindow === undefined) delete globalThis.window;
    else globalThis.window = anteriorWindow;
    delete globalThis.__leitorInicial;
  }
}

const obra = (id, autorId, publicado = true) => ({ id, autorId, publicado, capitulos: [{ id: "publicado", publicado: true }, { id: "rascunho", publicado: false }] });

test("carregamento espera autenticação e delega identidade aplicada", async () => {
  assert.match(pagina, /const \{ identidadeDadosAplicada \} = useLerCapituloInitialLoad\(\{/);
  assert.match(fonte, /if \(!autenticacaoCarregada\) \{\s*return;/);
  assert.match(fonte, /execucaoIdentidadeLeitorEstaAtual/);
  assert.match(fonte, /setIdentidadeDadosAplicada\(identidadeEsperada\)/);
  await cenario({ autenticacaoCarregada: false }, async ({ efeitos }) => {
    assert.equal(efeitos[0].callback(), undefined);
  });
});

test("estado de carregamento oferece retry e a pagina separa erro de not found", () => {
  assert.match(estadoCarregamento, /const \[erroCarregamento, setErroCarregamento\] = useState\(false\)/);
  assert.match(estadoCarregamento, /setVersaoCarregamento\(\(versaoAtual\) => versaoAtual \+ 1\)/);
  assert.match(erroCarregamento, /role="alert"/);
  assert.match(erroCarregamento, /Tentar novamente/);
  assert.ok(
    pagina.indexOf("if (erroCarregamentoInicial && (!obraAtual || !capituloAtual))") <
      pagina.indexOf("if (!obraAtual || !capituloAtual)"),
  );
});

test("visitante mantém fluxo público sem interações de conta", async () => {
  const local = obra("obra", "autor");
  await cenario({ obras: [local], remoto: local }, async ({ efeitos, eventos, timers }) => {
    efeitos[0].callback();
    timers[0]();
    await tick();
    assert.ok(!eventos.some(([nome]) => nome === "interacoes"));
    assert.deepEqual(eventos.find(([nome]) => nome === "setObras")[1], [local]);
    assert.deepEqual(
      eventos.find(([nome, valor]) => nome === "setIdentidadeDados" && valor)?.[1],
      { usuarioId: "", versao: 0 },
    );
    assert.deepEqual(eventos.at(-1), ["setCarregando", false]);
  });
});

test("rota canônica preserva os dados públicos iniciais enquanto o lifecycle confirma a fonte", async () => {
  const inicial = obra("obra", "autor");
  await cenario({
    busca: "",
    pathname: "/obra/slug-publico/capitulo/1",
    obraIdInicial: "obra",
    capituloIdInicial: "publicado",
    remoto: inicial,
  }, async ({ efeitos, eventos, timers }) => {
    efeitos[0].callback();
    timers[0]();
    await tick();
    assert.deepEqual(eventos.find(([nome]) => nome === "setObraId"), ["setObraId", "obra"]);
    assert.deepEqual(eventos.find(([nome]) => nome === "setCapituloId"), ["setCapituloId", "publicado"]);
    assert.ok(!eventos.some(([nome, valor]) => nome === "setCarregando" && valor === true));
    assert.deepEqual(eventos.find(([nome]) => nome === "setObras")?.[1], [inicial]);
    assert.deepEqual(eventos.at(-1), ["setCarregando", false]);
  });
});

test("conta carrega storage e interações apenas com seu próprio identificador", async () => {
  const local = obra("obra", "autor");
  await cenario({ userId: "usuario-b", versao: 2, obras: [local], remoto: local }, async ({ efeitos, eventos }) => {
    efeitos[0].callback();
    await tick();
    assert.deepEqual(eventos.find(([nome]) => nome === "local"), ["local", "usuario-b"]);
    assert.deepEqual(eventos.find(([nome]) => nome === "interacoes"), ["interacoes", "obra", "usuario-b"]);
    assert.equal(eventos.find(([nome]) => nome === "setObras")[1][0].interacoes, "usuario-b");
    assert.deepEqual(eventos.find(([nome]) => nome === "salvar").slice(-1), ["usuario-b"]);
  });
});

test("resposta assíncrona da conta A é descartada depois de B assumir", async () => {
  const remotoA = adiado();
  const localA = obra("obra", "autor");
  await cenario({ userId: "usuario-a", versao: 1, obras: [localA], remotoPromise: remotoA.promise }, async ({ efeitos, eventos, identidadeRef }) => {
    const cleanup = efeitos[0].callback();
    identidadeRef.current = { usuarioId: "usuario-b", versao: 2 };
    cleanup();
    remotoA.resolver(localA);
    await tick();
    assert.ok(!eventos.some(([nome]) => nome === "salvar"));
    assert.ok(!eventos.some(([nome]) => nome === "setObras"));
    assert.ok(!eventos.some(([nome, valor]) => nome === "setIdentidadeDados" && valor));
  });
});

test("identidade divergente não inicia nem aplica o carregamento", async () => {
  await cenario({ userId: "usuario-a", versao: 1 }, async ({ efeitos, eventos, identidadeRef }) => {
    identidadeRef.current = { usuarioId: "usuario-b", versao: 2 };
    assert.equal(efeitos[0].callback(), undefined);
    assert.deepEqual(eventos, []);
  });
});

test("ausencia real conclui o carregamento sem marcar erro temporario", async () => {
  await cenario({ remoto: null }, async ({ efeitos, eventos }) => {
    efeitos[0].callback();
    await tick();
    assert.deepEqual(eventos.find(([nome]) => nome === "setObras"), ["setObras", []]);
    assert.ok(!eventos.some(([nome, valor]) => nome === "setErroCarregamento" && valor === true));
    assert.ok(eventos.some(([nome, valor]) => nome === "setIdentidadeDados" && valor?.usuarioId === ""));
  });
});

test("falha remota preserva estado util e expoe erro com retry", async () => {
  const local = obra("obra", "autor");
  await cenario({
    obras: [local],
    carregarRemoto: async () => {
      throw new Error("rede indisponivel");
    },
  }, async ({ efeitos, eventos }) => {
    efeitos[0].callback();
    await tick();
    const atualizacaoObras = eventos.find(([nome]) => nome === "setObras")?.[1];
    assert.equal(typeof atualizacaoObras, "function");
    assert.deepEqual(atualizacaoObras([]), [{
      ...local,
      capitulos: [local.capitulos[0]],
    }]);
    const existente = obra("existente", "autor");
    assert.deepEqual(atualizacaoObras([existente]), [existente]);
    assert.ok(eventos.some(([nome, valor]) => nome === "setErroCarregamento" && valor === true));
    assert.ok(!eventos.some(([nome, valor]) => nome === "setIdentidadeDados" && valor?.usuarioId === ""));
    assert.match(pagina, /erroCarregamentoInicial && \(!obraAtual \|\| !capituloAtual\)/);
    assert.match(pagina, /onTentarNovamente=\{tentarCarregamentoInicialNovamente\}/);
  });
});

test("retry bem-sucedido vence uma resposta antiga da mesma identidade", async () => {
  const primeira = adiado();
  const segunda = adiado();
  let chamada = 0;
  const remotoAtual = obra("obra", "autor");
  await cenario({
    userId: "usuario-b",
    versao: 2,
    carregarRemoto: () => {
      chamada += 1;
      return chamada === 1 ? primeira.promise : segunda.promise;
    },
  }, async ({ efeitos, eventos, render }) => {
    const cleanupPrimeira = efeitos[0].callback();
    cleanupPrimeira();
    render(1);
    efeitos[1].callback();
    segunda.resolver(remotoAtual);
    await tick();
    primeira.resolver(obra("obsoleta", "autor"));
    await tick();
    const aplicacoes = eventos.filter(([nome, valor]) =>
      nome === "setObras" && Array.isArray(valor),
    );
    assert.equal(aplicacoes.length, 1);
    assert.equal(aplicacoes[0][1][0].id, "obra");
    assert.equal(eventos.filter(([nome]) => nome === "interacoes").length, 1);
    assert.equal(eventos.filter(([nome]) => nome === "salvar").length, 1);
  });
});

test("retry com nova falha permanece recuperavel", async () => {
  let chamada = 0;
  await cenario({
    carregarRemoto: async () => {
      chamada += 1;
      throw new Error(`falha ${chamada}`);
    },
  }, async ({ efeitos, eventos, render }) => {
    efeitos[0].callback();
    await tick();
    render(1);
    efeitos[1].callback();
    await tick();
    assert.equal(
      eventos.filter(([nome, valor]) => nome === "setErroCarregamento" && valor === true).length,
      2,
    );
    assert.equal(
      eventos.filter(([nome, valor]) => nome === "setCarregando" && valor === false).length,
      2,
    );
  });
});

test("troca de conta durante erro ou retry invalida a execucao anterior", async () => {
  const remotoA = adiado();
  await cenario({
    userId: "usuario-a",
    versao: 1,
    carregarRemoto: () => remotoA.promise,
  }, async ({ efeitos, eventos, identidadeRef }) => {
    const cleanup = efeitos[0].callback();
    identidadeRef.current = { usuarioId: "usuario-b", versao: 2 };
    cleanup();
    remotoA.rejeitar(new Error("falha tardia de A"));
    await tick();
    assert.ok(!eventos.some(([nome, valor]) => nome === "setErroCarregamento" && valor === true));
    assert.ok(!eventos.some(([nome]) => nome === "setObras"));
  });
});
