import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const identidadeFonte = readFileSync(
  new URL("../../app/ler-capitulo/lib/ler-capitulo-auth-identity.ts", import.meta.url),
  "utf8",
);
const identidadeJs = typescript.transpileModule(identidadeFonte, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const {
  atualizarIdentidadeAutenticadaLeitor,
  execucaoAutenticacaoLeitorEstaAtual,
} = await import(`data:text/javascript;base64,${Buffer.from(identidadeJs).toString("base64")}`);

const fonte = readFileSync(
  new URL("../../app/ler-capitulo/hooks/use-ler-capitulo-auth-identity-lifecycle.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const mockada = fonte
  .replace('import { useCallback, useEffect, useRef, useState } from "react";', "const useCallback = (callback) => callback; const useEffect = (...args) => globalThis.__authLeitor.useEffect(...args); const useRef = (...args) => globalThis.__authLeitor.useRef(...args); const useState = (...args) => globalThis.__authLeitor.useState(...args);")
  .replace('import { supabase } from "../../../lib/supabase/client";', "const supabase = { get auth() { return globalThis.__authLeitor.supabase.auth; } };")
  .replace(/import \{\s*atualizarIdentidadeAutenticadaLeitor,[\s\S]*?\} from "\.\.\/lib\/ler-capitulo-auth-identity";/, "const atualizarIdentidadeAutenticadaLeitor = (...args) => globalThis.__authLeitor.atualizar(...args); const execucaoAutenticacaoLeitorEstaAtual = (...args) => globalThis.__authLeitor.execucaoAtual(...args);");
const js = typescript.transpileModule(mockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
globalThis.__authLeitor = { supabase: { auth: {} } };
const { useLerCapituloAuthIdentityLifecycle } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
const tick = () => new Promise((resolve) => setImmediate(resolve));

function useMontar({ getUser }) {
  const eventos = [];
  let efeito;
  let listener;
  globalThis.__authLeitor = {
    useEffect(callback, deps) { efeito = { callback, deps }; },
    useRef(valor) { return { current: valor }; },
    useState(valor) { return [valor, (novo) => eventos.push(["autenticacao", novo])]; },
    atualizar: atualizarIdentidadeAutenticadaLeitor,
    execucaoAtual: execucaoAutenticacaoLeitorEstaAtual,
    supabase: {
      auth: {
        getUser,
        onAuthStateChange(callback) {
          listener = callback;
          return { data: { subscription: { unsubscribe() { eventos.push(["unsubscribe"]); } } } };
        },
      },
    },
  };
  const retorno = useLerCapituloAuthIdentityLifecycle({
    onIdentidadeMudou() { eventos.push(["mudou"]); },
    setUsuarioIdLogado(usuarioId) { eventos.push(["usuario", usuarioId]); },
  });

  return {
    efeito,
    eventos,
    retorno,
    emitir(usuarioId) { listener("SIGNED_IN", usuarioId === null ? null : { user: { id: usuarioId } }); },
  };
}

test("lifecycle aplica A→B, A→logout e logout→B mantendo a página montada", async () => {
  const atual = useMontar({ getUser: async () => ({ data: { user: { id: "usuario-a" } } }) });
  const cleanup = atual.efeito.callback();
  await tick();

  atual.emitir("usuario-b");
  atual.emitir(null);
  atual.emitir("usuario-b");

  assert.deepEqual(
    atual.eventos.filter(([tipo]) => tipo === "usuario"),
    [["usuario", "usuario-a"], ["usuario", "usuario-b"], ["usuario", ""], ["usuario", "usuario-b"]],
  );
  assert.equal(atual.retorno.identidadeAutenticadaLeitorRef.current.versao, 4);
  cleanup();
  assert.deepEqual(atual.eventos.at(-1), ["unsubscribe"]);
});

test("evento B invalida resposta getUser atrasada de A", async () => {
  let resolver;
  const atual = useMontar({
    getUser: () => new Promise((resolve) => { resolver = resolve; }),
  });
  atual.efeito.callback();
  atual.emitir("usuario-b");
  resolver({ data: { user: { id: "usuario-a" } } });
  await tick();

  assert.deepEqual(
    atual.eventos.filter(([tipo]) => tipo === "usuario"),
    [["usuario", "usuario-b"]],
  );
  assert.deepEqual(atual.retorno.identidadeAutenticadaLeitorRef.current, {
    usuarioId: "usuario-b",
    versao: 1,
  });
});

test("falha de sessao nao e convertida em visitante e pode ser tentada novamente", async () => {
  const atual = useMontar({
    getUser: async () => ({
      data: { user: null },
      error: new Error("auth indisponivel"),
    }),
  });
  atual.efeito.callback();
  await tick();

  assert.ok(!atual.eventos.some(([tipo]) => tipo === "usuario"));
  assert.deepEqual(
    atual.eventos.filter(([tipo]) => tipo === "autenticacao").slice(-2),
    [["autenticacao", false], ["autenticacao", true]],
  );

  atual.retorno.tentarCarregarAutenticacaoNovamente();
  assert.deepEqual(atual.eventos.slice(-3, -1), [
    ["autenticacao", false],
    ["autenticacao", false],
  ]);
  assert.equal(typeof atual.eventos.at(-1)[1], "function");
});
