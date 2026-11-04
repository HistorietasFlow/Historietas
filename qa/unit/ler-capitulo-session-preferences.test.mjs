import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-session-preferences.ts");
const fonteEstado = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-session-preferences-state.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const mockada = fonte
  .replace('import { useEffect } from "react";', "const useEffect = (...args) => globalThis.__sessaoLeitor.useEffect(...args);")
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
  globalThis.window = {
    setTimeout(callback, atraso) { const id = ++proximoTimer; eventos.push(["timer", id, atraso]); timers.set(id, callback); return id; },
    clearTimeout(id) { eventos.push(["clear", id]); timers.delete(id); },
  };
  globalThis.__sessaoLeitor = {
    useEffect(callback, deps) { efeitos.push({ callback, deps }); },
    perfil(id) { eventos.push(["perfil", id]); return opcoes.perfilPromise || Promise.resolve({ userId: id, nome: "Ana", avatar: "foto" }); },
    ler(id) { eventos.push(["ler", id]); return { tamanhoFonte: 5, mostrarLinhaProgresso: true }; },
    salvar(...args) { eventos.push(["salvar", ...args]); },
  };
  const { useLerCapituloSessionPreferences: executarSessao } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const setters = Object.fromEntries(["setPerfilComentarioLeitor", "setTamanhoFonte", "setMostrarLinhaProgresso", "setPreferenciasCarregadas"].map((nome) => [nome, (valor) => eventos.push([nome, valor])]));
  try {
    executarSessao({
      usuarioIdLogado: opcoes.usuarioId || "",
      tamanhoFonte: 3,
      mostrarLinhaProgresso: false,
      preferenciasCarregadas: Boolean(opcoes.carregadas),
      ...setters,
    });
    await teste({ eventos, efeitos, timers });
  } finally {
    if (janelaAnterior === undefined) delete globalThis.window;
    else globalThis.window = janelaAnterior;
    delete globalThis.__sessaoLeitor;
  }
}

test("preferências deixam autenticação sob responsabilidade do lifecycle dedicado", async () => {
  assert.doesNotMatch(fonte, /supabase\.auth|getUser|onAuthStateChange/);
  assert.match(pagina, /useLerCapituloAuthIdentityLifecycle\(\{/);
  assert.match(pagina, /useLerCapituloSessionPreferences\(\{\s*usuarioIdLogado,/);
  assert.doesNotMatch(pagina, /useLerCapituloSessionPreferences\(\{[\s\S]*?setUsuarioIdLogado,/);
  assert.match(fonteEstado, /const \[usuarioIdLogado, setUsuarioIdLogado\] = useState\(""\);/);
  await cenario({ usuarioId: "usuario", carregadas: true }, async ({ efeitos }) => {
    assert.deepEqual(efeitos.map((efeito) => efeito.deps), [
      ["usuario"],
      ["usuario"],
      [true, 3, false, "usuario"],
    ]);
  });
});

test("perfil é resetado para visitante e resposta antiga é cancelada", async () => {
  await cenario({}, async ({ efeitos, eventos, timers }) => {
    efeitos[0].callback();
    timers.get(1)();
    assert.deepEqual(eventos.at(-1), ["setPerfilComentarioLeitor", { userId: "", nome: "Usuário", avatar: "" }]);
  });

  let resolver;
  const perfilPromise = new Promise((resolve) => { resolver = resolve; });
  await cenario({ usuarioId: "conta-a", perfilPromise }, async ({ efeitos, eventos }) => {
    const cleanup = efeitos[0].callback();
    cleanup();
    resolver({ userId: "conta-a", nome: "Ana", avatar: "" });
    await tick();
    assert.deepEqual(eventos, [["perfil", "conta-a"]]);
  });
});

test("preferências preservam leitura, cleanup e persistência existentes", async () => {
  await cenario({ usuarioId: " conta " }, async ({ efeitos, eventos, timers }) => {
    const cleanup = efeitos[1].callback();
    timers.get(1)();
    assert.deepEqual(eventos.slice(1), [
      ["ler", " conta "],
      ["setTamanhoFonte", 5],
      ["setMostrarLinhaProgresso", true],
      ["setPreferenciasCarregadas", true],
    ]);
    cleanup();
    assert.deepEqual(eventos.at(-1), ["clear", 1]);
  });
  await cenario({ usuarioId: " conta ", carregadas: true }, async ({ efeitos, eventos }) => {
    efeitos[2].callback();
    assert.deepEqual(eventos, [["salvar", { tamanhoFonte: 3, mostrarLinhaProgresso: false, versaoTamanhoFonte: 2 }, " conta "]]);
  });
});
