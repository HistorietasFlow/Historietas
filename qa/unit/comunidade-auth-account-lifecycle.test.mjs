import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
  assert.match(hook, /supabase\.auth\.onAuthStateChange\(\(\) => \{/);
  assert.match(
    hook,
    /autenticacaoComunidadeVersaoRef\.current \+= 1;[\s\S]*?limparEstadoContaAnterior\(\);[\s\S]*?setPosts\(\[\]\);[\s\S]*?setCarregandoFeed\(true\);/,
  );
  assert.match(
    hook,
    /const timer = window\.setTimeout\(\(\) => \{[\s\S]*?void carregarUsuario\(\);[\s\S]*?void carregarPostsComunidadeNoEfeito\(true, 0, obraFiltroUrl\);[\s\S]*?\}, 0\);/,
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
  assert.match(pagina, /async function alternarSeguirUsuarioBusca\(/);
  assert.match(pagina, /async function atualizarVisibilidadePost\(/);
  assert.match(pagina, /async function removerPost\(/);
});
