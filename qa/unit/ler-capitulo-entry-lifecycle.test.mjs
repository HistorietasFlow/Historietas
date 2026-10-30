import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-entry-lifecycle.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const social = ler("../../app/ler-capitulo/lib/ler-capitulo-social-persistence.ts");
const mockada = fonte
  .replace('import { useEffect } from "react";', 'const useEffect = (...args) => globalThis.__entradaLeitor.useEffect(...args);')
  .replace('import { idObraSupabaseValido } from "../../../lib/utils";', 'const idObraSupabaseValido = (...args) => globalThis.__entradaLeitor.idValido(...args);');
const js = typescript.transpileModule(mockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const tick = () => new Promise((resolve) => setImmediate(resolve));
const adiado = () => {
  let resolver;
  const promise = new Promise((resolve) => { resolver = resolve; });
  return { promise, resolver };
};
const capitulo = { id: "cap-1", titulo: "Capítulo 1", lido: false };
const obra = { id: "obra-1", titulo: "Minha obra", progressoLeitura: 0, ultimoCapituloLidoId: "", capitulos: [capitulo] };

test("corpos e dependências dos dois efeitos são preservados literalmente", () => {
  const efeitos = [...fonte.matchAll(/^  useEffect\(\(\) => \{[\s\S]*?^  \}, \[[^\n]+\]\);/gm)]
    .map(([efeito]) => efeito.replace(/^    \/\/ (?:Ref, setter|Ref e helpers)[^\n]*\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n/gm, ""));
  assert.equal(efeitos.length, 2);
  assert.deepEqual(efeitos.map((efeito) => createHash("sha256").update(efeito).digest("hex")), [
    "b28e4f33bdb6ddab077a1183e6210e7ac760aef8765a31b300d643f18ea30829",
    "c430ae65c59c6c57f3d0dd5824fce73684f5df3404c60e60688d6669733514c7",
  ]);
});

async function cenario(opcoes, teste) {
  const efeitos = [];
  const eventos = [];
  const visualizacao = { current: opcoes.visualizacao || "" };
  const atividade = { current: opcoes.atividade || "" };
  let metricas = { totalVisualizacoes: opcoes.totalAtual ?? 10, totalCurtidas: 2 };
  globalThis.__entradaLeitor = {
    useEffect(callback, deps) { efeitos.push({ callback, deps }); },
    idValido(id) { return id !== "invalido"; },
  };
  const hooks = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const dados = {
    capituloAtual: opcoes.capitulo === undefined ? capitulo : opcoes.capitulo,
    obraAtual: opcoes.obra === undefined ? obra : opcoes.obra,
    usuarioIdLogado: opcoes.usuario === undefined ? "usuario-1" : opcoes.usuario,
    numeroCapitulo: 3,
    statusAcesso18: opcoes.status || "permitido",
    visualizacaoCapituloRegistradaRef: visualizacao,
    atividadeDiarioRegistradaRef: atividade,
    setMetricasCapitulo(atualizar) { metricas = atualizar(metricas); eventos.push(["metricas", metricas]); },
    incrementarVisualizacaoCapituloSupabase(id) { eventos.push(["visualizacao", id]); return opcoes.promiseVisualizacao || Promise.resolve(opcoes.totalRemoto ?? 7); },
    async marcarNotificacaoCapituloComoLidaSupabase(...args) { eventos.push(["notificacao", ...args]); },
    async registrarAtividadeDiarioLeitor(dados) { eventos.push(["diario", dados]); return true; },
  };
  try {
    hooks.useLerCapituloViewRegistration(dados);
    hooks.useLerCapituloEntryActivity(dados);
    await teste({ hooks, dados, efeitos, eventos, visualizacao, atividade });
  } finally {
    delete globalThis.__entradaLeitor;
  }
}

test("dependências e ordem dos efeitos entre comentários e scroll permanecem na página", async () => {
  assert.match(pagina, /import \{ useLerCapituloViewRegistration, useLerCapituloEntryActivity \} from "\.\/hooks\/use-ler-capitulo-entry-lifecycle"/);
  assert.match(pagina, /import \{ useLerCapituloCommentReset \} from "\.\/hooks\/use-ler-capitulo-comment-reset"/);
  assert.match(pagina, /import \{ useLerCapituloScrollProgress \} from "\.\/hooks\/use-ler-capitulo-scroll-progress"/);
  const visualizacao = pagina.indexOf("  useLerCapituloViewRegistration({");
  const comentario = pagina.indexOf("  useLerCapituloCommentReset({", visualizacao);
  const scroll = pagina.indexOf("  useLerCapituloScrollProgress({", comentario);
  const atividade = pagina.indexOf("  useLerCapituloEntryActivity({", scroll);
  assert.ok(visualizacao >= 0 && comentario > visualizacao && scroll > comentario && atividade > scroll);
  assert.doesNotMatch(pagina, /async function registrarVisualizacaoCapituloAtual\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-social-persistence"/);
  assert.match(social, /export async function marcarNotificacaoCapituloComoLidaSupabase\(/);
  assert.match(social, /export async function registrarAtividadeDiarioLeitor\(/);
  assert.doesNotMatch(pagina, /async function (?:marcarNotificacaoCapituloComoLidaSupabase|registrarAtividadeDiarioLeitor)\(/);
  await cenario({}, async ({ efeitos }) => {
    assert.deepEqual(efeitos.map(({ deps }) => deps), [[capitulo, "permitido"], ["usuario-1", obra, capitulo, 3, "permitido"]]);
  });
});

test("visualização exige acesso permitido, capítulo e id válido", async () => {
  for (const opcoes of [{ status: "verificando" }, { status: "bloqueado" }, { capitulo: null }, { capitulo: { ...capitulo, id: "invalido" } }]) {
    await cenario(opcoes, async ({ efeitos, eventos, visualizacao }) => {
      efeitos[0].callback();
      await tick();
      assert.deepEqual(eventos, []);
      assert.equal(visualizacao.current, "");
    });
  }
});

test("visualização registra uma vez por capítulo e preserva o maior total", async () => {
  const pedido = adiado();
  await cenario({ promiseVisualizacao: pedido.promise }, async ({ efeitos, eventos, visualizacao, hooks, dados }) => {
    efeitos[0].callback();
    assert.equal(visualizacao.current, "cap-1");
    efeitos[0].callback();
    assert.deepEqual(eventos, [["visualizacao", "cap-1"]]);
    pedido.resolver(7);
    await tick();
    assert.deepEqual(eventos[1], ["metricas", { totalVisualizacoes: 10, totalCurtidas: 2 }]);
    hooks.useLerCapituloViewRegistration({ ...dados, capituloAtual: { ...capitulo, id: "cap-2" } });
    efeitos[2].callback();
    assert.equal(visualizacao.current, "cap-2");
    assert.equal(eventos[2][1], "cap-2");
  });
  await cenario({ totalAtual: 2, totalRemoto: 8 }, async ({ efeitos, eventos }) => {
    efeitos[0].callback();
    await tick();
    assert.equal(eventos[1][1].totalVisualizacoes, 8);
  });
  await cenario({ promiseVisualizacao: Promise.resolve(null) }, async ({ efeitos, eventos }) => {
    efeitos[0].callback();
    await tick();
    assert.deepEqual(eventos, [["visualizacao", "cap-1"]]);
  });
});

test("atividade exige acesso, usuário, obra e capítulo", async () => {
  for (const opcoes of [{ status: "verificando" }, { status: "bloqueado" }, { usuario: "" }, { obra: null }, { capitulo: null }]) {
    await cenario(opcoes, async ({ efeitos, eventos, atividade }) => {
      efeitos[1].callback();
      assert.deepEqual(eventos, []);
      assert.equal(atividade.current, "");
    });
  }
});

test("entrada marca notificação antes do Diário, com metadata original e sem duplicar", async () => {
  await cenario({}, async ({ efeitos, eventos, atividade, hooks, dados }) => {
    efeitos[1].callback();
    assert.equal(atividade.current, "usuario-1:obra-1:cap-1");
    assert.deepEqual(eventos, [
      ["notificacao", "usuario-1", "obra-1", "cap-1"],
      ["diario", {
        userId: "usuario-1", tipo: "comecou_ler", obra, capituloId: "cap-1", visibilidade: "publico",
        texto: "Começou a ler Minha obra",
        metadata: { capitulo_titulo: "Capítulo 1", capitulo_numero: 3, progresso_obra: 0, origem: "abertura_capitulo" },
      }],
    ]);
    efeitos[1].callback();
    assert.equal(eventos.length, 2);
    hooks.useLerCapituloEntryActivity({ ...dados, usuarioIdLogado: "usuario-2" });
    efeitos[2].callback();
    assert.equal(eventos[2][1], "usuario-2");
    assert.equal(eventos[3][1].userId, "usuario-2");
  });
});

test("obra iniciada por progresso, último capítulo ou capítulo lido só marca notificação", async () => {
  for (const obraIniciada of [
    { ...obra, progressoLeitura: 1 },
    { ...obra, ultimoCapituloLidoId: "cap-1" },
    { ...obra, capitulos: [{ ...capitulo, lido: true }] },
  ]) {
    await cenario({ obra: obraIniciada }, async ({ efeitos, eventos }) => {
      efeitos[1].callback();
      assert.deepEqual(eventos, [["notificacao", "usuario-1", "obra-1", "cap-1"]]);
    });
  }
});
