import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/perfil-autor/hooks/use-perfil-autor-block-state.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/perfil-autor/page.tsx", import.meta.url);

test("o hook centraliza somente o estado de bloqueio do perfil", async () => {
  const source = await readFile(hookPath, "utf8");

  assert.match(source, /^"use client";/);
  assert.match(
    source,
    /import type \{ EstadoBloqueioPerfil \} from "\.\.\/\.\.\/\.\.\/lib\/historietasPrivacy";/,
  );
  assert.match(source, /export function usePerfilAutorBlockState\(\)/);
  assert.match(source, /bloqueadoPorMim: false/);
  assert.match(source, /bloqueadoPeloPerfil: false/);
  assert.match(source, /existeBloqueio: false/);
  assert.match(source, /const \[bloqueioPerfilSalvando, setBloqueioPerfilSalvando\] =\s*useState\(false\)/);
  assert.match(source, /setEstadoBloqueioPerfil/);
  assert.doesNotMatch(source, /useEffect|supabase|localStorage|router/);
});

test("a pagina delega o estado e preserva os consumidores de bloqueio", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(
    source,
    /import \{ usePerfilAutorBlockState \} from "\.\/hooks\/use-perfil-autor-block-state";/,
  );
  assert.match(source, /\} = usePerfilAutorBlockState\(\);/);
  assert.doesNotMatch(
    source,
    /const \[estadoBloqueioPerfil, setEstadoBloqueioPerfil\]/,
  );
  assert.doesNotMatch(
    source,
    /const \[bloqueioPerfilSalvando, setBloqueioPerfilSalvando\]/,
  );
  assert.match(
    source,
    /obterEstadoVisualAcessoPerfilAutor\(\{[\s\S]*?estadoBloqueioPerfil,[\s\S]*?bloqueioPerfilSalvando,/,
  );
  assert.match(
    source,
    /usePerfilAutorBlockStateSync\(\{[\s\S]*?setEstadoBloqueioPerfil,/,
  );
  assert.match(
    source,
    /usePerfilAutorBlockActions\(\{[\s\S]*?bloqueioPerfilSalvando,[\s\S]*?estadoBloqueioPerfil,[\s\S]*?setBloqueioPerfilSalvando,[\s\S]*?setEstadoBloqueioPerfil,/,
  );
  assert.match(source, /<ProfileHeader[\s\S]*?blockSaving=\{bloqueioPerfilSalvando\}/);
});
