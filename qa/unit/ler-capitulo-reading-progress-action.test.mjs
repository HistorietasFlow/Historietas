import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-reading-progress-action.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const persistencia = ler("../../app/ler-capitulo/lib/ler-capitulo-interaction-persistence.ts");
const js = typescript.transpileModule(fonte, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { criarAcaoProgressoLeituraCapitulo } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

function cenario({
  lido = false,
  userId = "usuario",
  userIdRecuperado = userId,
  login = true,
  sucesso = true,
  excecao = false,
  obraPresente = true,
  capituloPresente = true,
  obraNaLista = true,
  bloqueado = false,
} = {}) {
  const eventos = [];
  const estados = { salvando: false, mensagem: "mensagem anterior" };
  const capitulos = [
    { id: "c1", titulo: "Primeiro", lido: true, lidoEm: "2026-01-01T00:00:00.000Z" },
    { id: "c2", titulo: "Segundo", lido, lidoEm: lido ? "2026-02-01T00:00:00.000Z" : "" },
    { id: "c3", titulo: "Terceiro", lido: true, lidoEm: "2026-03-01T00:00:00.000Z" },
  ];
  const obraAtual = { id: "obra", titulo: "Obra", capitulos, ultimoCapituloLidoId: "c3", ultimaLeituraEm: capitulos[2].lidoEm, progressoLeitura: lido ? 100 : 67 };
  const outraObra = { id: "outra", titulo: "Outra", capitulos: [] };
  const obras = obraNaLista ? [obraAtual, outraObra] : [outraObra];
  const dependencias = {
    obraAtual: obraPresente ? obraAtual : null,
    capituloAtual: capituloPresente ? capitulos[1] : null,
    obras,
    usuarioIdLogado: userId,
    numeroCapitulo: 2,
    lidoCapituloSalvandoRef: { current: bloqueado },
    async exigirLogin(mensagem) { eventos.push(["login", mensagem]); return login; },
    async obterUsuarioLogadoIdAtual() { eventos.push(["usuario"]); return userIdRecuperado; },
    normalizarObra(obra, index) { eventos.push(["normalizar", obra.id, index]); return { ...obra }; },
    calcularProgressoLeitura(lista) { eventos.push(["calcular"]); return Math.round(lista.filter((capitulo) => capitulo.lido).length / lista.length * 100); },
    salvarObras(lista) { eventos.push(["salvarObras", lista]); },
    async salvarProgressoLeituraSupabase(...args) {
      eventos.push(["sincronizar", ...args]);
      if (excecao) throw new Error("erro inesperado");
      return sucesso;
    },
    async marcarNotificacaoCapituloComoLidaSupabase(...args) { eventos.push(["notificacao", ...args]); },
    async registrarAtividadeDiarioLeitor(args) { eventos.push(["diario", args]); return true; },
    setLidoCapituloSalvando(valor) { estados.salvando = valor; eventos.push(["salvando", valor]); },
    setMensagemAcao(valor) { estados.mensagem = valor; eventos.push(["mensagem", valor]); },
  };
  return { eventos, estados, dependencias, acao: criarAcaoProgressoLeituraCapitulo(dependencias), obraAtual };
}

test("a ação mantém corpo literal e a página continua proprietária de estados e persistências", () => {
  const acao = fonte.slice(fonte.indexOf("  async function alternarLido() {"), fonte.indexOf("  return { alternarLido };")).trimEnd();
  assert.equal(createHash("sha256").update(acao).digest("hex"), "a79265423ad2bf530bdbebbbcae2556705bc8ab8777bf7c3d47832a5f6aef91f");
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-reading-progress-action";/);
  assert.match(pagina, /criarAcaoProgressoLeituraCapitulo\(\{[\s\S]*?obras,[\s\S]*?lidoCapituloSalvandoRef,[\s\S]*?salvarObras,[\s\S]*?salvarProgressoLeituraSupabase,[\s\S]*?setMensagemAcao,/);
  assert.doesNotMatch(pagina, /async function alternarLido\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-interaction-persistence";/);
  assert.match(persistencia, /export async function salvarProgressoLeituraSupabase\(/);
  assert.doesNotMatch(pagina, /async function salvarProgressoLeituraSupabase\(/);
  assert.match(pagina, /const lidoCapituloSalvandoRef = useRef\(false\)/);
  assert.match(pagina, /const \[lidoCapituloSalvando, setLidoCapituloSalvando\] = useState\(false\)/);
  assert.match(pagina, /alternarLido=\{alternarLido\}/);
  assert.doesNotMatch(fonte, /\b(?:useState|useEffect|useRef|supabase|localStorage)\b/);
});

test("guards de obra, capítulo, bloqueio, login e usuário evitam mutações", async () => {
  for (const opcoes of [{ obraPresente: false }, { capituloPresente: false }, { bloqueado: true }]) {
    const atual = cenario(opcoes);
    await atual.acao.alternarLido();
    assert.deepEqual(atual.eventos, []);
  }
  let atual = cenario({ login: false });
  await atual.acao.alternarLido();
  assert.deepEqual(atual.eventos, [["login", "Entre na sua conta para marcar este capítulo como lido."]]);
  atual = cenario({ userId: "" });
  await atual.acao.alternarLido();
  assert.deepEqual(atual.eventos, [["login", "Entre na sua conta para marcar este capítulo como lido."], ["usuario"]]);
});

test("marcar lido atualiza dados antes da sincronização e registra efeitos sociais", async () => {
  const atual = cenario({ userId: "", userIdRecuperado: "recuperado" });
  const antes = Date.now();
  await atual.acao.alternarLido();
  const salvo = atual.eventos.find((e) => e[0] === "salvarObras")[1];
  const obra = salvo[0];
  const capitulo = obra.capitulos[1];
  assert.equal(capitulo.lido, true);
  assert.ok(Date.parse(capitulo.lidoEm) >= antes && Date.parse(capitulo.lidoEm) <= Date.now());
  assert.equal(obra.ultimoCapituloLidoId, "c2");
  assert.equal(obra.ultimaLeituraEm, capitulo.lidoEm);
  assert.equal(obra.progressoLeitura, 100);
  assert.equal(salvo[1].id, "outra");
  assert.equal(atual.obraAtual.capitulos[1].lido, false);
  assert.ok(atual.eventos.findIndex((e) => e[0] === "salvarObras") < atual.eventos.findIndex((e) => e[0] === "sincronizar"));
  assert.deepEqual(atual.eventos.find((e) => e[0] === "sincronizar"), ["sincronizar", obra, "c2", true]);
  assert.deepEqual(atual.eventos.find((e) => e[0] === "notificacao"), ["notificacao", "recuperado", "obra", "c2"]);
  assert.deepEqual(atual.eventos.find((e) => e[0] === "diario")[1], {
    userId: "recuperado", tipo: "leu_capitulo", obra, capituloId: "c2",
    visibilidade: "publico", texto: "Leu Segundo",
    metadata: { capitulo_titulo: "Segundo", capitulo_numero: 2, progresso_obra: 100, origem: "botao_lido" },
  });
  assert.equal(atual.estados.mensagem, "");
  assert.equal(atual.estados.salvando, false);
  assert.equal(atual.dependencias.lidoCapituloSalvandoRef.current, false);
});

test("desmarcar encontra o último capítulo lido restante e não registra efeitos sociais", async () => {
  const atual = cenario({ lido: true });
  await atual.acao.alternarLido();
  const obra = atual.eventos.find((e) => e[0] === "salvarObras")[1][0];
  assert.equal(obra.capitulos[1].lido, false);
  assert.equal(obra.capitulos[1].lidoEm, "");
  assert.equal(obra.ultimoCapituloLidoId, "c3");
  assert.equal(obra.ultimaLeituraEm, "2026-03-01T00:00:00.000Z");
  assert.equal(obra.progressoLeitura, 67);
  assert.deepEqual(atual.eventos.find((e) => e[0] === "sincronizar"), ["sincronizar", obra, "c2", false]);
  assert.ok(!atual.eventos.some((e) => e[0] === "notificacao" || e[0] === "diario"));
});

test("desmarcar o último capítulo lido limpa referência, data e progresso", async () => {
  const atual = cenario({ lido: true });
  atual.obraAtual.capitulos[0].lido = false;
  atual.obraAtual.capitulos[2].lido = false;
  await atual.acao.alternarLido();
  const obra = atual.eventos.find((e) => e[0] === "salvarObras")[1][0];
  assert.equal(obra.ultimoCapituloLidoId, "");
  assert.equal(obra.ultimaLeituraEm, "");
  assert.equal(obra.progressoLeitura, 0);
});

test("falha de sincronização restaura a lista anterior e não emite efeitos sociais", async () => {
  const atual = cenario({ sucesso: false });
  await atual.acao.alternarLido();
  const salvamentos = atual.eventos.filter((e) => e[0] === "salvarObras");
  assert.equal(salvamentos.length, 2);
  assert.equal(salvamentos[1][1], atual.dependencias.obras);
  assert.equal(atual.estados.mensagem, "Não foi possível atualizar o status de leitura agora.");
  assert.equal(atual.estados.salvando, false);
  assert.equal(atual.dependencias.lidoCapituloSalvandoRef.current, false);
  assert.ok(!atual.eventos.some((e) => e[0] === "notificacao" || e[0] === "diario"));
});

test("obra ausente da lista e exceção liberam o bloqueio conforme fluxo original", async () => {
  let atual = cenario({ obraNaLista: false });
  await atual.acao.alternarLido();
  assert.equal(atual.estados.salvando, false);
  assert.equal(atual.dependencias.lidoCapituloSalvandoRef.current, false);
  assert.ok(!atual.eventos.some((e) => e[0] === "salvarObras" || e[0] === "sincronizar"));
  atual = cenario({ excecao: true });
  await assert.rejects(atual.acao.alternarLido(), /erro inesperado/);
  assert.equal(atual.estados.salvando, false);
  assert.equal(atual.dependencias.lidoCapituloSalvandoRef.current, false);
});
