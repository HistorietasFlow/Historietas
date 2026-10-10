import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-session-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  signOutError = null,
  falharSignOut = false,
} = {}) {
  const chamadas = [];
  globalThis.__profileSessionActionsDependencies = {
    supabase: {
      auth: {
        async signOut() {
          chamadas.push(["signOut"]);
          if (falharSignOut) {
            throw new Error("falha inesperada");
          }
          return { error: signOutError };
        },
      },
    },
    criarLoginHrefPerfilAutor() {
      chamadas.push(["criarLoginHrefPerfilAutor"]);
      return "/login?redirectTo=%2Fperfil-autor";
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileSessionActionsDependencies.supabase;",
      )
      .replace(
        'import { criarLoginHrefPerfilAutor } from "../lib/profile-login-route-utils";',
        "const criarLoginHrefPerfilAutor = globalThis.__profileSessionActionsDependencies.criarLoginHrefPerfilAutor;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas };
}

function criarAcoes(modulo) {
  const mensagens = [];
  const menus = [];
  const rotas = [];

  const acoes = modulo.usePerfilAutorSessionActions({
    router: {
      push(href) {
        rotas.push(href);
      },
    },
    setMensagemAcao(mensagem) {
      mensagens.push(mensagem);
    },
    setMenuPerfilAberto(aberto) {
      menus.push(aberto);
    },
  });

  return { ...acoes, mensagens, menus, rotas };
}

test("avisa login necessário preservando mensagem e redirect", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  acoes.avisarLoginNecessario("Entre na sua conta.");

  assert.deepEqual(acoes.mensagens, ["Entre na sua conta."]);
  assert.deepEqual(acoes.rotas, ["/login?redirectTo=%2Fperfil-autor"]);
  assert.deepEqual(modulo.chamadas, [["criarLoginHrefPerfilAutor"]]);
});

test("sai da conta, fecha o menu e redireciona para /login", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.sairDaConta();

  assert.deepEqual(acoes.menus, [false]);
  assert.deepEqual(acoes.mensagens, []);
  assert.deepEqual(acoes.rotas, ["/login"]);
  assert.deepEqual(modulo.chamadas, [["signOut"]]);
});

test("preserva mensagem de erro quando signOut retorna erro ou lança exceção", async () => {
  const erroRetornado = await carregarModulo({
    signOutError: new Error("bloqueado"),
  });
  const acoesErro = criarAcoes(erroRetornado);

  await acoesErro.sairDaConta();

  assert.deepEqual(acoesErro.menus, [false]);
  assert.deepEqual(acoesErro.rotas, []);
  assert.deepEqual(acoesErro.mensagens, [
    "N\u00e3o foi poss\u00edvel sair da conta agora. Tente novamente.",
  ]);

  const excecao = await carregarModulo({ falharSignOut: true });
  const acoesExcecao = criarAcoes(excecao);

  await acoesExcecao.sairDaConta();

  assert.deepEqual(acoesExcecao.menus, [false]);
  assert.deepEqual(acoesExcecao.rotas, []);
  assert.deepEqual(acoesExcecao.mensagens, [
    "N\u00e3o foi poss\u00edvel sair da conta agora. Tente novamente.",
  ]);
});

test("Perfil de Autor delega as ações de sessão para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorSessionActions \} from "\.\/hooks\/use-perfil-autor-session-actions";/,
  );
  assert.match(
    pagina,
    /const \{ avisarLoginNecessario, sairDaConta \} =[\s\S]*?usePerfilAutorSessionActions\(\{/,
  );
  assert.doesNotMatch(pagina, /function avisarLoginNecessario\(/);
  assert.doesNotMatch(pagina, /async function sairDaConta\(/);
  assert.match(source, /supabase\.auth\.signOut\(\)/);
  assert.match(source, /router\.push\(criarLoginHrefPerfilAutor\(\)\)/);
  assert.match(source, /router\.push\("\/login"\)/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage/);
});
