import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/obra/[slug]/hooks/use-obra-comments-sheet-interactions.ts");
const cliente = ler("../../app/obra/[slug]/ObraDinamicaClient.tsx");
const bodyLock = ler("../../app/obra/[slug]/hooks/use-obra-comments-sheet-body-lock.ts");
const fonteMockada = fonte
  .replace('import { useRef, useState } from "react";', "const useRef = (...args) => globalThis.__obraCommentsSheet.useRef(...args); const useState = (...args) => globalThis.__obraCommentsSheet.useState(...args);")
  .replace(/import \{\s*obterElementoComFocoAtual,\s*restaurarFocoAnterior,\s*\} from "\.\.\/lib\/obra-dialog-focus";/, "const obterElementoComFocoAtual = () => globalThis.__obraCommentsSheet.obterFoco(); const restaurarFocoAnterior = (elemento) => globalThis.__obraCommentsSheet.restaurarFoco(elemento);");
const javascript = typescript.transpileModule(fonteMockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { useObraCommentsSheetInteractions } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

function montarHook({ isDesktop = false } = {}) {
  const windowAnterior = globalThis.window;
  const estados = [];
  const refs = [];
  const eventos = [];
  const timers = new Map();
  let indiceEstado = 0;
  let indiceRef = 0;
  let proximoTimerId = 1;
  const focoAnterior = { id: "acionador", focus() {} };
  const handle = { style: {} };
  const sheet = {
    style: {},
    querySelector(seletor) {
      assert.equal(seletor, "[data-comments-sheet-handle='true']");
      return handle;
    },
  };

  globalThis.window = {
    setTimeout(callback, atraso) {
      const id = proximoTimerId++;
      timers.set(id, callback);
      eventos.push(["setTimeout", id, atraso]);
      return id;
    },
    clearTimeout(id) {
      eventos.push(["clearTimeout", id]);
      timers.delete(id);
    },
  };
  globalThis.__obraCommentsSheet = {
    useState(valorInicial) {
      const indice = indiceEstado++;
      if (!(indice in estados)) estados[indice] = valorInicial;
      return [estados[indice], (novoValor) => {
        estados[indice] = typeof novoValor === "function" ? novoValor(estados[indice]) : novoValor;
      }];
    },
    useRef(valorInicial) {
      const indice = indiceRef++;
      refs[indice] ||= { current: valorInicial };
      return refs[indice];
    },
    obterFoco() {
      eventos.push(["obterFoco"]);
      return focoAnterior;
    },
    restaurarFoco(elemento) {
      eventos.push(["restaurarFoco", elemento]);
    },
  };

  function useRenderHook() {
    indiceEstado = 0;
    indiceRef = 0;
    const retorno = useObraCommentsSheetInteractions({
      isDesktop,
      fecharMenuOrdenacaoComentarios() { eventos.push(["fecharOrdenacao"]); },
      limparRespostaComentario() { eventos.push(["limparResposta"]); },
    });
    retorno.comentariosSheetRef.current = sheet;
    return retorno;
  }

  return {
    eventos,
    executarTimer(id) {
      const callback = timers.get(id);
      assert.equal(typeof callback, "function");
      timers.delete(id);
      callback();
    },
    focoAnterior,
    handle,
    montar: useRenderHook,
    sheet,
    timers,
    toque: (clientY) => ({ touches: [{ clientY }] }),
    desmontar() {
      delete globalThis.__obraCommentsSheet;
      if (windowAnterior === undefined) delete globalThis.window;
      else globalThis.window = windowAnterior;
    },
  };
}

test("abrir salva foco anterior e reseta expansao", () => {
  const cenario = montarHook();
  try {
    let hook = cenario.montar();
    hook.iniciarArrasteComentariosObra(cenario.toque(100));
    hook.moverArrasteComentariosObra(cenario.toque(40));
    hook.finalizarArrasteComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosSheetExpandido, true);
    hook.abrirComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosAbertos, true);
    assert.equal(hook.comentariosSheetExpandido, false);
    assert.deepEqual(cenario.eventos.slice(-2), [["obterFoco"], ["fecharOrdenacao"]]);
  } finally { cenario.desmontar(); }
});

test("fechar limpa expansao ordenacao e resposta e restaura foco", () => {
  const cenario = montarHook();
  try {
    let hook = cenario.montar();
    hook.abrirComentariosObra();
    hook.iniciarArrasteComentariosObra(cenario.toque(100));
    hook.moverArrasteComentariosObra(cenario.toque(40));
    hook.finalizarArrasteComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosSheetExpandido, true);
    hook.fecharComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosAbertos, false);
    assert.equal(hook.comentariosSheetExpandido, false);
    assert.deepEqual(cenario.eventos.slice(-3), [
      ["fecharOrdenacao"], ["limparResposta"], ["restaurarFoco", cenario.focoAnterior],
    ]);
  } finally { cenario.desmontar(); }
});

test("desktop ignora drag", () => {
  const cenario = montarHook({ isDesktop: true });
  try {
    let hook = cenario.montar();
    hook.iniciarArrasteComentariosObra(cenario.toque(100));
    hook.moverArrasteComentariosObra(cenario.toque(20));
    hook.finalizarArrasteComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosSheetExpandido, false);
    assert.deepEqual(cenario.sheet.style, {});
    assert.deepEqual(cenario.handle.style, {});
    assert.equal(cenario.timers.size, 0);
  } finally { cenario.desmontar(); }
});

test("drag para cima expande e drag para baixo retrai", () => {
  const cenario = montarHook();
  try {
    let hook = cenario.montar();
    hook.iniciarArrasteComentariosObra(cenario.toque(100));
    hook.moverArrasteComentariosObra(cenario.toque(40));
    hook.finalizarArrasteComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosSheetExpandido, true);
    hook.iniciarArrasteComentariosObra(cenario.toque(100));
    hook.moverArrasteComentariosObra(cenario.toque(170));
    hook.finalizarArrasteComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosSheetExpandido, false);
  } finally { cenario.desmontar(); }
});

test("drag suficiente fecha quando nao expandido", () => {
  const cenario = montarHook();
  try {
    let hook = cenario.montar();
    hook.abrirComentariosObra();
    hook = cenario.montar();
    hook.iniciarArrasteComentariosObra(cenario.toque(100));
    hook.moverArrasteComentariosObra(cenario.toque(225));
    hook.finalizarArrasteComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosAbertos, false);
    assert.ok(cenario.eventos.some(([evento]) => evento === "limparResposta"));
    assert.ok(cenario.eventos.some(([evento]) => evento === "restaurarFoco"));
  } finally { cenario.desmontar(); }
});

test("protecao pos-drag bloqueia alternancia e limpa timer corretamente", () => {
  const cenario = montarHook();
  try {
    let hook = cenario.montar();
    hook.iniciarArrasteComentariosObra(cenario.toque(100));
    hook.moverArrasteComentariosObra(cenario.toque(110));
    hook.finalizarArrasteComentariosObra();
    const timerId = hook.comentariosDragResetTimerRef.current;
    assert.equal(cenario.timers.size, 1);
    hook.alternarExpansaoComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosSheetExpandido, false);
    hook.iniciarArrasteComentariosObra(cenario.toque(100));
    assert.deepEqual(cenario.eventos.at(-1), ["clearTimeout", timerId]);
    assert.equal(cenario.timers.size, 0);
    assert.equal(hook.comentariosDragResetTimerRef.current, null);
    hook.moverArrasteComentariosObra(cenario.toque(110));
    hook.finalizarArrasteComentariosObra();
    cenario.executarTimer(hook.comentariosDragResetTimerRef.current);
    hook = cenario.montar();
    hook.alternarExpansaoComentariosObra();
    hook = cenario.montar();
    assert.equal(hook.comentariosSheetExpandido, true);
    assert.equal(hook.comentariosDragResetTimerRef.current, null);
  } finally { cenario.desmontar(); }
});

test("cliente delega interacoes e mantem body lock responsavel pelo cleanup final", () => {
  assert.match(cliente, /\} = useObraCommentsSheetInteractions\(\{/);
  assert.match(bodyLock, /window\.clearTimeout\(comentariosDragResetTimerRef\.current\);/);
});
