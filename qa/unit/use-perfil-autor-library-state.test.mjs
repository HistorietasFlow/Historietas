import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/perfil-autor/hooks/use-perfil-autor-library-state.ts");
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente o estado principal da Biblioteca", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /import type \{ AbaBibliotecaPerfil \} from "\.\.\/types";/,
  );
  assert.match(hook, /export function usePerfilAutorLibraryState\(\)/);
  assert.match(
    hook,
    /abaBibliotecaPerfil, setAbaBibliotecaPerfil\][\s\S]*?useState<AbaBibliotecaPerfil>\("tudo"\)/,
  );
  assert.match(
    hook,
    /obrasSeguidasBiblioteca, setObrasSeguidasBiblioteca\][\s\S]*?useState<string\[\]>\(\[\]\)/,
  );
  assert.match(
    hook,
    /versaoSincronizacaoBiblioteca, setVersaoSincronizacaoBiblioteca\][\s\S]*?useState\(0\)/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega o estado e preserva os consumidores da Biblioteca", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorLibraryState \} from "\.\/hooks\/use-perfil-autor-library-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorLibraryState\(\);/);

  for (const estadoLocal of [
    "const [abaBibliotecaPerfil, setAbaBibliotecaPerfil]",
    "const [obrasSeguidasBiblioteca, setObrasSeguidasBiblioteca]",
    "const [versaoSincronizacaoBiblioteca, setVersaoSincronizacaoBiblioteca]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorLibraryCollectionActions({",
    "usePerfilAutorDiarySync({",
    "usePerfilAutorAuthIdentitySync({",
    "usePerfilAutorProfileLoadSync({",
    "<ProfileLibraryPanel",
    "onSelect={setAbaBibliotecaPerfil}",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(
    pagina,
    /usePerfilAutorLibraryCollectionActions\(\{[\s\S]*?abaBibliotecaPerfil,[\s\S]*?obrasSeguidasBiblioteca,[\s\S]*?setObrasSeguidasBiblioteca,[\s\S]*?setVersaoSincronizacaoBiblioteca,/,
  );
  assert.match(
    pagina,
    /usePerfilAutorDiarySync\(\{[\s\S]*?obrasSeguidasBiblioteca,[\s\S]*?versaoSincronizacaoBiblioteca,/,
  );
});
