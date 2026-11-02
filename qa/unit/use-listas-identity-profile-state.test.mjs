import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/listas/hooks/use-listas-identity-profile-state.ts");
const pagina = ler("../../app/listas/page.tsx");

test("hook centraliza somente o estado de identidade e perfil das Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /import type \{ PerfilLista \} from "\.\.\/types";/);
  assert.match(hook, /export function useListasIdentityProfileState\(\)/);
  assert.match(
    hook,
    /usuarioAtualId, setUsuarioAtualId\] = useState\(""\)/,
  );
  assert.match(
    hook,
    /usuarioAtualPerfil, setUsuarioAtualPerfil\][\s\S]*?useState<PerfilLista \| null>\(null\)/,
  );
  assert.match(hook, /perfil, setPerfil\] = useState<PerfilLista \| null>\(null\)/);
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("Listas delega o estado e preserva loader, propriedade e consumidores", () => {
  assert.match(
    pagina,
    /import \{ useListasIdentityProfileState \} from "\.\/hooks\/use-listas-identity-profile-state";/,
  );
  assert.match(pagina, /\} = useListasIdentityProfileState\(\);/);

  for (const estadoLocal of [
    "const [usuarioAtualId, setUsuarioAtualId]",
    "const [usuarioAtualPerfil, setUsuarioAtualPerfil]",
    "const [perfil, setPerfil]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useListasPageDataLoader\(\{[\s\S]*?setUsuarioAtualId,[\s\S]*?setUsuarioAtualPerfil,[\s\S]*?setPerfil,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /const perfilEhProprio = Boolean\([\s\S]*?usuarioAtualId &&[\s\S]*?perfil\?\.userId &&[\s\S]*?usuarioAtualId === perfil\.userId,/,
  );
  assert.match(
    pagina,
    /useListasDiaryInteractionActions\(\{[\s\S]*?usuarioAtualId,[\s\S]*?usuarioAtualPerfil,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /useListasResultsViewState\(\{[\s\S]*?perfil,/);
  assert.match(pagina, /useListasProfileItemRenderer\(\{[\s\S]*?perfil,/);
});
