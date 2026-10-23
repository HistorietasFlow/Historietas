import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/comunidade/hooks/use-comunidade-feed-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url), "utf8",
);

test("useComunidadeFeedLifecycle preserva o carregador e os estados da paginação", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useComunidadeFeedLifecycle\(/);
  assert.match(hook, /function carregarPostsComunidadeDaPagina\(/);
  assert.match(
    hook,
    /return carregarPostsComunidade\(\{[\s\S]*?mostrarCarregamento,[\s\S]*?pagina,[\s\S]*?obraFiltro,[\s\S]*?setCarregandoFeed,[\s\S]*?setCarregandoMaisPostsComunidade,[\s\S]*?setPosts,[\s\S]*?setTemMaisPostsComunidade,[\s\S]*?setPaginaFeedComunidade,[\s\S]*?setObrasRelacionadasSugestoes,[\s\S]*?setErro,[\s\S]*?\}\);/,
  );
  assert.match(hook, /function carregarMaisPostsComunidadeDaPagina\(\) \{/);
  assert.match(
    hook,
    /return carregarMaisPostsComunidade\(\{[\s\S]*?carregandoFeed,[\s\S]*?carregandoMaisPostsComunidade,[\s\S]*?temMaisPostsComunidade,[\s\S]*?paginaFeedComunidade,[\s\S]*?carregarPostsComunidadeDaPagina,[\s\S]*?\}\);/,
  );
});

test("useComunidadeFeedLifecycle preserva o lifecycle inicial de scroll, filtro e timer", () => {
  assert.match(hook, /"scrollRestoration" in window\.history/);
  assert.match(hook, /window\.history\.scrollRestoration = "manual";/);
  assert.match(hook, /window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\);/);
  assert.match(
    hook,
    /const obraUrl = obterParametroObraComunidade\(parametrosUrl\);[\s\S]*?const carregarFeedTimer = window\.setTimeout\([\s\S]*?void carregarPostsComunidadeNoEfeito\(true, 0, obraUrl\);[\s\S]*?\}, 0\);/,
  );
  assert.match(hook, /window\.clearTimeout\(carregarFeedTimer\);/);
  assert.doesNotMatch(hook, /supabase\.|localStorage|useState\(/);
});

test("Comunidade delega somente o lifecycle de feed ao hook", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeFeedLifecycle \} from "\.\/hooks\/use-comunidade-feed-lifecycle";/,
  );
  assert.match(
    pagina,
    /useComunidadeFeedLifecycle\(\{[\s\S]*?obraRelacionadaFiltro,[\s\S]*?carregandoFeed,[\s\S]*?carregandoMaisPostsComunidade,[\s\S]*?temMaisPostsComunidade,[\s\S]*?paginaFeedComunidade,[\s\S]*?setCarregandoFeed,[\s\S]*?setCarregandoMaisPostsComunidade,[\s\S]*?setPosts,[\s\S]*?setTemMaisPostsComunidade,[\s\S]*?setPaginaFeedComunidade,[\s\S]*?setObrasRelacionadasSugestoes,[\s\S]*?setErro,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /onCarregarMais=\{carregarMaisPostsComunidadeDaPagina\}/);
  assert.doesNotMatch(pagina, /function carregarPostsComunidadeDaPagina\(/);
  assert.doesNotMatch(pagina, /window\.history\.scrollRestoration = "manual";/);
  assert.doesNotMatch(pagina, /carregarMaisPostsComunidade\(\{/);
  assert.match(pagina, /useComunidadeAuthAccountLifecycle\(/);
  assert.match(pagina, /publicarPostComunidade\(\{/);
  assert.match(pagina, /alternarSeguirUsuarioBuscaComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function alternarSeguirUsuarioBusca\(/);
});
