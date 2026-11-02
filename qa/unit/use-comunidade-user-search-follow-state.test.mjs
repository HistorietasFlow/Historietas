import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/comunidade/hooks/use-comunidade-user-search-follow-state.ts",
);
const pagina = ler("../../app/comunidade/page.tsx");

test("hook centraliza somente o estado de busca e seguimento de usuários", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(
    hook,
    /import type \{ UsuarioBuscaComunidade \} from "\.\.\/components\/community-user";/,
  );
  assert.match(hook, /export function useComunidadeUserSearchFollowState\(\)/);
  assert.match(
    hook,
    /buscaComunidadeAberta, setBuscaComunidadeAberta\] = useState\(false\)/,
  );
  assert.match(
    hook,
    /usuariosBuscaComunidade, setUsuariosBuscaComunidade\][\s\S]*?useState<[\s\S]*?UsuarioBuscaComunidade\[\][\s\S]*?>\(\[\]\)/,
  );
  assert.match(
    hook,
    /carregandoUsuariosBuscaComunidade, setCarregandoUsuariosBuscaComunidade\][\s\S]*?useState\(false\)/,
  );
  assert.match(
    hook,
    /usuariosSeguidosIds, setUsuariosSeguidosIds\] = useState<string\[\]>\(\[\]\)/,
  );
  assert.match(
    hook,
    /usuarioSeguindoId, setUsuarioSeguindoId\] = useState<string \| null>\(null\)/,
  );
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("página delega o estado e preserva sincronização, follow e consumidores", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeUserSearchFollowState \} from "\.\/hooks\/use-comunidade-user-search-follow-state";/,
  );
  assert.match(pagina, /\} = useComunidadeUserSearchFollowState\(\);/);

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
    /useComunidadeAuthAccountLifecycle\(\{[\s\S]*?setUsuariosSeguidosIds,[\s\S]*?setUsuarioSeguindoId,[\s\S]*?\}\);/,
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
