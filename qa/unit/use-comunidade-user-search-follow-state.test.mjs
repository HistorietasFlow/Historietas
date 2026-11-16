import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/comunidade/hooks/use-comunidade-user-search-follow-state.ts",
);
const pagina = ler("../../app/comunidade/page.tsx");

test("hook associa resultados e seguimento ao termo e à versão autenticada", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useCallback, useMemo, useState \} from "react";/);
  assert.match(
    hook,
    /import type \{ UsuarioBuscaComunidade \} from "\.\.\/components\/community-user";/,
  );
  assert.match(hook, /export function useComunidadeUserSearchFollowState\(\{/);
  assert.match(
    hook,
    /buscaComunidadeAberta, setBuscaComunidadeAberta\] = useState\(false\)/,
  );
  for (const campo of ["usuariosBuscaComunidade", "carregandoUsuariosBuscaComunidade", "usuariosSeguidosIds", "usuarioSeguindoId"]) {
    assert.ok(hook.includes(campo));
  }
  assert.match(hook, /estado\.contexto === contexto/);
  assert.match(hook, /autenticacaoComunidadeVersaoRef\.current === versao/);
  assert.match(hook, /contextoBusca = useMemo/);
  assert.doesNotMatch(hook, /supabase|localStorage|router|return\s*\(\s*</);
});

test("página delega o estado e preserva sincronização, follow e consumidores", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeUserSearchFollowState \} from "\.\/hooks\/use-comunidade-user-search-follow-state";/,
  );
  assert.match(pagina, /\} = useComunidadeUserSearchFollowState\(\{[\s\S]*?usuarioId: usuario\?\.id,[\s\S]*?versaoAutenticacao,[\s\S]*?\}\);/);

  for (const estadoLocal of [
    "const [buscaComunidadeAberta, setBuscaComunidadeAberta]",
    "const [usuariosBuscaComunidade, setUsuariosBuscaComunidade]",
    "const [carregandoUsuariosBuscaComunidade, setCarregandoUsuariosBuscaComunidade]",
    "const [usuariosSeguidosIds, setUsuariosSeguidosIds]",
    "const [usuarioSeguindoId, setUsuarioSeguindoId]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useComunidadeAuthAccountLifecycle\(\{[\s\S]*?setVersaoAutenticacao,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadeUserSearchSync\(\{[\s\S]*?buscaComunidadeAberta,[\s\S]*?setUsuariosBuscaComunidade,[\s\S]*?setCarregandoUsuariosBuscaComunidade,[\s\S]*?setUsuariosSeguidosIds,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /alternarSeguirUsuarioBuscaComunidade\(\{[\s\S]*?usuariosSeguidosIds,[\s\S]*?setUsuariosSeguidosIds,[\s\S]*?setUsuarioSeguindoId,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /abrirBuscaComunidade\(\{ setBuscaComunidadeAberta \}\)/);
  assert.match(
    pagina,
    /fecharBuscaComunidade\(\{[\s\S]*?setTermoBusca,[\s\S]*?setBuscaComunidadeAberta,[\s\S]*?\}\)/,
  );
  assert.match(pagina, /obterPostsVisiveisComunidade\(\{[\s\S]*?usuariosSeguidosIds,/);
  assert.match(pagina, /usuariosBuscaComunidade,/);
  assert.match(pagina, /carregandoUsuariosBuscaComunidade,/);
  assert.match(pagina, /usuarioSeguindoId,/);
});
