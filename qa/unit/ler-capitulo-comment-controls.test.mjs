import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const fonte = readFileSync(
  new URL(
    "../../app/ler-capitulo/lib/ler-capitulo-comment-controls.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const js = typescript.transpileModule(fonte, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarControlesComentariosCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`,
);

function cenario(mostrarComentario = false) {
  const eventos = [];
  const ref = { current: new Set() };
  let visivel = mostrarComentario;
  const controles = criarControlesComentariosCapitulo({
    acoesComentariosCapituloRef: ref,
    setComentarioStatus(valor) {
      eventos.push(["status", valor]);
    },
    setMostrarComentario(valor) {
      visivel = typeof valor === "function" ? valor(visivel) : valor;
      eventos.push(["mostrar", visivel]);
    },
  });

  return { controles, eventos, ref, visivel: () => visivel };
}

test("controles preservam o contrato local sem hooks ou persistência", () => {
  assert.match(fonte, /export function criarControlesComentariosCapitulo\(/);
  assert.match(fonte, /async function alternarComentarioVisivel\(/);
  assert.match(fonte, /Set<string>/);
  assert.match(fonte, /\.current\s*\.has\(chave\)/);
  assert.match(fonte, /\.current\s*\.add\(chave\)/);
  assert.match(fonte, /\.current\s*\.delete\(chave\)/);
  assert.doesNotMatch(fonte, /\b(?:supabase|localStorage|router|useState|useEffect)\b/);
});

test("alternar limpa o status e alterna o sheet nos dois sentidos", async () => {
  let atual = cenario(false);
  await atual.controles.alternarComentarioVisivel();
  assert.deepEqual(atual.eventos, [["status", ""], ["mostrar", true]]);
  assert.equal(atual.visivel(), true);

  atual = cenario(true);
  await atual.controles.alternarComentarioVisivel();
  assert.deepEqual(atual.eventos, [["status", ""], ["mostrar", false]]);
  assert.equal(atual.visivel(), false);
});

test("fechar e o lock por Set preservam seus efeitos", () => {
  const atual = cenario(true);
  atual.controles.fecharComentariosCapitulo();
  assert.deepEqual(atual.eventos, [["mostrar", false]]);

  assert.equal(atual.controles.iniciarAcaoComentariosCapitulo("acao"), true);
  assert.equal(atual.controles.iniciarAcaoComentariosCapitulo("acao"), false);
  atual.controles.finalizarAcaoComentariosCapitulo("acao");
  assert.equal(atual.controles.iniciarAcaoComentariosCapitulo("acao"), true);
  assert.equal(atual.ref.current.has("acao"), true);
});
