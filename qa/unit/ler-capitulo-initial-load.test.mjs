import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-initial-load.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const fonteMockada = fonte
  .replace('import { useEffect } from "react";', "const useEffect = (...args) => globalThis.__leitorInicial.useEffect(...args);")
  .replace('import { supabase } from "../../../lib/supabase/client";', "const supabase = { auth: { getUser: () => globalThis.__leitorInicial.getUser() } };")
  .replace('import { idObraSupabaseValido } from "../../../lib/utils";', "const idObraSupabaseValido = (...args) => globalThis.__leitorInicial.idValido(...args);")
  .replace(/import \{\s*carregarObrasLocaisNormalizadas,\s*obterAutorIdSeguro,\s*salvarObrasPreservandoContas,\s*usuarioPodeAbrirObraNoLeitor,\s*\} from "\.\.\/lib\/ler-capitulo-local-storage";/, `
const carregarObrasLocaisNormalizadas = (...args) => globalThis.__leitorInicial.carregarLocal(...args);
const obterAutorIdSeguro = (obra) => obra.autorId;
const salvarObrasPreservandoContas = (...args) => globalThis.__leitorInicial.salvar(...args);
const usuarioPodeAbrirObraNoLeitor = (obra, userId) => obra.publicado || Boolean(userId && obra.autorId === userId);
`)
  .replace(/import \{\s*aplicarInteracoesCapitulosSupabase,\s*carregarObraSupabase,\s*\} from "\.\.\/lib\/ler-capitulo-work-read-loader";/, `
const aplicarInteracoesCapitulosSupabase = (...args) => globalThis.__leitorInicial.interacoes(...args);
const carregarObraSupabase = (...args) => globalThis.__leitorInicial.carregarRemoto(...args);
`);
const js = typescript.transpileModule(fonteMockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { useLerCapituloInitialLoad: executarInicializacao } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function cenario({ userId = "", obras = [], remoto = null, busca = "?obraId=obra&capituloId=cap", erro = false, aguardarAuth = false } = {}, teste) {
  const anteriorWindow = globalThis.window;
  const eventos = [];
  let timer;
  let liberarAuth;
  globalThis.window = { location: { search: busca }, setTimeout(callback, atraso) { eventos.push(["timer", atraso]); timer = callback; } };
  const dependencias = {
    useEffect(callback, deps) { eventos.push(["dependencias", deps]); dependencias.cleanup = callback(); },
    async getUser() {
      eventos.push(["getUser"]);
      if (aguardarAuth) await new Promise((resolve) => { liberarAuth = resolve; });
      if (erro) throw new Error("auth indisponível");
      return { data: { user: userId ? { id: userId } : null } };
    },
    carregarLocal(id) { eventos.push(["local", id]); return obras; },
    idValido(id) { return id === "obra"; },
    async carregarRemoto(...args) { eventos.push(["remoto", ...args]); return remoto; },
    async interacoes(obra, id) { eventos.push(["interacoes", obra.id, id]); return { ...obra, interacoes: true }; },
    salvar(...args) { eventos.push(["salvar", ...args]); },
  };
  globalThis.__leitorInicial = dependencias;
  const setters = Object.fromEntries(["setObraId", "setCapituloId", "setObras", "setCarregando"].map((nome) => [nome, (valor) => eventos.push([nome, valor])]));
  try {
    executarInicializacao(setters);
    await teste({ eventos, deps: dependencias, timer: () => timer(), liberarAuth: () => liberarAuth() });
  } finally {
    if (anteriorWindow === undefined) delete globalThis.window;
    else globalThis.window = anteriorWindow;
    delete globalThis.__leitorInicial;
  }
}

const obra = (id, autorId, publicado = true) => ({ id, autorId, publicado, capitulos: [{ id: "publicado", publicado: true }, { id: "rascunho", publicado: false }] });

test("hook mantém efeito vazio, responsabilidades e página proprietária dos estados", () => {
  const inicio = fonte.indexOf("  useEffect(() => {");
  const fim = fonte.indexOf("  }, []);", inicio) + "  }, []);".length;
  const efeito = fonte.slice(inicio, fim).replace(
    /    \/\/ Os setters vêm de useState[^\n]*\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n/,
    "",
  );
  assert.equal(createHash("sha256").update(efeito).digest("hex"), "382ac9a87aed8fca1786de267b38b4ef97989a39421f77e227d47ea7235e8368");
  assert.match(pagina, /useLerCapituloInitialLoad\(\{\s*setObraId,\s*setCapituloId,\s*setObras,\s*setCarregando,/);
  assert.doesNotMatch(pagina, /async function carregarDados\(/);
  assert.match(fonte, /async function carregarDados\(/);
  assert.match(fonte, /\}, \[\]\);/);
  assert.match(fonte, /window\.setTimeout\([\s\S]*?\}, 0\)/);
  assert.match(fonte, /return \(\) => \{\s*cancelado = true;/);
  assert.doesNotMatch(fonte, /\.(?:insert|update|delete|upsert)\s*\(/);
});

test("visitante vê somente obras acessíveis e capítulos publicados", async () => {
  const local = obra("obra", "autor");
  const privado = obra("privado", "autor", false);
  await cenario({ obras: [local, privado], remoto: local }, async ({ eventos, timer }) => {
    timer();
    await tick();
    assert.deepEqual(eventos.filter(([nome]) => nome === "setObraId" || nome === "setCapituloId"), [["setObraId", "obra"], ["setCapituloId", "cap"]]);
    const solicitado = eventos.find(([nome]) => nome === "remoto");
    assert.deepEqual(solicitado[2].capitulos.map((item) => item.id), ["publicado"]);
    assert.ok(!eventos.some(([nome]) => nome === "interacoes"));
    assert.deepEqual(eventos.find(([nome]) => nome === "setObras")[1], [local]);
    assert.ok(eventos.findIndex(([nome]) => nome === "salvar") < eventos.findIndex(([nome]) => nome === "setObras"));
    assert.deepEqual(eventos.at(-1), ["setCarregando", false]);
  });
});

test("autor conserva capítulos privados e obra local se remoto não existir", async () => {
  const local = obra("obra", "autor", false);
  await cenario({ userId: "autor", obras: [local] }, async ({ eventos }) => {
    await tick();
    assert.deepEqual(eventos.find(([nome]) => nome === "remoto"), ["remoto", "obra", local, "autor"]);
    assert.deepEqual(eventos.find(([nome]) => nome === "interacoes"), ["interacoes", "obra", "autor"]);
    assert.equal(eventos.find(([nome]) => nome === "setObras")[1][0].capitulos.length, 2);
  });
});

test("remoto acessível substitui local e aplica interações antes de persistir", async () => {
  const local = obra("obra", "autor");
  const remoto = { ...obra("obra", "autor"), fonte: "remota" };
  await cenario({ userId: "leitor", obras: [local, obra("outra", "autor")], remoto }, async ({ eventos }) => {
    await tick();
    const salvas = eventos.find(([nome]) => nome === "salvar")[1];
    assert.equal(salvas[0].fonte, "remota");
    assert.equal(salvas[0].interacoes, true);
    assert.deepEqual(salvas.map((item) => item.id), ["obra", "outra"]);
    assert.ok(eventos.findIndex(([nome]) => nome === "interacoes") < eventos.findIndex(([nome]) => nome === "salvar"));
  });
});

test("obra válida sem remoto é removida para visitante; sem parâmetro não consulta", async () => {
  const local = obra("obra", "autor");
  await cenario({ obras: [local] }, async ({ eventos }) => {
    await tick();
    assert.deepEqual(eventos.find(([nome]) => nome === "setObras")[1], []);
  });
  await cenario({ obras: [local], busca: "" }, async ({ eventos, timer }) => {
    timer();
    await tick();
    assert.ok(!eventos.some(([nome]) => nome === "remoto"));
    assert.deepEqual(eventos.find(([nome]) => nome === "setObraId"), ["setObraId", ""]);
  });
});

test("erro limpa obras e termina carregamento; cancelamento impede setters", async () => {
  await cenario({ erro: true }, async ({ eventos }) => {
    await tick();
    assert.deepEqual(eventos.slice(-2), [["setObras", []], ["setCarregando", false]]);
  });
  await cenario({ obras: [obra("obra", "autor")], aguardarAuth: true }, async ({ eventos, deps, timer, liberarAuth }) => {
    deps.cleanup();
    timer();
    liberarAuth();
    await tick();
    assert.ok(eventos.some(([nome]) => nome === "salvar"));
    assert.ok(!eventos.some(([nome]) => nome.startsWith("set")));
  });
});
