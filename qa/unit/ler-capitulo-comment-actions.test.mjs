import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-actions.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const controles = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-controls.ts");
const persistencia = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-persistence.ts");
const js = typescript.transpileModule(fonte, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { criarAcoesComentariosCapitulo } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

function cenario({ usuario = "u1", comentarios = [], bloqueado = false, falhaDelete = false, falhaInsert = false, salvo = { id: "novo", criado_em: "2026-01-01" } } = {}) {
  const eventos = [];
  const estados = { status: "", mensagem: "", perfil: null, digitado: "", comentarios, metricas: { totalComentarios: comentarios.length, carregado: false }, mostrar: false };
  const setter = (campo) => (valor) => {
    estados[campo] = typeof valor === "function" ? valor(estados[campo]) : valor;
    eventos.push(["estado", campo, estados[campo]]);
  };
  const dependencias = {
    supabase: {
      from(tabela) {
        eventos.push(["from", tabela]);
        return {
          delete() {
            eventos.push(["delete"]);
            const cadeia = {
              eq(chave, valor) { eventos.push(["eq", chave, valor]); return cadeia; },
              then(resolve) { return Promise.resolve({ error: falhaDelete ? new Error("delete") : null }).then(resolve); },
            };
            return cadeia;
          },
          async insert(payload) {
            eventos.push(["insert", payload]);
            return { error: falhaInsert ? new Error("insert") : null };
          },
        };
      },
    },
    obraId: "obra", capituloId: "capitulo",
    obraAtual: { id: "obra", titulo: "Obra" },
    capituloAtual: { id: "capitulo", titulo: "Capítulo" },
    comentariosCapitulo: comentarios,
    router: { push(href) { eventos.push(["push", href]); } },
    iniciarAcaoComentariosCapitulo(chave) { eventos.push(["iniciar", chave]); return !bloqueado; },
    finalizarAcaoComentariosCapitulo(chave) { eventos.push(["finalizar", chave]); },
    async obterUsuarioLogadoIdAtual() { eventos.push(["usuario"]); return usuario; },
    criarLoginHrefLeitor(obraId, capituloId) { return `/login?obra=${obraId}&capitulo=${capituloId}`; },
    criarHrefLeituraCapituloLeitor(obra, capituloId) { return `/obra/${obra.id}/${capituloId}`; },
    async carregarPerfilComentarioLeitor(userId) { eventos.push(["perfil", userId]); return { userId, nome: "Ana", avatar: "avatar" }; },
    async salvarComentarioCapituloSupabase(...args) { eventos.push(["salvar", ...args]); return salvo; },
    obterTextoRegistroLeitor(registro, chave) { return typeof registro?.[chave] === "string" ? registro[chave].trim() : ""; },
    async registrarNotificacaoInteracaoCapituloSupabase(args) { eventos.push(["notificacao", args]); return true; },
    salvarCurtidaComentarioCapituloLocal(...args) { eventos.push(["storage", ...args]); },
    TABELA_COMENTARIOS_CAPITULOS_CURTIDAS: "comentarios_capitulos_curtidas",
    atualizarCapitulo(dados) { eventos.push(["capitulo", dados]); },
    setComentarioStatus: setter("status"), setMensagemAcao: setter("mensagem"),
    setPerfilComentarioLeitor: setter("perfil"), setComentarioDigitado: setter("digitado"),
    setComentariosCapitulo: setter("comentarios"), setMetricasCapitulo: setter("metricas"),
    setMostrarComentario: setter("mostrar"),
  };
  return { eventos, estados, acoes: criarAcoesComentariosCapitulo(dependencias) };
}

const comentario = (id, pai = "", userId = "u1", curtidas = []) => ({
  id, comentarioPaiId: pai, userId, curtidas, nome: "Ana", avatar: "", texto: "texto", criadoEm: "", meuComentario: true,
});

test("os corpos originais permanecem literais e a página continua proprietária dos estados", () => {
  const helper = fonte.slice(fonte.indexOf("function obterIdsComentarioCapituloComRespostas("), fonte.indexOf("export function criarAcoesComentariosCapitulo")).trimEnd();
  const acoes = fonte.slice(fonte.indexOf("  async function enviarComentarioCapitulo("), fonte.indexOf("  return {\n    enviarComentarioCapitulo,")).trimEnd();
  assert.equal(createHash("sha256").update(helper).digest("hex"), "250c99149662b3e72bee319f003bfbea58c579fca59807c15429695b8555851b");
  assert.equal(createHash("sha256").update(acoes).digest("hex"), "7eaf38a256e15ed6219e03253de46eca56808122f07c673ecb0c981d46da2fbe");
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-comment-actions";/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-comment-controls";/);
  assert.match(pagina, /criarControlesComentariosCapitulo\(\{[\s\S]*?acoesComentariosCapituloRef,[\s\S]*?setMostrarComentario,/);
  assert.match(controles, /function iniciarAcaoComentariosCapitulo\(/);
  assert.match(controles, /function finalizarAcaoComentariosCapitulo\(/);
  assert.match(pagina, /criarAcoesComentariosCapitulo\(\{[\s\S]*?supabase,[\s\S]*?comentariosCapitulo,[\s\S]*?setComentariosCapitulo,[\s\S]*?setMetricasCapitulo,/);
  for (const nome of ["enviarComentarioCapitulo", "removerComentarioCapitulo", "alternarCurtidaComentarioCapitulo"]) {
    assert.doesNotMatch(pagina, new RegExp(`async function ${nome}\\(`));
    assert.match(fonte, new RegExp(`async function ${nome}\\(`));
  }
  assert.match(pagina, /const \[comentariosCapitulo, setComentariosCapitulo\] = useState/);
  assert.match(pagina, /import \{[\s\S]*?salvarComentarioCapituloSupabase,[\s\S]*?TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,[\s\S]*?\} from "\.\/lib\/ler-capitulo-comment-persistence";/);
  assert.doesNotMatch(pagina, /async function salvarComentarioCapituloSupabase\(/);
  assert.match(persistencia, /export async function salvarComentarioCapituloSupabase\(/);
  assert.match(pagina, /salvarComentarioCapituloSupabase,/);
  assert.doesNotMatch(fonte, /\b(?:useState|useEffect|useRef)\b/);
});

test("ações bloqueadas não executam efeitos e visitante é direcionado ao login", async () => {
  let atual = cenario({ bloqueado: true });
  assert.equal(await atual.acoes.enviarComentarioCapitulo("post", "texto"), false);
  assert.deepEqual(atual.eventos, [["iniciar", "enviar-comentario-capitulo:post"]]);
  atual = cenario({ usuario: "" });
  assert.equal(await atual.acoes.enviarComentarioCapitulo("post", "texto"), false);
  assert.equal(atual.estados.mensagem, "Entre na sua conta para comentar este capítulo.");
  assert.ok(atual.eventos.some((evento) => evento[0] === "push" && evento[1] === "/login?obra=obra&capitulo=capitulo"));
  assert.equal(atual.eventos.at(-1)[0], "finalizar");
});

test("comentário vazio e falha ao salvar respeitam mensagens e cleanup", async () => {
  let atual = cenario();
  assert.equal(await atual.acoes.enviarComentarioCapitulo("post", "  "), false);
  assert.equal(atual.estados.status, "Escreva um comentário antes de enviar.");
  assert.ok(!atual.eventos.some((evento) => evento[0] === "salvar"));
  atual = cenario({ salvo: null });
  assert.equal(await atual.acoes.enviarComentarioCapitulo("post", "resposta", "pai"), false);
  assert.equal(atual.estados.status, "Não foi possível enviar a resposta agora.");
  assert.equal(atual.eventos.at(-1)[0], "finalizar");
});

test("envio preserva perfil, resposta, limite, estados e notificação", async () => {
  const atual = cenario({ salvo: { id: " novo ", atualizado_em: "data", comentario_pai_id: "pai" } });
  assert.equal(await atual.acoes.enviarComentarioCapitulo("post", " texto ", " pai "), true);
  assert.ok(atual.eventos.some((evento) => JSON.stringify(evento) === JSON.stringify(["salvar", "post", "texto", "pai"])));
  assert.deepEqual(atual.estados.comentarios[0], { id: "novo", userId: "u1", nome: "Ana", avatar: "avatar", texto: "texto", criadoEm: "data", comentarioPaiId: "pai", meuComentario: true, curtidas: [] });
  assert.equal(atual.estados.metricas.totalComentarios, 1);
  assert.equal(atual.estados.mostrar, true);
  assert.deepEqual(atual.eventos.find((evento) => evento[0] === "capitulo"), ["capitulo", { comentario: "texto" }]);
  assert.equal(atual.eventos.find((evento) => evento[0] === "notificacao")[1].tipo, "comentario-capitulo");
  assert.equal(atual.eventos.at(-1)[0], "finalizar");
  const longo = cenario();
  const texto = "a".repeat(421);
  assert.equal(await longo.acoes.enviarComentarioCapitulo("post", texto), true);
  assert.equal(longo.estados.comentarios[0].texto.length, 420);
  assert.equal(longo.estados.digitado, texto);
  assert.equal(longo.eventos.find((evento) => evento[0] === "notificacao")[1].mensagem, `Ana comentou em Capítulo: ${"a".repeat(120)}`);
});

test("remoção e curtida exigem autenticação sem tocar no Supabase", async () => {
  const atual = cenario({ usuario: "", comentarios: [comentario("c1")] });
  await atual.acoes.removerComentarioCapitulo("post", "c1");
  assert.equal(atual.estados.mensagem, "Entre na sua conta para apagar seu comentário.");
  await atual.acoes.alternarCurtidaComentarioCapitulo("post", "c1");
  assert.equal(atual.estados.mensagem, "Entre na sua conta para curtir comentários.");
  assert.equal(atual.eventos.filter((evento) => evento[0] === "push").length, 2);
  assert.ok(!atual.eventos.some((evento) => evento[0] === "from" || evento[0] === "storage"));
});

test("remoção verifica autoria e remove respostas descendentes apenas após o delete", async () => {
  let atual = cenario({ comentarios: [comentario("pai", "", "outro")] });
  await atual.acoes.removerComentarioCapitulo("post", "pai");
  assert.equal(atual.estados.status, "Você só pode remover seus próprios comentários.");
  assert.ok(!atual.eventos.some((evento) => evento[0] === "delete"));
  const comentarios = [comentario("pai"), comentario("filho", "pai"), comentario("neto", "filho"), comentario("outro")];
  atual = cenario({ comentarios, falhaDelete: true });
  await atual.acoes.removerComentarioCapitulo("post", "pai");
  assert.equal(atual.estados.status, "Não foi possível remover o comentário agora.");
  assert.equal(atual.estados.comentarios.length, 4);
  atual = cenario({ comentarios });
  await atual.acoes.removerComentarioCapitulo("post", "pai");
  assert.deepEqual(atual.estados.comentarios.map((item) => item.id), ["outro"]);
  assert.equal(atual.estados.metricas.totalComentarios, 1);
  assert.deepEqual(atual.eventos.filter((evento) => evento[0] === "eq"), [["eq", "id", "pai"], ["eq", "user_id", "u1"]]);
  assert.deepEqual(atual.eventos.find((evento) => evento[0] === "capitulo"), ["capitulo", { comentario: "" }]);
  assert.equal(atual.eventos.at(-1)[0], "finalizar");
});

test("curtida otimista persiste, sincroniza e notifica; descurtida não insere", async () => {
  let atual = cenario({ comentarios: [comentario("c1", "", "outro")] });
  await atual.acoes.alternarCurtidaComentarioCapitulo("post", "c1");
  assert.deepEqual(atual.estados.comentarios[0].curtidas, ["u1"]);
  assert.deepEqual(atual.eventos.find((evento) => evento[0] === "storage"), ["storage", "u1", "c1", true]);
  assert.deepEqual(atual.eventos.find((evento) => evento[0] === "insert"), ["insert", { comentario_id: "c1", usuario_id: "u1" }]);
  assert.equal(atual.eventos.find((evento) => evento[0] === "notificacao")[1].tipo, "curtida-comentario-capitulo");
  assert.ok(atual.eventos.findIndex((evento) => evento[0] === "storage") < atual.eventos.findIndex((evento) => evento[0] === "delete"));
  atual = cenario({ comentarios: [comentario("c1", "", "outro", ["u1"])] });
  await atual.acoes.alternarCurtidaComentarioCapitulo("post", "c1");
  assert.deepEqual(atual.estados.comentarios[0].curtidas, []);
  assert.ok(!atual.eventos.some((evento) => evento[0] === "insert" || evento[0] === "notificacao"));
});

test("falha da escrita reverte curtida e storage e mantém mensagem original", async () => {
  const atual = cenario({ comentarios: [comentario("c1")], falhaInsert: true });
  const warnAnterior = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);
  try {
    await atual.acoes.alternarCurtidaComentarioCapitulo("post", "c1");
  } finally {
    console.warn = warnAnterior;
  }
  assert.deepEqual(atual.estados.comentarios[0].curtidas, []);
  assert.deepEqual(atual.eventos.filter((evento) => evento[0] === "storage"), [["storage", "u1", "c1", true], ["storage", "u1", "c1", false]]);
  assert.equal(atual.estados.status, "Não foi possível atualizar a curtida do comentário agora.");
  assert.equal(avisos[0][0], "Não consegui sincronizar a curtida do comentário:");
  assert.equal(atual.eventos.at(-1)[0], "finalizar");
  const jaCurtido = cenario({ comentarios: [comentario("c1", "", "u1", ["u1"])], falhaDelete: true });
  console.warn = () => {};
  try {
    await jaCurtido.acoes.alternarCurtidaComentarioCapitulo("post", "c1");
  } finally {
    console.warn = warnAnterior;
  }
  assert.deepEqual(jaCurtido.estados.comentarios[0].curtidas, ["u1"]);
  assert.deepEqual(jaCurtido.eventos.filter((evento) => evento[0] === "storage"), [["storage", "u1", "c1", false], ["storage", "u1", "c1", true]]);
});
