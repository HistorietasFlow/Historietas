import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-report-actions.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const loginRoute = ler("../../app/ler-capitulo/lib/ler-capitulo-login-route.ts");
const dataUrl = (codigo) =>
  `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
const js = (codigo) =>
  typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const executavel = js(fonte).replace(
  '"./ler-capitulo-login-route"',
  JSON.stringify(dataUrl(js(loginRoute))),
);
const { criarAcoesDenunciaLeitor } = await import(dataUrl(executavel));

function cenario({ usuario = "usuario", capitulo = { id: "capitulo", titulo: "Capítulo" }, comentarios = [] } = {}) {
  const eventos = [];
  const acoes = criarAcoesDenunciaLeitor({
    obraId: "obra",
    capituloId: "capitulo",
    capituloAtual: capitulo,
    comentariosCapitulo: comentarios,
    router: { push: (href) => eventos.push(["push", href]) },
    async obterUsuarioLogadoIdAtual() {
      eventos.push(["usuario"]);
      return usuario;
    },
    setMensagemAcao: (valor) => eventos.push(["mensagem", valor]),
    setMostrarAjustes: (valor) => eventos.push(["ajustes", valor]),
    setComentarioStatus: (valor) => eventos.push(["comentario", valor]),
    setDenunciaAlvo: (valor) => eventos.push(["denuncia", valor]),
  });

  return { acoes, eventos };
}

test("a factory concentra somente os callbacks de denúncia e a página preserva consumidores", () => {
  assert.match(fonte, /export type AlvoDenunciaLeitor/);
  assert.match(fonte, /export function criarAcoesDenunciaLeitor\(/);
  assert.match(fonte, /if \(!capituloAtual\) \{[\s\S]*?return;/);
  assert.match(fonte, /setMostrarAjustes\(false\)/);
  assert.match(fonte, /setComentarioStatus\(""\)/);
  assert.match(fonte, /comentariosCapitulo\.find/);
  assert.match(fonte, /"Comentário de capítulo"/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-report-actions";/);
  assert.match(pagina, /criarAcoesDenunciaLeitor\(\{[\s\S]*?capituloAtual,[\s\S]*?comentariosCapitulo,[\s\S]*?setDenunciaAlvo,/);
  assert.match(pagina, /abrirDenunciaCapituloAtual=\{abrirDenunciaCapituloAtual\}/);
  assert.match(pagina, /onDenunciarComentario=\{denunciarComentarioCapitulo\}/);
  assert.doesNotMatch(pagina, /async function abrirDenunciaCapituloAtual\(/);
  assert.doesNotMatch(pagina, /async function denunciarComentarioCapitulo\(/);
  assert.doesNotMatch(fonte, /\b(?:supabase|useState|useEffect|localStorage|JSX)\b/);
});

test("denunciar capítulo preserva login, guarda do capítulo e ordem das atualizações", async () => {
  let atual = cenario({ usuario: "" });
  await atual.acoes.abrirDenunciaCapituloAtual();
  assert.deepEqual(atual.eventos, [
    ["usuario"],
    ["mensagem", "Entre na sua conta para denunciar este capítulo."],
    ["push", "/login?redirectTo=%2Fler-capitulo%3FobraId%3Dobra%26capituloId%3Dcapitulo"],
  ]);

  atual = cenario({ capitulo: null });
  await atual.acoes.abrirDenunciaCapituloAtual();
  assert.deepEqual(atual.eventos, [["usuario"]]);

  atual = cenario();
  await atual.acoes.abrirDenunciaCapituloAtual();
  assert.deepEqual(atual.eventos, [
    ["usuario"],
    ["ajustes", false],
    ["denuncia", { alvoTipo: "capitulo", alvoId: "capitulo", alvoTitulo: "Capítulo" }],
  ]);
});

test("denunciar comentário preserva autenticação, limpeza e fallback de título", async () => {
  let atual = cenario({ usuario: "" });
  await atual.acoes.denunciarComentarioCapitulo("comentario");
  assert.deepEqual(atual.eventos, [
    ["usuario"],
    ["mensagem", "Entre na sua conta para denunciar comentários."],
    ["push", "/login?redirectTo=%2Fler-capitulo%3FobraId%3Dobra%26capituloId%3Dcapitulo"],
  ]);

  atual = cenario({ comentarios: [{ id: "comentario", nome: "Ana" }] });
  await atual.acoes.denunciarComentarioCapitulo("comentario");
  assert.deepEqual(atual.eventos, [
    ["usuario"],
    ["comentario", ""],
    ["denuncia", {
      alvoTipo: "comentario_capitulo",
      alvoId: "comentario",
      alvoTitulo: "Comentário de Ana",
    }],
  ]);

  atual = cenario();
  await atual.acoes.denunciarComentarioCapitulo("ausente");
  assert.equal(atual.eventos.at(-1)[1].alvoTitulo, "Comentário de capítulo");
});
