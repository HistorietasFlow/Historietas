import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const hook = readFileSync(
  new URL(
    "../../app/comunidade/hooks/use-comunidade-auth-account-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);
const hookExecutavel = hook
  .replace(/^import[\s\S]*?from "[^"]+";\r?\n/gm, "")
  .concat("\nexport { criarControleIdentidadeComunidade };\n");
const hookJavascript = typescript.transpileModule(hookExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarControleIdentidadeComunidade } = await import(
  `data:text/javascript;base64,${Buffer.from(hookJavascript).toString("base64")}`
);

test("useComunidadeAuthAccountLifecycle preserva o carregamento autenticado e os guards de corrida", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useComunidadeAuthAccountLifecycle\(/);
  assert.match(hook, /const \{ data, error: usuarioErro \} = await supabase\.auth\.getUser\(\);/);
  assert.match(
    hook,
    /const versaoCarregamento =\s*autenticacaoComunidadeVersaoRef\.current \+ 1;[\s\S]*?autenticacaoComunidadeVersaoRef\.current = versaoCarregamento;/,
  );
  assert.match(
    hook,
    /cancelado \|\|\s*versaoCarregamento !== autenticacaoComunidadeVersaoRef\.current/,
  );
  assert.match(
    hook,
    /await prepararPerfilEStatusAdminComunidade\(user\.id\);/,
  );
  assert.match(hook, /const usuarioConfirmado = await obterUsuarioAutenticadoComunidadeAtual\(\);/);
  assert.match(
    hook,
    /!usuarioConfirmado \|\|\s*usuarioConfirmado\.id !== user\.id/,
  );
  assert.match(hook, /setCarregandoUsuario\(false\);/);
  assert.match(hook, /autenticacaoComunidadeVersaoRef\.current = versaoCarregamento;\s*setVersaoAutenticacao\(versaoCarregamento\);/);
  assert.match(hook, /autenticacaoComunidadeVersaoRef\.current \+= 1;\s*setVersaoAutenticacao\(autenticacaoComunidadeVersaoRef\.current\);/);
  // Os setters contextualizados não podem reiniciar o efeito Auth a cada versão.
  assert.doesNotMatch(hook, /setUsuariosSeguidosIds|setUsuarioSeguindoId/);
});

test("useComunidadeAuthAccountLifecycle preserva reset, recarga e cleanup na troca de conta", () => {
  assert.match(hook, /function limparEstadoContaAnterior\(\) \{/);
  assert.match(
    hook,
    /setUsuario\(null\);[\s\S]*?setUsuarioEhAdmin\(false\);[\s\S]*?setComposerAberto\(false\);[\s\S]*?setComentariosPostId\(null\);/,
  );
  assert.match(
    hook,
    /reviewsDiarioSincronizadasRef\.current\.clear\(\);[\s\S]*?usuarioReviewsDiarioRef\.current = "";[\s\S]*?acoesComunidadeRef\.current\.clear\(\);/,
  );
  assert.match(
    hook,
    /textoPostRef\.current\.value = "";[\s\S]*?obraRelacionadaRef\.current\.value = "";/,
  );
  assert.match(hook, /supabase\.auth\.onAuthStateChange\(\(event, session\) => \{/);
  assert.match(
    hook,
    /controleIdentidade\.processarEvento\(\s*event,\s*session\?\.user\?\.id \|\| "",\s*\);/,
  );
  assert.match(
    hook,
    /function agendarMudancaIdentidade\(usuarioId: string\) \{[\s\S]*?autenticacaoComunidadeVersaoRef\.current \+= 1;[\s\S]*?limparEstadoContaAnterior\(\);[\s\S]*?setPosts\(\[\]\);[\s\S]*?setCarregandoFeed\(true\);/,
  );
  assert.match(
    hook,
    /controleIdentidade\.obterIdentidadeAtual\(\) !== usuarioId[\s\S]*?void carregarUsuario\(\);[\s\S]*?void carregarPostsComunidadeNoEfeito\(true, 0, obraFiltroUrl\);/,
  );
  assert.match(
    hook,
    /timersAutenticacao\.forEach\(\(timer\) => window\.clearTimeout\(timer\)\);[\s\S]*?subscription\.unsubscribe\(\);/,
  );
});

test("Comunidade delega apenas o lifecycle de autenticação e troca de conta ao hook", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeAuthAccountLifecycle \} from "\.\/hooks\/use-comunidade-auth-account-lifecycle";/,
  );
  assert.match(
    pagina,
    /useComunidadeAuthAccountLifecycle\(\{[\s\S]*?autenticacaoComunidadeVersaoRef,[\s\S]*?reviewsDiarioSincronizadasRef,[\s\S]*?usuarioReviewsDiarioRef,[\s\S]*?acoesComunidadeRef,[\s\S]*?carregarPostsComunidade: \(mostrarCarregamento, pagina, obraFiltro\) =>[\s\S]*?carregarPostsComunidadeRef\.current\?\.[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /supabase\.auth\.onAuthStateChange/);
  assert.doesNotMatch(pagina, /async function carregarUsuario\(/);
  assert.match(pagina, /publicarPostComunidade\(\{/);
  assert.match(pagina, /alternarSeguirUsuarioBuscaComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function alternarSeguirUsuarioBusca\(/);
  assert.match(pagina, /atualizarVisibilidadePostComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function atualizarVisibilidadePost\(/);
  assert.match(pagina, /removerPostComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function removerPost\(/);
});

test("sessão inicial e eventos da mesma identidade não pedem recarga", () => {
  const visitante = criarControleIdentidadeComunidade();
  assert.equal(visitante.processarEvento("INITIAL_SESSION", ""), null);
  assert.equal(visitante.processarEvento("SIGNED_OUT", ""), null);
  assert.equal(visitante.obterIdentidadeAtual(), "");

  const autenticado = criarControleIdentidadeComunidade();
  assert.equal(
    autenticado.processarEvento("INITIAL_SESSION", "usuario-a"),
    null,
  );
  assert.equal(autenticado.processarEvento("SIGNED_IN", "usuario-a"), null);
  assert.equal(
    autenticado.processarEvento("TOKEN_REFRESHED", "usuario-a"),
    null,
  );
  assert.equal(autenticado.obterIdentidadeAtual(), "usuario-a");
});

test("mudanças reais de identidade pedem uma recarga por transição", () => {
  const controle = criarControleIdentidadeComunidade();
  controle.processarEvento("INITIAL_SESSION", "");

  assert.equal(
    controle.processarEvento("SIGNED_IN", "usuario-a"),
    "usuario-a",
  );
  assert.equal(controle.processarEvento("TOKEN_REFRESHED", "usuario-a"), null);
  assert.equal(controle.processarEvento("SIGNED_OUT", ""), "");
  assert.equal(
    controle.processarEvento("SIGNED_IN", "usuario-b"),
    "usuario-b",
  );
  assert.equal(controle.obterIdentidadeAtual(), "usuario-b");
});

test("evento anterior à resolução inicial preserva a identidade mais recente", () => {
  const visitante = criarControleIdentidadeComunidade();
  assert.equal(visitante.processarEvento("SIGNED_OUT", ""), null);
  assert.equal(visitante.resolverIdentidadeInicial(""), null);
  assert.equal(visitante.obterIdentidadeAtual(), "");

  const loginDuranteCarga = criarControleIdentidadeComunidade();
  assert.equal(
    loginDuranteCarga.processarEvento("SIGNED_IN", "usuario-b"),
    null,
  );
  assert.equal(loginDuranteCarga.resolverIdentidadeInicial(""), "usuario-b");
  assert.equal(loginDuranteCarga.obterIdentidadeAtual(), "usuario-b");

  const sessaoJaResolvida = criarControleIdentidadeComunidade();
  assert.equal(sessaoJaResolvida.resolverIdentidadeInicial("usuario-b"), null);
  assert.equal(
    sessaoJaResolvida.processarEvento("INITIAL_SESSION", "usuario-a"),
    null,
  );
  assert.equal(sessaoJaResolvida.obterIdentidadeAtual(), "usuario-b");
});

test("troca rápida mantém somente a identidade mais recente", () => {
  const controle = criarControleIdentidadeComunidade();
  controle.processarEvento("INITIAL_SESSION", "usuario-a");

  assert.equal(
    controle.processarEvento("SIGNED_IN", "usuario-b"),
    "usuario-b",
  );
  assert.equal(
    controle.processarEvento("SIGNED_IN", "usuario-c"),
    "usuario-c",
  );
  assert.equal(controle.processarEvento("TOKEN_REFRESHED", "usuario-c"), null);
  assert.equal(controle.obterIdentidadeAtual(), "usuario-c");
  assert.match(
    hook,
    /timersAutenticacao\.forEach\(\(timer\) => window\.clearTimeout\(timer\)\);\s*timersAutenticacao\.clear\(\);/,
  );
});
