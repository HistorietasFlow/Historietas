import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-session-preferences.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const mockada = fonte
  .replace('import { useEffect } from "react";', "const useEffect = (...args) => globalThis.__sessaoLeitor.useEffect(...args);")
  .replace('import { supabase } from "../../../lib/supabase/client";', "const supabase = { get auth() { return globalThis.__sessaoLeitor.auth; } };")
  .replace('import { carregarPerfilComentarioLeitor, type PerfilComentarioLeitor } from "../lib/ler-capitulo-comments-read-loader";', "const carregarPerfilComentarioLeitor = (...args) => globalThis.__sessaoLeitor.perfil(...args);")
  .replace('import { carregarPreferenciasLeitura, salvarPreferenciasLeitura } from "../lib/ler-capitulo-reading-preferences";', "const carregarPreferenciasLeitura = (...args) => globalThis.__sessaoLeitor.ler(...args); const salvarPreferenciasLeitura = (...args) => globalThis.__sessaoLeitor.salvar(...args);");
const js = typescript.transpileModule(mockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function cenario(opcoes, teste) {
  const janelaAnterior = globalThis.window;
  const eventos = [];
  const efeitos = [];
  const timers = new Map();
  let proximoTimer = 0;
  let listener;
  const contexto = {
    useEffect(callback, deps) { efeitos.push({ callback, deps }); },
    auth: {
      async getUser() {
        eventos.push(["getUser"]);
        if (opcoes.authPromise) return opcoes.authPromise;
        if (opcoes.authErro) throw new Error("auth");
        return { data: { user: opcoes.authId ? { id: opcoes.authId } : null } };
      },
      onAuthStateChange(callback) {
        eventos.push(["subscribe"]);
        listener = callback;
        return { data: { subscription: { unsubscribe() { eventos.push(["unsubscribe"]); } } } };
      },
    },
    perfil(id) { eventos.push(["perfil", id]); return opcoes.perfilPromise || Promise.resolve({ userId: id, nome: "Ana", avatar: "foto" }); },
    ler(id) { eventos.push(["ler", id]); return { tamanhoFonte: 5, mostrarLinhaProgresso: true }; },
    salvar(...args) { eventos.push(["salvar", ...args]); },
  };
  globalThis.window = {
    setTimeout(callback, atraso) { const id = ++proximoTimer; eventos.push(["timer", id, atraso]); timers.set(id, callback); return id; },
    clearTimeout(id) { eventos.push(["clear", id]); timers.delete(id); },
  };
  globalThis.__sessaoLeitor = contexto;
  const { useLerCapituloSessionPreferences: executarSessao } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const setters = Object.fromEntries(["setUsuarioIdLogado", "setPerfilComentarioLeitor", "setTamanhoFonte", "setMostrarLinhaProgresso", "setPreferenciasCarregadas"].map((nome) => [nome, (valor) => eventos.push([nome, valor])]));
  try {
    executarSessao({
      usuarioIdLogado: opcoes.usuarioId || "",
      tamanhoFonte: 3,
      mostrarLinhaProgresso: false,
      preferenciasCarregadas: Boolean(opcoes.carregadas),
      ...setters,
    });
    await teste({ eventos, efeitos, timers, emitir: (sessao) => listener("SIGNED_IN", sessao) });
  } finally {
    if (janelaAnterior === undefined) delete globalThis.window;
    else globalThis.window = janelaAnterior;
    delete globalThis.__sessaoLeitor;
  }
}

test("página delega ao hook e mantém estados, ordem e dependências", async () => {
  const inicio = fonte.indexOf("  useEffect(() => {");
  const fim = fonte.lastIndexOf("\n}");
  const efeitosOriginais = fonte.slice(inicio, fim).replace(
    /    \/\/ Os setters pertencem à página[^\n]*\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n/g,
    "",
  ).trimEnd();
  assert.equal(createHash("sha256").update(efeitosOriginais).digest("hex"), "76bd3b10767bcbde4bc0a6451d81fd04fade1b68289c919b961fbadf2d4c57d9");
  assert.match(pagina, /import \{ useLerCapituloSessionPreferences \} from "\.\/hooks\/use-ler-capitulo-session-preferences";/);
  assert.match(pagina, /useLerCapituloSessionPreferences\(\{\s*usuarioIdLogado,\s*tamanhoFonte,\s*mostrarLinhaProgresso,\s*preferenciasCarregadas,\s*setUsuarioIdLogado,\s*setPerfilComentarioLeitor,\s*setTamanhoFonte,\s*setMostrarLinhaProgresso,\s*setPreferenciasCarregadas,/);
  assert.match(pagina, /useState<PerfilComentarioLeitor>/);
  assert.match(pagina, /useState<TamanhoFonte>\(3\)/);
  assert.doesNotMatch(pagina, /async function carregarUsuarioLogado\(/);
  assert.doesNotMatch(pagina, /async function carregarPerfilComentario\(/);
  assert.match(fonte, /subscription\.unsubscribe\(\)/);
  assert.doesNotMatch(fonte, /\.(?:insert|update|delete|upsert)\s*\(/);
  await cenario({ usuarioId: "usuario", carregadas: true }, async ({ efeitos }) => {
    assert.deepEqual(efeitos.map((e) => e.deps), [[], ["usuario"], ["usuario"], [true, 3, false, "usuario"]]);
  });
});

test("sessão carrega usuário, observa eventos e limpa assinatura", async () => {
  await cenario({ authId: "primeiro" }, async ({ efeitos, eventos, emitir }) => {
    const cleanup = efeitos[0].callback();
    assert.deepEqual(eventos.slice(0, 2), [["getUser"], ["subscribe"]]);
    await tick();
    assert.deepEqual(eventos.at(-1), ["setUsuarioIdLogado", "primeiro"]);
    emitir({ user: { id: "segundo" } });
    emitir(null);
    assert.deepEqual(eventos.slice(-2), [["setUsuarioIdLogado", "segundo"], ["setUsuarioIdLogado", ""]]);
    cleanup();
    emitir({ user: { id: "tardio" } });
    assert.deepEqual(eventos.at(-1), ["unsubscribe"]);
  });
});

test("falha de autenticação usa vazio e resposta tardia é cancelada", async () => {
  await cenario({ authErro: true }, async ({ efeitos, eventos }) => {
    efeitos[0].callback();
    await tick();
    assert.deepEqual(eventos.at(-1), ["setUsuarioIdLogado", ""]);
  });
  let liberar;
  const authPromise = new Promise((resolve) => { liberar = resolve; });
  await cenario({ authPromise }, async ({ efeitos, eventos }) => {
    const cleanup = efeitos[0].callback();
    cleanup();
    liberar({ data: { user: { id: "tardio" } } });
    await tick();
    assert.ok(!eventos.some(([nome]) => nome === "setUsuarioIdLogado"));
  });
});

test("perfil vazio é resetado no timer e cancelamento impede atualização tardia", async () => {
  await cenario({}, async ({ efeitos, eventos, timers }) => {
    const cleanup = efeitos[1].callback();
    assert.deepEqual(eventos[0], ["timer", 1, 0]);
    timers.get(1)();
    assert.deepEqual(eventos.at(-1), ["setPerfilComentarioLeitor", { userId: "", nome: "Usuário", avatar: "" }]);
    cleanup();
  });
  await cenario({}, async ({ efeitos, eventos, timers }) => {
    efeitos[1].callback()();
    timers.get(1)();
    assert.ok(!eventos.some(([nome]) => nome === "setPerfilComentarioLeitor"));
  });
  await cenario({ usuarioId: "  " }, async ({ efeitos, eventos }) => {
    efeitos[1].callback();
    await tick();
    assert.deepEqual(eventos[0], ["perfil", "  "]);
  });
  let liberar;
  const perfilPromise = new Promise((resolve) => { liberar = resolve; });
  await cenario({ usuarioId: "conta-antiga", perfilPromise }, async ({ efeitos, eventos }) => {
    const cleanup = efeitos[1].callback();
    cleanup();
    liberar({ userId: "conta-antiga", nome: "Ana", avatar: "" });
    await tick();
    assert.deepEqual(eventos, [["perfil", "conta-antiga"]]);
  });
  await cenario({ usuarioId: "conta-nova" }, async ({ efeitos, eventos }) => {
    efeitos[1].callback();
    await tick();
    assert.deepEqual(eventos.at(-1), ["setPerfilComentarioLeitor", { userId: "conta-nova", nome: "Ana", avatar: "foto" }]);
  });
});

test("preferências são lidas no timer por usuário e timer é cancelável", async () => {
  await cenario({ usuarioId: "  " }, async ({ efeitos, eventos }) => {
    assert.equal(efeitos[2].callback(), undefined);
    assert.deepEqual(eventos, []);
  });
  await cenario({ usuarioId: " conta " }, async ({ efeitos, eventos, timers }) => {
    const cleanup = efeitos[2].callback();
    assert.deepEqual(eventos, [["timer", 1, 0]]);
    timers.get(1)();
    assert.deepEqual(eventos.slice(1), [["ler", " conta "], ["setTamanhoFonte", 5], ["setMostrarLinhaProgresso", true], ["setPreferenciasCarregadas", true]]);
    cleanup();
    assert.deepEqual(eventos.at(-1), ["clear", 1]);
  });
  await cenario({ usuarioId: "conta" }, async ({ efeitos, eventos, timers }) => {
    efeitos[2].callback()();
    assert.equal(timers.size, 0);
    assert.ok(!eventos.some(([nome]) => nome === "ler"));
  });
});

test("persistência aguarda carregamento e conserva valores, versão e usuário original", async () => {
  await cenario({ usuarioId: " conta " }, async ({ efeitos, eventos }) => {
    efeitos[3].callback();
    assert.deepEqual(eventos, []);
  });
  await cenario({ usuarioId: " conta ", carregadas: true }, async ({ efeitos, eventos }) => {
    efeitos[3].callback();
    assert.deepEqual(eventos, [["salvar", { tamanhoFonte: 3, mostrarLinhaProgresso: false, versaoTamanhoFonte: 2 }, " conta "]]);
  });
});
