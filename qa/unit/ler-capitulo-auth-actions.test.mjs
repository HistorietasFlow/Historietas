import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-auth-actions.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const loginRoute = ler("../../app/ler-capitulo/lib/ler-capitulo-login-route.ts");
const identidade = ler("../../app/ler-capitulo/lib/ler-capitulo-auth-identity.ts")
  .replace(/^import type .*\n/m, "");
const dataUrl = (codigo) =>
  `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
const transpilar = (codigo) =>
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

const executavel = transpilar(fonte)
  .replace(
    '"../../../lib/supabase/client"',
    JSON.stringify(dataUrl("export const supabase = globalThis.__lerCapituloAuthSupabase;")),
  )
  .replace(
    '"./ler-capitulo-login-route"',
    JSON.stringify(dataUrl(transpilar(loginRoute))),
  )
  .replace(
    '"./ler-capitulo-auth-identity"',
    JSON.stringify(dataUrl(transpilar(identidade))),
  );
const { criarAcoesAutenticacaoLeitor } = await import(dataUrl(executavel));

function cenario({ usuario = "usuario", versaoDados = 1, versaoAtual = versaoDados } = {}) {
  const eventos = [];
  const identidadeDadosAplicada = { usuarioId: usuario, versao: versaoDados };
  const identidadeAutenticadaLeitorRef = {
    current: { usuarioId: usuario, versao: versaoAtual },
  };
  const acoes = criarAcoesAutenticacaoLeitor({
    obraId: "obra",
    capituloId: "capitulo",
    router: {
      push(href) {
        eventos.push(["push", href]);
      },
    },
    identidadeDadosAplicada,
    identidadeAutenticadaLeitorRef,
    setMensagemAcao(valor) {
      eventos.push(["mensagem", valor]);
    },
  });

  return { acoes, eventos, identidadeAutenticadaLeitorRef };
}

test("factory exige identidade aplicada atual e página compartilha o guard", () => {
  assert.match(fonte, /execucaoIdentidadeLeitorEstaAtual/);
  assert.match(fonte, /await supabase\.auth\.getUser\(\)/);
  assert.match(fonte, /userId === identidadeDadosAplicada\?\.usuarioId/);
  assert.match(pagina, /useLerCapituloAuthIdentityLifecycle\(\{/);
  assert.match(pagina, /identidadeDadosAplicada,/);
  assert.match(pagina, /execucaoIdentidadeAcaoEstaAtual,/);
  assert.doesNotMatch(pagina, /async function obterUsuarioLogadoIdAtual\(/);
});

test("aceita apenas a sessão correspondente aos dados aplicados", async () => {
  cliente.auth.getUser = async () => ({ data: { user: { id: "usuario" } } });
  const atual = cenario();

  assert.equal(await atual.acoes.obterUsuarioLogadoIdAtual(), "usuario");
  assert.equal(atual.acoes.execucaoIdentidadeAcaoEstaAtual(), true);

  cliente.auth.getUser = async () => ({ data: { user: { id: "outra" } } });
  assert.equal(await atual.acoes.obterUsuarioLogadoIdAtual(), "");
});

test("troca durante getUser invalida a ação sem aplicar a conta antiga", async () => {
  let resolver;
  cliente.auth.getUser = () => new Promise((resolve) => {
    resolver = resolve;
  });
  const atual = cenario();
  const consulta = atual.acoes.obterUsuarioLogadoIdAtual();

  atual.identidadeAutenticadaLeitorRef.current = {
    usuarioId: "usuario-b",
    versao: 2,
  };
  resolver({ data: { user: { id: "usuario" } } });

  assert.equal(await consulta, "");
  assert.equal(atual.acoes.execucaoIdentidadeAcaoEstaAtual(), false);
});

test("exigirLogin preserva sucesso e redirect do visitante", async () => {
  cliente.auth.getUser = async () => ({ data: { user: { id: "usuario" } } });
  let atual = cenario();
  assert.equal(await atual.acoes.exigirLogin("Entre"), true);
  assert.deepEqual(atual.eventos, [["mensagem", ""]]);

  cliente.auth.getUser = async () => ({ data: { user: null } });
  atual = cenario({ usuario: "", versaoDados: 0, versaoAtual: 0 });
  assert.equal(await atual.acoes.exigirLogin("Entre para continuar."), false);
  assert.deepEqual(atual.eventos, [
    ["mensagem", "Entre para continuar."],
    ["push", "/login?redirectTo=%2Fler-capitulo%3FobraId%3Dobra%26capituloId%3Dcapitulo"],
  ]);
});
