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
  .replace(/import \{\s*execucaoIdentidadeLeitorEstaAtual,[\s\S]*?\} from "\.\.\/lib\/ler-capitulo-auth-identity";/, "const execucaoIdentidadeLeitorEstaAtual = (...args) => globalThis.__sessaoLeitor.identidadeAtual(...args);")
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
  const usuarioId = opcoes.usuarioId ?? "";
  const identidadeRef = {
    current: opcoes.identidadeAtual || {
      usuarioId,
      versao: opcoes.versao ?? 1,
    },
  };
  globalThis.window = {
    setTimeout(callback, atraso) { const id = ++proximoTimer; eventos.push(["timer", id, atraso]); timers.set(id, callback); return id; },
    clearTimeout(id) { eventos.push(["clear", id]); timers.delete(id); },
  };
  globalThis.__sessaoLeitor = {
    useEffect(callback, deps) { efeitos.push({ callback, deps }); },
    perfil(id) { eventos.push(["perfil", id]); return opcoes.perfilPromise || Promise.resolve({ userId: id, nome: "Ana", avatar: "foto" }); },
    identidadeAtual({ cancelada, identidadeEsperada, identidadeAtual }) {
      return !cancelada &&
        identidadeEsperada.usuarioId === identidadeAtual.usuarioId &&
        identidadeEsperada.versao === identidadeAtual.versao;
    },
    ler(id) {
      eventos.push(["ler", id]);
      return opcoes.preferencias || {
        tamanhoFonte: 5,
        mostrarLinhaProgresso: true,
      };
    },
    salvar(...args) { eventos.push(["salvar", ...args]); },
  };
  const { useLerCapituloSessionPreferences: executarSessao } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const setters = Object.fromEntries([
    "setPerfilComentarioLeitor",
    "setTamanhoFonte",
    "setMostrarLinhaProgresso",
    "setPreferenciasCarregadas",
    "setIdentidadePreferenciasAplicada",
  ].map((nome) => [nome, (valor) => eventos.push([nome, valor])]));
  try {
    executarSessao({
      usuarioIdLogado: usuarioId,
      tamanhoFonte: opcoes.tamanhoFonte ?? 3,
      mostrarLinhaProgresso: opcoes.mostrarLinhaProgresso ?? false,
      preferenciasCarregadas: Boolean(opcoes.carregadas),
      identidadePreferenciasAplicada:
        opcoes.identidadeAplicada ?? null,
      identidadeAutenticadaLeitorRef: identidadeRef,
      ...setters,
    });
    await teste({ eventos, efeitos, timers, identidadeRef });
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
  assert.match(fonteEstado, /useState<IdentidadeAutenticadaLeitor \| null>\(null\)/);
  await cenario({
    usuarioId: "usuario",
    carregadas: true,
    identidadeAplicada: { usuarioId: "usuario", versao: 1 },
  }, async ({ efeitos }) => {
    assert.deepEqual(efeitos[0].deps, ["usuario"]);
    assert.deepEqual(efeitos[1].deps, ["usuario"]);
    assert.equal(efeitos[2].deps[2], true);
    assert.equal(efeitos[2].deps[5], "usuario");
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

test("fluxo normal lê antes de habilitar e persiste somente a identidade aplicada", async () => {
  const identidade = { usuarioId: "conta", versao: 1 };
  await cenario({ usuarioId: "conta", identidadeAtual: identidade }, async ({ efeitos, eventos, timers }) => {
    const cleanup = efeitos[1].callback();
    timers.get(1)();
    assert.deepEqual(eventos, [
      ["setPreferenciasCarregadas", false],
      ["setIdentidadePreferenciasAplicada", null],
      ["timer", 1, 0],
      ["ler", "conta"],
      ["setTamanhoFonte", 5],
      ["setMostrarLinhaProgresso", true],
      ["setIdentidadePreferenciasAplicada", identidade],
      ["setPreferenciasCarregadas", true],
    ]);
    cleanup();
    assert.deepEqual(eventos.at(-1), ["clear", 1]);
  });
  await cenario({
    usuarioId: "conta",
    identidadeAtual: identidade,
    identidadeAplicada: identidade,
    carregadas: true,
    tamanhoFonte: 5,
    mostrarLinhaProgresso: true,
  }, async ({ efeitos, eventos }) => {
    efeitos[2].callback();
    assert.deepEqual(eventos, [["salvar", { tamanhoFonte: 5, mostrarLinhaProgresso: true, versaoTamanhoFonte: 2 }, "conta"]]);
  });
});

test("A carregada não é persistida em B antes da leitura de B", async () => {
  await cenario({
    usuarioId: "conta-b",
    identidadeAtual: { usuarioId: "conta-b", versao: 2 },
    identidadeAplicada: { usuarioId: "conta-a", versao: 1 },
    carregadas: true,
    tamanhoFonte: 5,
    mostrarLinhaProgresso: true,
  }, async ({ efeitos, eventos, timers }) => {
    efeitos[2].callback();
    assert.deepEqual(eventos, []);

    efeitos[1].callback();
    assert.deepEqual(eventos.slice(0, 3), [
      ["setPreferenciasCarregadas", false],
      ["setIdentidadePreferenciasAplicada", null],
      ["timer", 1, 0],
    ]);
    assert.ok(!eventos.some(([evento]) => evento === "salvar"));

    timers.get(1)();
    assert.deepEqual(eventos.slice(-5), [
      ["ler", "conta-b"],
      ["setTamanhoFonte", 5],
      ["setMostrarLinhaProgresso", true],
      ["setIdentidadePreferenciasAplicada", { usuarioId: "conta-b", versao: 2 }],
      ["setPreferenciasCarregadas", true],
    ]);
  });
});

test("logout descarta preferências privadas e logout para B carrega somente B", async () => {
  await cenario({
    usuarioId: "",
    identidadeAtual: { usuarioId: "", versao: 2 },
    identidadeAplicada: { usuarioId: "conta-a", versao: 1 },
    carregadas: true,
    tamanhoFonte: 5,
    mostrarLinhaProgresso: true,
    preferencias: { tamanhoFonte: 3, mostrarLinhaProgresso: false },
  }, async ({ efeitos, eventos, timers }) => {
    efeitos[2].callback();
    assert.deepEqual(eventos, []);
    efeitos[1].callback();
    timers.get(1)();
    assert.ok(!eventos.some(([evento]) => evento === "salvar"));
    assert.deepEqual(eventos.slice(-4), [
      ["setTamanhoFonte", 3],
      ["setMostrarLinhaProgresso", false],
      ["setIdentidadePreferenciasAplicada", { usuarioId: "", versao: 2 }],
      ["setPreferenciasCarregadas", true],
    ]);
  });

  await cenario({
    usuarioId: "conta-b",
    identidadeAtual: { usuarioId: "conta-b", versao: 3 },
    preferencias: { tamanhoFonte: 2, mostrarLinhaProgresso: true },
  }, async ({ efeitos, eventos, timers }) => {
    efeitos[1].callback();
    timers.get(1)();
    assert.ok(eventos.some((evento) => evento[0] === "ler" && evento[1] === "conta-b"));
    assert.ok(!eventos.some(([evento]) => evento === "salvar"));
  });
});

test("trocas rápidas e carregamentos atrasados não aplicam identidades antigas", async () => {
  await cenario({
    usuarioId: "conta-a",
    identidadeAtual: { usuarioId: "conta-a", versao: 1 },
  }, async ({ efeitos, eventos, timers, identidadeRef }) => {
    efeitos[1].callback();
    identidadeRef.current = { usuarioId: "conta-b", versao: 2 };
    timers.get(1)();
    assert.deepEqual(eventos.slice(-1), [["ler", "conta-a"]]);
    assert.ok(!eventos.some(([evento, valor]) => evento === "setTamanhoFonte" && valor === 5));
    assert.ok(!eventos.some(([evento, valor]) => evento === "setPreferenciasCarregadas" && valor === true));
  });

  await cenario({
    usuarioId: "conta-b",
    identidadeAtual: { usuarioId: "conta-b", versao: 2 },
  }, async ({ efeitos, eventos, timers, identidadeRef }) => {
    efeitos[1].callback();
    identidadeRef.current = { usuarioId: "conta-c", versao: 3 };
    timers.get(1)();
    assert.deepEqual(eventos.slice(-1), [["ler", "conta-b"]]);
    assert.ok(!eventos.some(([evento, valor]) => evento === "setPreferenciasCarregadas" && valor === true));
  });

  await cenario({
    usuarioId: "conta-c",
    identidadeAtual: { usuarioId: "conta-c", versao: 3 },
    preferencias: { tamanhoFonte: 1, mostrarLinhaProgresso: false },
  }, async ({ efeitos, eventos, timers }) => {
    efeitos[1].callback();
    timers.get(1)();
    assert.ok(eventos.some(([evento, valor]) => evento === "setTamanhoFonte" && valor === 1));
    assert.deepEqual(eventos.at(-1), ["setPreferenciasCarregadas", true]);
  });
});
