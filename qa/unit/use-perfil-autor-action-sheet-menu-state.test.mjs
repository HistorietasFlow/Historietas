import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-action-sheet-menu-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente o estado dos menus dos action sheets", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePerfilAutorActionSheetMenuState\(\)/);
  assert.match(
    hook,
    /obraMenuAbertoId, setObraMenuAbertoId\] = useState\(""\)/,
  );
  assert.match(
    hook,
    /bibliotecaMenuAbertoChave, setBibliotecaMenuAbertoChave\][\s\S]*?useState\(""\)/,
  );
  assert.match(
    hook,
    /function fecharMenuObra\(\)[\s\S]*?setObraMenuAbertoId\(""\);/,
  );
  assert.match(
    hook,
    /function fecharMenuBiblioteca\(\)[\s\S]*?setBibliotecaMenuAbertoChave\(""\);/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega os menus e preserva setters dos consumidores existentes", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorActionSheetMenuState \} from "\.\/hooks\/use-perfil-autor-action-sheet-menu-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorActionSheetMenuState\(\);/);

  for (const estadoLocal of [
    "const [obraMenuAbertoId, setObraMenuAbertoId]",
    "const [bibliotecaMenuAbertoChave, setBibliotecaMenuAbertoChave]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /usePerfilAutorWorkItemRenderer\(\{[\s\S]*?obraMenuAbertoId,[\s\S]*?setObraMenuAbertoId,/,
  );
  assert.match(
    pagina,
    /usePerfilAutorLibraryItemRenderer\(\{[\s\S]*?bibliotecaMenuAbertoChave,[\s\S]*?setBibliotecaMenuAbertoChave,/,
  );
  assert.match(
    pagina,
    /usePerfilAutorShareActions\(\{[\s\S]*?setObraMenuAbertoId,/,
  );
  assert.match(
    pagina,
    /usePerfilAutorReportActions\(\{[\s\S]*?setObraMenuAbertoId,/,
  );
});

test("action sheets usam fechamentos semanticos antes das actions existentes", () => {
  assert.match(pagina, /onCloseBiblioteca=\{fecharMenuBiblioteca\}/);
  assert.match(pagina, /onCloseObra=\{fecharMenuObra\}/);
  assert.match(pagina, /onReadBiblioteca=\{fecharMenuBiblioteca\}/);
  assert.match(pagina, /onReadObra=\{fecharMenuObra\}/);

  for (const callback of [
    /onRemoveBiblioteca=\{\(\) => \{[\s\S]*?fecharMenuBiblioteca\(\);[\s\S]*?removerItemBibliotecaPerfil/,
    /onShareBiblioteca=\{\(\) => \{[\s\S]*?fecharMenuBiblioteca\(\);[\s\S]*?compartilharObraPerfilAutor/,
    /onToggleBibliotecaCompleted=\{\(\) => \{[\s\S]*?fecharMenuBiblioteca\(\);[\s\S]*?alternarConcluidoObra/,
    /onToggleBibliotecaFavorite=\{\(\) => \{[\s\S]*?fecharMenuBiblioteca\(\);[\s\S]*?alternarFavoritoObra/,
    /onToggleBibliotecaWantToRead=\{\(\) => \{[\s\S]*?fecharMenuBiblioteca\(\);[\s\S]*?alternarObraSeguindoBibliotecaPerfil/,
    /onToggleObraCompleted=\{\(\) => \{[\s\S]*?fecharMenuObra\(\);[\s\S]*?alternarConcluidoObra/,
    /onToggleObraFavorite=\{\(\) => \{[\s\S]*?fecharMenuObra\(\);[\s\S]*?alternarFavoritoObra/,
  ]) {
    assert.match(pagina, callback);
  }
});
