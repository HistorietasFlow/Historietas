import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-initial-load.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const mockada = fonte
  .replace('import { useEffect, useState } from "react";', "const useEffect = (...args) => globalThis.__leitorInicial.useEffect(...args); const useState = (...args) => globalThis.__leitorInicial.useState(...args);")
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
  const promise = new Promise((resolve) => { resolver = resolve; });
  return { promise, resolver };
};

async function cenario({ userId = "", versao = 0, obras = [], remoto = null, remotoPromise, busca = "?obraId=obra&capituloId=cap", autenticacaoCarregada = true } = {}, teste) {
  const anteriorWindow = globalThis.window;
  const eventos = [];
  const efeitos = [];
  const timers = [];
  const identidadeRef = { current: { usuarioId: userId, versao } };
  globalThis.window = {
    location: { search: busca },
    setTimeout(callback, atraso) { eventos.push(["timer", atraso]); timers.push(callback); },
  };
  globalThis.__leitorInicial = {
    useEffect(callback, deps) { efeitos.push({ callback, deps }); },
    useState() { return [null, (valor) => eventos.push(["setIdentidadeDados", valor])]; },
    identidadeAtual({ cancelada, identidadeEsperada, identidadeAtual }) {
      return !cancelada && identidadeEsperada.versao === identidadeAtual.versao && identidadeEsperada.usuarioId === identidadeAtual.usuarioId;
    },
    carregarLocal(id) { eventos.push(["local", id]); return obras; },
    idValido(id) { return id === "obra"; },
    async carregarRemoto(...args) { eventos.push(["remoto", ...args]); return remotoPromise ? remotoPromise : remoto; },
    async interacoes(obra, id) { eventos.push(["interacoes", obra.id, id]); return { ...obra, interacoes: id }; },
    salvar(...args) { eventos.push(["salvar", ...args]); },
  };
  const setters = Object.fromEntries(["setObraId", "setCapituloId", "setObras", "setCarregando"].map((nome) => [nome, (valor) => eventos.push([nome, valor])]));
  try {
    const retorno = executarInicializacao({
      autenticacaoCarregada,
      usuarioIdLogado: userId,
      identidadeAutenticadaLeitorRef: identidadeRef,
      ...setters,
    });
    await teste({ eventos, efeitos, timers, identidadeRef, retorno });
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

test("visitante mantém fluxo público sem interações de conta", async () => {
  const local = obra("obra", "autor");
  await cenario({ obras: [local], remoto: local }, async ({ efeitos, eventos, timers }) => {
    efeitos[0].callback();
    timers[0]();
    await tick();
    assert.ok(!eventos.some(([nome]) => nome === "interacoes"));
    assert.deepEqual(eventos.find(([nome]) => nome === "setObras")[1], [local]);
    assert.deepEqual(eventos.find(([nome]) => nome === "setIdentidadeDados")[1], { usuarioId: "", versao: 0 });
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
    assert.ok(!eventos.some(([nome]) => nome === "setIdentidadeDados"));
  });
});

test("identidade divergente não inicia nem aplica o carregamento", async () => {
  await cenario({ userId: "usuario-a", versao: 1 }, async ({ efeitos, eventos, identidadeRef }) => {
    identidadeRef.current = { usuarioId: "usuario-b", versao: 2 };
    assert.equal(efeitos[0].callback(), undefined);
    assert.deepEqual(eventos, []);
  });
});
