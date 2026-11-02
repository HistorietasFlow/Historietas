import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-follow-relationship-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza o estado local de seguimento e relacionamento", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import type \{ EstadoRelacionamentoPerfil \} from "\.\.\/\.\.\/\.\.\/lib\/historietasPrivacy";/);
  assert.match(
    hook,
    /export function usePerfilAutorFollowRelationshipState\(\)/,
  );
  assert.match(hook, /seguindoUsuarioPerfil, setSeguindoUsuarioPerfil\] = useState\(false\)/);
  assert.match(hook, /seguidoresUsuarioPerfilTotal, setSeguidoresUsuarioPerfilTotal\][\s\S]*?useState\(0\)/);
  assert.match(hook, /seguindoUsuarioPerfilTotal, setSeguindoUsuarioPerfilTotal\][\s\S]*?useState\(0\)/);
  assert.match(hook, /seguirUsuarioSalvando, setSeguirUsuarioSalvando\] = useState\(false\)/);
  assert.match(hook, /estadoRelacionamentoPerfil, setEstadoRelacionamentoPerfil\][\s\S]*?useState<EstadoRelacionamentoPerfil>\("nenhum"\)/);
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega o estado e preserva os consumidores de seguimento", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorFollowRelationshipState \} from "\.\/hooks\/use-perfil-autor-follow-relationship-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorFollowRelationshipState\(\);/);

  for (const estadoLocal of [
    "const [seguindoUsuarioPerfil, setSeguindoUsuarioPerfil]",
    "const [seguidoresUsuarioPerfilTotal, setSeguidoresUsuarioPerfilTotal]",
    "const [seguindoUsuarioPerfilTotal, setSeguindoUsuarioPerfilTotal]",
    "const [seguirUsuarioSalvando, setSeguirUsuarioSalvando]",
    "const [estadoRelacionamentoPerfil, setEstadoRelacionamentoPerfil]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorFollowStateSync({",
    "usePerfilAutorFollowActions({",
    "usePerfilAutorPrivacySync({",
    "obterEstadoVisualSeguimentoPerfilAutor({",
    "<ProfileHero",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }
});
