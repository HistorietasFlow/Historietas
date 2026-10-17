import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-interaction-actions.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const js = typescript.transpileModule(fonte, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { criarAcoesInteracoesCapitulo } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

function cenario({ logado = true, userId = "usuario", curtiu = false, salvo = false, sucesso = true, excecao = false, obra = true, capitulo = true, bloqueioCurtida = false, bloqueioSalvo = false } = {}) {
  const eventos = [];
  const estados = {
    curtidaSalvando: false,
    salvoSalvando: false,
    mensagem: "",
    metricas: { totalCurtidas: curtiu ? 3 : 2, totalSalvos: salvo ? 5 : 4, curtiu, salvo, carregado: false, outro: "preservado" },
  };
  const setter = (campo) => (valor) => {
    estados[campo] = typeof valor === "function" ? valor(estados[campo]) : valor;
    eventos.push(["estado", campo, estados[campo]]);
  };
  const dependencias = {
    obraAtual: obra ? { id: "obra", titulo: "Obra" } : null,
    capituloAtual: capitulo ? { id: "capitulo", titulo: "Capítulo" } : null,
    usuarioIdLogado: userId,
    numeroCapitulo: 7,
    metricasCapitulo: estados.metricas,
    curtidaCapituloSalvandoRef: { current: bloqueioCurtida },
    salvoCapituloSalvandoRef: { current: bloqueioSalvo },
    async exigirLogin(mensagem) { eventos.push(["login", mensagem]); return logado; },
    async obterUsuarioLogadoIdAtual() { eventos.push(["usuario"]); return userId; },
    atualizarCapitulo(dados) { eventos.push(["capitulo", dados]); },
    async salvarRegistroCapituloSupabase(...args) {
      eventos.push(["salvar", ...args]);
      if (excecao) throw new Error("falha");
      return sucesso;
    },
    async recarregarMetricasCapituloAtual() { eventos.push(["recarregar"]); },
    async carregarPerfilComentarioLeitor(userIdAtual) { eventos.push(["perfil", userIdAtual]); return { nome: "Ana" }; },
    async registrarNotificacaoInteracaoCapituloSupabase(args) { eventos.push(["notificacao", args]); return true; },
    criarHrefLeituraCapituloLeitor(obraAtual, capituloId) { return `/obra/${obraAtual.id}/${capituloId}`; },
    async registrarAtividadeDiarioLeitor(args) { eventos.push(["diario", args]); return true; },
    setCurtidaCapituloSalvando: setter("curtidaSalvando"),
    setSalvoCapituloSalvando: setter("salvoSalvando"),
    setMensagemAcao: setter("mensagem"),
    setMetricasCapitulo: setter("metricas"),
  };
  return { eventos, estados, dependencias, acoes: criarAcoesInteracoesCapitulo(dependencias) };
}

test("os corpos originais permanecem literais e a página preserva os estados e a delegação", () => {
  const acoes = fonte.slice(fonte.indexOf("  async function alternarCurtida() {"), fonte.indexOf("  return { alternarCurtida, alternarSalvo };")).trimEnd();
  assert.equal(createHash("sha256").update(acoes).digest("hex"), "a068f9f38242a2c0221e7a56ea1a0b12814b64a699f7b50c3f9a5d350d84eff7");
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-interaction-actions";/);
  assert.match(pagina, /criarAcoesInteracoesCapitulo\(\{[\s\S]*?curtidaCapituloSalvandoRef,[\s\S]*?salvoCapituloSalvandoRef,[\s\S]*?exigirLogin,[\s\S]*?setMetricasCapitulo,/);
  assert.doesNotMatch(pagina, /async function alternarCurtida\(/);
  assert.doesNotMatch(pagina, /async function alternarSalvo\(/);
  assert.match(pagina, /async function alternarLido\(/);
  assert.match(pagina, /async function salvarRegistroCapituloSupabase\(/);
  assert.match(pagina, /const curtidaCapituloSalvandoRef = useRef\(false\)/);
  assert.match(pagina, /const salvoCapituloSalvandoRef = useRef\(false\)/);
  assert.doesNotMatch(fonte, /\b(?:useState|useEffect|useRef|supabase|localStorage)\b/);
});

test("ausência de capítulo, operação em andamento e login recusado não iniciam mutações", async () => {
  for (const opcoes of [{ capitulo: false }, { bloqueioCurtida: true, bloqueioSalvo: true }]) {
    const atual = cenario(opcoes);
    await atual.acoes.alternarCurtida();
    await atual.acoes.alternarSalvo();
    assert.deepEqual(atual.eventos, []);
  }
  const atual = cenario({ logado: false });
  await atual.acoes.alternarCurtida();
  await atual.acoes.alternarSalvo();
  assert.deepEqual(atual.eventos, [
    ["login", "Entre na sua conta para curtir este capítulo."],
    ["login", "Entre na sua conta para salvar este capítulo."],
  ]);
});

test("curtir sincroniza após atualização otimista e notifica; descurtir não notifica", async () => {
  let atual = cenario();
  await atual.acoes.alternarCurtida();
  assert.equal(atual.estados.metricas.curtiu, true);
  assert.equal(atual.estados.metricas.totalCurtidas, 3);
  assert.equal(atual.estados.metricas.outro, "preservado");
  assert.deepEqual(atual.eventos.find((e) => e[0] === "salvar"), ["salvar", "curtidas_capitulos", "capitulo", true]);
  assert.ok(atual.eventos.findIndex((e) => e[0] === "capitulo") < atual.eventos.findIndex((e) => e[0] === "salvar"));
  assert.ok(atual.eventos.findIndex((e) => e[0] === "salvar") < atual.eventos.findIndex((e) => e[0] === "recarregar"));
  assert.deepEqual(atual.eventos.find((e) => e[0] === "notificacao")[1], {
    tipo: "curtida-capitulo", obra: atual.dependencias.obraAtual, capitulo: atual.dependencias.capituloAtual,
    titulo: "Nova curtida no capítulo", mensagem: "Ana curtiu Capítulo.", link: "/obra/obra/capitulo",
  });
  assert.equal(atual.dependencias.curtidaCapituloSalvandoRef.current, false);
  assert.equal(atual.estados.curtidaSalvando, false);
  atual = cenario({ curtiu: true });
  await atual.acoes.alternarCurtida();
  assert.equal(atual.estados.metricas.curtiu, false);
  assert.equal(atual.estados.metricas.totalCurtidas, 2);
  assert.deepEqual(atual.eventos.find((e) => e[0] === "salvar"), ["salvar", "curtidas_capitulos", "capitulo", false]);
  assert.ok(!atual.eventos.some((e) => e[0] === "perfil" || e[0] === "notificacao"));
});

test("salvar registra Diário apenas na ativação e conserva seus metadados", async () => {
  let atual = cenario();
  await atual.acoes.alternarSalvo();
  assert.equal(atual.estados.metricas.salvo, true);
  assert.equal(atual.estados.metricas.totalSalvos, 5);
  assert.deepEqual(atual.eventos.find((e) => e[0] === "salvar"), ["salvar", "salvos_capitulos", "capitulo", true]);
  assert.deepEqual(atual.eventos.find((e) => e[0] === "diario")[1], {
    userId: "usuario", tipo: "salvou_obra", obra: atual.dependencias.obraAtual,
    capituloId: "capitulo", visibilidade: "publico", texto: "Salvou Capítulo",
    metadata: { capitulo_titulo: "Capítulo", capitulo_numero: 7, origem: "salvar_capitulo" },
  });
  assert.equal(atual.dependencias.salvoCapituloSalvandoRef.current, false);
  assert.equal(atual.estados.salvoSalvando, false);
  atual = cenario({ salvo: true });
  await atual.acoes.alternarSalvo();
  assert.equal(atual.estados.metricas.salvo, false);
  assert.equal(atual.estados.metricas.totalSalvos, 4);
  assert.ok(!atual.eventos.some((e) => e[0] === "diario"));
});

test("falhas de sincronização revertem dados locais e métricas, sem efeitos sociais", async () => {
  for (const [metodo, campo, total, mensagem] of [
    ["alternarCurtida", "curtiu", "totalCurtidas", "Não foi possível atualizar a curtida agora."],
    ["alternarSalvo", "salvo", "totalSalvos", "Não foi possível atualizar o capítulo salvo agora."],
  ]) {
    const atual = cenario({ sucesso: false });
    const anterior = atual.estados.metricas[total];
    await atual.acoes[metodo]();
    assert.deepEqual(atual.eventos.filter((e) => e[0] === "capitulo"), [["capitulo", { [campo]: true }], ["capitulo", { [campo]: false }]]);
    assert.equal(atual.estados.metricas[campo], false);
    assert.equal(atual.estados.metricas[total], anterior);
    assert.equal(atual.estados.mensagem, mensagem);
    assert.equal(atual.estados.curtidaSalvando, false);
    assert.equal(atual.estados.salvoSalvando, false);
    assert.ok(!atual.eventos.some((e) => ["notificacao", "diario", "recarregar"].includes(e[0])));
  }
});

test("finally libera bloqueios também em exceção, sem alterar o tratamento original", async () => {
  for (const metodo of ["alternarCurtida", "alternarSalvo"]) {
    const atual = cenario({ excecao: true });
    await assert.rejects(atual.acoes[metodo](), /falha/);
    assert.equal(atual.dependencias.curtidaCapituloSalvandoRef.current, false);
    assert.equal(atual.dependencias.salvoCapituloSalvandoRef.current, false);
    assert.equal(atual.estados.curtidaSalvando, false);
    assert.equal(atual.estados.salvoSalvando, false);
  }
});

test("sem usuário efetivo ou obra não são emitidos efeitos sociais", async () => {
  let atual = cenario({ userId: "" });
  await atual.acoes.alternarCurtida();
  await atual.acoes.alternarSalvo();
  assert.equal(atual.eventos.filter((e) => e[0] === "usuario").length, 2);
  assert.ok(!atual.eventos.some((e) => e[0] === "salvar"));
  atual = cenario({ obra: false });
  await atual.acoes.alternarCurtida();
  await atual.acoes.alternarSalvo();
  assert.ok(!atual.eventos.some((e) => e[0] === "notificacao" || e[0] === "diario"));
});
