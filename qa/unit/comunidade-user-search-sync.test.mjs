import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/comunidade/hooks/use-comunidade-user-search-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("useComunidadeUserSearchSync preserva o lifecycle de usuarios seguidos", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useComunidadeUserSearchSync\(/);
  assert.match(hook, /const userId = usuarioId \|\| "";/);
  assert.match(
    hook,
    /if \(!userId\) \{[\s\S]*?setUsuariosSeguidosIds\(\[\]\);[\s\S]*?window\.clearTimeout\(limparUsuariosSeguidosTimer\);/,
  );
  assert.match(
    hook,
    /void carregarUsuariosSeguidosComunidade\(userId\)\.then\(\(idsSeguidos\) => \{[\s\S]*?setUsuariosSeguidosIds\(idsSeguidos\);/,
  );
  assert.match(hook, /\}, \[usuarioId, setUsuariosSeguidosIds\]\);/);
});

test("useComunidadeUserSearchSync preserva normalizacao, debounce e combinacao da busca", () => {
  assert.match(
    hook,
    /const termoLimpo = normalizarTermoBuscaUsuariosComunidade\(termoBuscaAdiado\);/,
  );
  assert.match(
    hook,
    /deveLimparBuscaUsuariosComunidade\(buscaComunidadeAberta, termoLimpo\)/,
  );
  assert.match(
    hook,
    /setUsuariosBuscaComunidade\(\[\]\);[\s\S]*?setCarregandoUsuariosBuscaComunidade\(false\);/,
  );
  assert.match(hook, /const buscaTimer = window\.setTimeout\(/);
  assert.match(hook, /\}, 220\);/);
  assert.match(
    hook,
    /const usuariosLocais = buscarUsuariosComunidadeNosPosts\([\s\S]*?posts,[\s\S]*?termoLimpo/,
  );
  assert.match(hook, /void buscarUsuariosComunidadeSupabase\(termoLimpo\)/);
  assert.match(
    hook,
    /prepararResultadosBuscaUsuariosComunidade\([\s\S]*?usuariosSupabase,[\s\S]*?usuariosLocais,[\s\S]*?termoLimpo/,
  );
  assert.match(
    hook,
    /\.finally\(\(\) => \{[\s\S]*?setCarregandoUsuariosBuscaComunidade\(false\);/,
  );
  assert.match(
    hook,
    /return \(\) => \{[\s\S]*?cancelado = true;[\s\S]*?window\.clearTimeout\(buscaTimer\);/,
  );
});

test("Comunidade delega apenas a sincronizacao de busca de usuarios ao hook", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeUserSearchSync \} from "\.\/hooks\/use-comunidade-user-search-sync";/,
  );
  assert.match(
    pagina,
    /useComunidadeUserSearchSync\(\{[\s\S]*?buscaComunidadeAberta,[\s\S]*?posts,[\s\S]*?termoBuscaAdiado,[\s\S]*?usuarioId: usuario\?\.id,[\s\S]*?setUsuariosBuscaComunidade,[\s\S]*?setCarregandoUsuariosBuscaComunidade,[\s\S]*?setUsuariosSeguidosIds,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /void buscarUsuariosComunidadeSupabase\(/);
  assert.doesNotMatch(pagina, /void carregarUsuariosSeguidosComunidade\(/);
  assert.doesNotMatch(pagina, /const buscaTimer = window\.setTimeout\(/);
  assert.match(pagina, /async function alternarSeguirUsuarioBusca\(/);
  assert.match(pagina, /carregarPostsComunidadeDaPagina/);
});
