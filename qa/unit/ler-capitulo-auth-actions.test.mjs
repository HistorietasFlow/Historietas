import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-auth-actions.ts");
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

const cliente = {
  auth: {
    async getUser() {
      return { data: { user: null } };
    },
  },
};

globalThis.__lerCapituloAuthSupabase = cliente;

const loginRouteUrl = dataUrl(js(loginRoute));
const supabaseUrl = dataUrl(
  "export const supabase = globalThis.__lerCapituloAuthSupabase;",
);
const executavel = js(fonte)
  .replace(
    '"../../../lib/supabase/client"',
    JSON.stringify(supabaseUrl),
  )
  .replace(
    '"./ler-capitulo-login-route"',
    JSON.stringify(loginRouteUrl),
  );
const { criarAcoesAutenticacaoLeitor } = await import(dataUrl(executavel));

function cenario(usuarioIdLogado = "") {
  const eventos = [];
  const acoes = criarAcoesAutenticacaoLeitor({
    usuarioIdLogado,
    obraId: "obra",
    capituloId: "capitulo",
    router: {
      push(href) {
        eventos.push(["push", href]);
      },
    },
    setUsuarioIdLogado(valor) {
      eventos.push(["usuario", valor]);
    },
    setMensagemAcao(valor) {
      eventos.push(["mensagem", valor]);
    },
  });

  return { acoes, eventos };
}

test("a factory preserva autenticação, rota e delegação da página", () => {
  assert.match(fonte, /export function criarAcoesAutenticacaoLeitor\(/);
  assert.match(fonte, /await supabase\.auth\.getUser\(\)/);
  assert.match(fonte, /if \(usuarioIdLogado\) \{[\s\S]*?return usuarioIdLogado;/);
  assert.match(fonte, /setUsuarioIdLogado\(userId\)/);
  assert.match(fonte, /setUsuarioIdLogado\(""\)/);
  assert.match(fonte, /criarLoginHrefLeitor\([\s\S]*?obraId,[\s\S]*?capituloId,/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-auth-actions";/);
  assert.match(pagina, /criarAcoesAutenticacaoLeitor\(\{[\s\S]*?usuarioIdLogado,[\s\S]*?setMensagemAcao,/);
  assert.match(pagina, /criarAcoesInteracoesCapitulo\(\{[\s\S]*?exigirLogin,[\s\S]*?obterUsuarioLogadoIdAtual,/);
  assert.match(pagina, /criarAcaoProgressoLeituraCapitulo\(\{[\s\S]*?exigirLogin,[\s\S]*?obterUsuarioLogadoIdAtual,/);
  assert.match(pagina, /criarAcoesComentariosCapitulo\(\{[\s\S]*?obterUsuarioLogadoIdAtual,/);
  assert.doesNotMatch(pagina, /async function obterUsuarioLogadoIdAtual\(/);
  assert.doesNotMatch(pagina, /async function exigirLogin\(/);
  assert.doesNotMatch(fonte, /\b(?:useState|useEffect|router\.replace|localStorage|JSX)\b/);
});

test("usa o identificador em cache sem consultar o Supabase", async () => {
  let chamadas = 0;
  cliente.auth.getUser = async () => {
    chamadas += 1;
    return { data: { user: { id: "remoto" } } };
  };
  const atual = cenario("cache");

  assert.equal(await atual.acoes.obterUsuarioLogadoIdAtual(), "cache");
  assert.equal(chamadas, 0);
  assert.deepEqual(atual.eventos, []);
});

test("consulta o Supabase e preserva os fallbacks de usuário", async () => {
  cliente.auth.getUser = async () => ({ data: { user: { id: "remoto" } } });
  let atual = cenario();
  assert.equal(await atual.acoes.obterUsuarioLogadoIdAtual(), "remoto");
  assert.deepEqual(atual.eventos, [["usuario", "remoto"]]);

  cliente.auth.getUser = async () => ({ data: { user: null } });
  atual = cenario();
  assert.equal(await atual.acoes.obterUsuarioLogadoIdAtual(), "");
  assert.deepEqual(atual.eventos, [["usuario", ""]]);

  cliente.auth.getUser = async () => {
    throw new Error("falha");
  };
  atual = cenario();
  assert.equal(await atual.acoes.obterUsuarioLogadoIdAtual(), "");
  assert.deepEqual(atual.eventos, [["usuario", ""]]);
});

test("exigirLogin limpa a mensagem para usuário e redireciona visitante", async () => {
  let atual = cenario("logado");
  assert.equal(await atual.acoes.exigirLogin("Entre"), true);
  assert.deepEqual(atual.eventos, [["mensagem", ""]]);

  cliente.auth.getUser = async () => ({ data: { user: null } });
  atual = cenario();
  assert.equal(await atual.acoes.exigirLogin("Entre para continuar."), false);
  assert.deepEqual(atual.eventos, [
    ["usuario", ""],
    ["mensagem", "Entre para continuar."],
    ["push", "/login?redirectTo=%2Fler-capitulo%3FobraId%3Dobra%26capituloId%3Dcapitulo"],
  ]);
});
