import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
async function importar(fonte) {
  const js = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
}
const { carregarAcessoComentariosCapitulo } = await importar(ler("../../app/ler-capitulo/lib/ler-capitulo-comments-spoiler-access.ts")
  .replace('import { supabase } from "../../../lib/supabase/client";', 'const supabase = { auth: { getUser: () => globalThis.__spoilerDB.auth() }, from: (...args) => globalThis.__spoilerDB.from(...args) };'));
const fonteHook = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comments-spoiler-access.ts");
const { useLerCapituloCommentsSpoilerAccess } = await importar(fonteHook
  .replace('import { useEffect, useMemo, useState } from "react";', 'const { useEffect, useMemo, useState } = { useEffect: (...args) => globalThis.__spoilerHook.effect(...args), useMemo: (...args) => globalThis.__spoilerHook.memo(...args), useState: (...args) => globalThis.__spoilerHook.state(...args) };')
  .replace('import { carregarAcessoComentariosCapitulo } from "../lib/ler-capitulo-comments-spoiler-access";', 'const carregarAcessoComentariosCapitulo = (...args) => globalThis.__spoilerHook.carregar(...args);')
  .replace(/import \{ execucaoIdentidadeLeitorEstaAtual, type IdentidadeAutenticadaLeitor \} from "..\/lib\/ler-capitulo-auth-identity";/,
    'const execucaoIdentidadeLeitorEstaAtual = ({ cancelada, identidadeEsperada: a, identidadeAtual: b }) => !cancelada && a.usuarioId === b.usuarioId && a.versao === b.versao;'));
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("confirma somente a identidade atual, leitura remota exata ou proprietário verificado", async () => {
  const consultas = [];
  let usuario = "A", lido = false, dono = null, erro = null;
  globalThis.__spoilerDB = {
    auth: async () => ({ data: { user: { id: usuario } }, error: null }),
    from(tabela) {
      const passos = [];
      consultas.push({ tabela, passos });
      const cadeia = { select: () => cadeia, eq: (...args) => { passos.push(args); return cadeia; },
        maybeSingle: async () => tabela === "obras" ? { data: dono, error: null } : { data: { lido }, error: erro } };
      return cadeia;
    },
  };
  assert.equal(await carregarAcessoComentariosCapitulo("obra", "cap", ""), false);
  assert.equal(await carregarAcessoComentariosCapitulo("obra", "cap", "B"), false);
  assert.equal(consultas.length, 0);
  assert.equal(await carregarAcessoComentariosCapitulo("obra", "cap", "A"), false);
  assert.deepEqual(consultas[0].passos, [["user_id", "A"], ["obra_id", "obra"], ["capitulo_id", "cap"]]);
  lido = true;
  assert.equal(await carregarAcessoComentariosCapitulo("obra", "cap", "A"), true);
  erro = new Error("rede");
  assert.equal(await carregarAcessoComentariosCapitulo("obra", "cap", "A"), false);
  dono = { user_id: "A" };
  assert.equal(await carregarAcessoComentariosCapitulo("obra", "cap", "A"), true);
  dono = { user_id: "B" };
  assert.equal(await carregarAcessoComentariosCapitulo("obra", "cap", "A"), false);
  delete globalThis.__spoilerDB;
});

function montar() {
  const estados = [], memos = [], efeitos = [], pendentes = [], pedidos = [];
  let s, m, e;
  const listeners = new Map();
  const janelaAnterior = globalThis.window, documentoAnterior = globalThis.document;
  const target = { addEventListener: (nome, fn) => listeners.set(nome, fn), removeEventListener: (nome) => listeners.delete(nome) };
  globalThis.window = target;
  globalThis.document = { ...target, visibilityState: "visible" };
  globalThis.__spoilerHook = {
    state(inicial) { const i = s++; if (!(i in estados)) estados[i] = inicial;
      return [estados[i], (valor) => { estados[i] = typeof valor === "function" ? valor(estados[i]) : valor; }]; },
    memo(fn, deps) { const i = m++; if (!memos[i] || deps.some((d, j) => !Object.is(d, memos[i].deps[j]))) memos[i] = { deps, valor: fn() }; return memos[i].valor; },
    effect(fn, deps) { const i = e++; if (!efeitos[i] || deps.some((d, j) => !Object.is(d, efeitos[i].deps[j]))) {
      pendentes.push(() => { efeitos[i]?.cleanup?.(); efeitos[i] = { deps, cleanup: fn() }; });
    } },
    carregar(...args) { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); pedidos.push({ args, resolve, reject }); return promise; },
  };
  let identidade = { usuarioId: "A", versao: 1 };
  const ref = { current: identidade };
  const params = { obraId: "obra", capituloId: "cap-1", aberto: true, lidoCapituloSalvando: false,
    identidadeDadosAplicada: identidade, identidadeAutenticadaLeitorRef: ref, dadosDaIdentidadeAtual: true, versaoConta: 1 };
  return { params, pedidos, listeners,
    render: function useRender() { s = m = e = 0; const result = useLerCapituloCommentsSpoilerAccess(params); while (pendentes.length) pendentes.shift()(); return result; },
    conta(usuarioId) { identidade = { usuarioId, versao: identidade.versao + 1 }; ref.current = identidade; params.identidadeDadosAplicada = identidade; params.versaoConta++; },
    fechar() { for (const ef of efeitos) ef?.cleanup?.(); globalThis.window = janelaAnterior; globalThis.document = documentoAnterior; delete globalThis.__spoilerHook; },
  };
}

test("cache e capítulo aberto não liberam; revelação é temporária por capítulo e conta", async () => {
  const c = montar();
  try {
    assert.equal(c.render().comentariosLiberados, false);
    c.pedidos[0].resolve(false); await tick();
    assert.equal(c.render().comentariosLiberados, false);
    c.render().revelarComentarios();
    assert.equal(c.render().comentariosLiberados, true);
    c.params.capituloId = "cap-2";
    assert.equal(c.render().comentariosLiberados, false);
    c.params.capituloId = "cap-1";
    assert.equal(c.render().comentariosLiberados, false);
    c.conta("B"); assert.equal(c.render().comentariosLiberados, false);
    c.conta(""); assert.equal(c.render().comentariosLiberados, false);
    c.render().revelarComentarios(); assert.equal(c.render().comentariosLiberados, true);
    c.params.aberto = false; assert.equal(c.render().comentariosLiberados, false);
    c.params.aberto = true; assert.equal(c.render().comentariosLiberados, false);
  } finally { c.fechar(); }
});

test("respostas antigas de conta/capítulo não desbloqueiam; falha e retry por foco são seguros", async () => {
  const c = montar();
  try {
    c.render(); c.conta("B"); c.render(); c.conta("C"); c.render();
    c.pedidos[0].resolve(true); c.pedidos[1].resolve(true); await tick();
    assert.equal(c.render().comentariosLiberados, false);
    c.pedidos[2].resolve(true); await tick(); assert.equal(c.render().comentariosLiberados, true);
    c.listeners.get("focus")(); assert.equal(c.render().comentariosLiberados, false);
    c.pedidos[3].reject(new Error("rede")); await tick(); assert.equal(c.render().comentariosLiberados, false);
    c.listeners.get("focus")(); c.render(); c.pedidos[4].resolve(false); await tick();
    assert.equal(c.render().comentariosLiberados, false);
    c.params.lidoCapituloSalvando = true; c.render();
    assert.equal(c.pedidos.length, 5);
    c.params.lidoCapituloSalvando = false; c.render();
    c.pedidos[5].resolve(true); await tick(); assert.equal(c.render().comentariosLiberados, true);
    c.params.capituloId = "cap-2"; assert.equal(c.render().comentariosLiberados, false);
    const ultimo = c.pedidos.at(-1); c.fechar(); ultimo.resolve(true); await tick();
    assert.equal(c.listeners.size, 0);
  } finally { if (globalThis.__spoilerHook) c.fechar(); }
});

test("perda de confirmação e troca rápida de conta invalidam revelação mesmo com IDs repetidos", async () => {
  const c = montar();
  try {
    c.render().revelarComentarios(); assert.equal(c.render().comentariosLiberados, true);
    c.params.dadosDaIdentidadeAtual = false;
    assert.equal(c.render().comentariosLiberados, false);
    c.params.dadosDaIdentidadeAtual = true;
    assert.equal(c.render().comentariosLiberados, false);
    c.render().revelarComentarios(); assert.equal(c.render().comentariosLiberados, true);
    c.params.versaoConta += 2; // A -> B -> A batido no mesmo render.
    assert.equal(c.render().comentariosLiberados, false);
    c.pedidos[0].resolve(true); await tick();
    assert.equal(c.render().comentariosLiberados, false);
  } finally { c.fechar(); }
});
