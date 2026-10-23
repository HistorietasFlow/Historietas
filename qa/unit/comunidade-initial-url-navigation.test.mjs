import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/comunidade/hooks/use-comunidade-initial-url-navigation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("useComunidadeInitialUrlNavigation preserva os refs da navegacao inicial", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useComunidadeInitialUrlNavigation\(/);
  assert.match(hook, /const parametrosComunidadeAplicadosRef = useRef\(false\);/);
  assert.doesNotMatch(hook, /carregarPostsComunidadeNoEfeito/);
});

test("useComunidadeInitialUrlNavigation preserva parametros, ordem de setters e cleanup", () => {
  assert.match(hook, /obterParametroBuscaComunidade\(parametrosUrl\)/);
  assert.match(hook, /obterParametroObraComunidade\(parametrosUrl\)/);
  assert.match(hook, /obterTipoPublicacaoPorParametro\(/);
  assert.match(hook, /obterGrupoPublicacaoObraPorParametro\(/);
  assert.match(
    hook,
    /if \(!buscaUrl && !obraUrl && !tipoUrl && !grupoObraUrl\) \{\s*return;\s*\}/,
  );
  assert.match(
    hook,
    /if \(buscaUrl\) \{[\s\S]*?setTermoBusca\(buscaUrl\.slice\(0, 90\)\);[\s\S]*?setObraRelacionadaFiltro\(obraUrl\);[\s\S]*?setGrupoPublicacaoObra\(tipoUrl \? "" : grupoObraUrl\);/,
  );
  assert.match(
    hook,
    /tipoUrl === "Teoria"[\s\S]*?"Teorias"[\s\S]*?tipoUrl === "Review"[\s\S]*?"Reviews"[\s\S]*?"Recentes"/,
  );
  assert.match(hook, /setMostrarApenasSalvos\(false\);[\s\S]*?setOrdenacaoAtiva\("Recentes"\);/);
  assert.match(hook, /window\.clearTimeout\(aplicarParametrosTimer\);/);
});

test("useComunidadeInitialUrlNavigation preserva abertura unica de comentarios pelo post", () => {
  assert.match(
    hook,
    /if \(comentarioUrlAplicadoRef\.current \|\| comentariosPostId \|\| posts\.length === 0\) \{\s*return;\s*\}/,
  );
  assert.match(hook, /const postIdUrl = obterParametroPostComunidade\(/);
  assert.match(
    hook,
    /postIdUrl && posts\.some\(\(post\) => post\.id === postIdUrl\)/,
  );
  assert.match(
    hook,
    /comentarioUrlAplicadoRef\.current = true;[\s\S]*?setComentariosPostId\(postIdUrl\);/,
  );
  assert.match(hook, /window\.clearTimeout\(abrirComentariosTimer\);/);
  assert.doesNotMatch(hook, /supabase\.|localStorage|useState\(/);
});

test("Comunidade delega somente a navegacao inicial ao hook", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeInitialUrlNavigation \} from "\.\/hooks\/use-comunidade-initial-url-navigation";/,
  );
  assert.match(
    pagina,
    /useComunidadeInitialUrlNavigation\(\{[\s\S]*?comentarioUrlAplicadoRef,[\s\S]*?comentariosPostId,[\s\S]*?posts,[\s\S]*?setTermoBusca,[\s\S]*?setComentariosPostId,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /window\.history\.scrollRestoration = "manual";/);
  assert.match(
    pagina,
    /const obraUrl = obterParametroObraComunidade\(parametrosUrl\);[\s\S]*?const carregarFeedTimer = window\.setTimeout\([\s\S]*?void carregarPostsComunidadeNoEfeito\(true, 0, obraUrl\);/,
  );
  assert.match(pagina, /window\.clearTimeout\(carregarFeedTimer\);/);
  assert.doesNotMatch(pagina, /const parametrosComunidadeAplicadosRef = useRef\(false\);/);
  assert.doesNotMatch(pagina, /const postIdUrl = obterParametroPostComunidade\(/);
  assert.match(pagina, /supabase\.auth\.onAuthStateChange/);
  assert.match(pagina, /async function alternarSeguirUsuarioBusca\(/);
  assert.match(pagina, /function abrirComentariosPostComunidade\(/);
});
