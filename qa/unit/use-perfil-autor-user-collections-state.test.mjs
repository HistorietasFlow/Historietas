import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-user-collections-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente as coleções locais do usuário", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /export function usePerfilAutorUserCollectionsState\(\)/);
  assert.match(
    hook,
    /autoresSeguidos, setAutoresSeguidos\] = useState<string\[\]>\(\[\]\)/,
  );
  assert.match(
    hook,
    /obrasFavoritas, setObrasFavoritas\] = useState<string\[\]>\(\[\]\)/,
  );
  assert.match(
    hook,
    /obrasConcluidas, setObrasConcluidas\] = useState<string\[\]>\(\[\]\)/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega as coleções e preserva consumidores existentes", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorUserCollectionsState \} from "\.\/hooks\/use-perfil-autor-user-collections-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorUserCollectionsState\(\);/);

  for (const estadoLocal of [
    "const [autoresSeguidos, setAutoresSeguidos]",
    "const [obrasFavoritas, setObrasFavoritas]",
    "const [obrasConcluidas, setObrasConcluidas]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorProfileLoadSync({",
    "usePerfilAutorAuthIdentitySync({",
    "usePerfilAutorFollowActions({",
    "usePerfilAutorLibraryCollectionActions({",
    "usePerfilAutorDiarySync({",
    "obterEstadoVisualActionSheetsPerfilAutor({",
    "obterEstadoVisualSeguimentoPerfilAutor({",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(
    pagina,
    /usePerfilAutorAuthIdentitySync\(\{[\s\S]*?setAutoresSeguidos,[\s\S]*?setObrasFavoritas,[\s\S]*?setObrasConcluidas,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorProfileLoadSync\(\{[\s\S]*?setAutoresSeguidos,[\s\S]*?setObrasFavoritas,[\s\S]*?setObrasConcluidas,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorLibraryCollectionActions\(\{[\s\S]*?obrasFavoritas,[\s\S]*?obrasConcluidas,[\s\S]*?setObrasFavoritas,[\s\S]*?setObrasConcluidas,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorDiarySync\(\{[\s\S]*?obrasFavoritas,[\s\S]*?obrasConcluidas,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorFollowActions\(\{[\s\S]*?autoresSeguidos,[\s\S]*?setAutoresSeguidos,[\s\S]*?\}\);/,
  );
});
