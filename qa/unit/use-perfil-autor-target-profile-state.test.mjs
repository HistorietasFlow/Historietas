import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-target-profile-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente os estados do perfil-alvo", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(
    hook,
    /import type \{ PerfilUsuarioRemoto \} from "\.\.\/types";/,
  );
  assert.match(hook, /export function usePerfilAutorTargetProfileState\(\)/);
  assert.match(
    hook,
    /autorSelecionado, setAutorSelecionado\] = useState\(""\)/,
  );
  assert.match(
    hook,
    /autorIdSelecionado, setAutorIdSelecionado\] = useState\(""\)/,
  );
  assert.match(
    hook,
    /perfilUsuarioRemoto, setPerfilUsuarioRemoto\][\s\S]*?useState<PerfilUsuarioRemoto \| null>\(null\)/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega os estados e preserva consumidores do perfil-alvo", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorTargetProfileState \} from "\.\/hooks\/use-perfil-autor-target-profile-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorTargetProfileState\(\);/);

  for (const estadoLocal of [
    "const [autorSelecionado, setAutorSelecionado]",
    "const [autorIdSelecionado, setAutorIdSelecionado]",
    "const [perfilUsuarioRemoto, setPerfilUsuarioRemoto]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorProfileLoadSync({",
    "usePerfilAutorAuthIdentitySync({",
    "usePerfilAutorProfileSaveActions({",
    "usePerfilAutorProfileEditorSaveActions({",
    "obterEstadoAlvoPerfilAutor({",
    "obterEstadoVisualExibicaoAutorPerfil({",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(
    pagina,
    /usePerfilAutorAuthIdentitySync\(\{[\s\S]*?setPerfilUsuarioRemoto,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorProfileLoadSync\(\{[\s\S]*?setAutorSelecionado,[\s\S]*?setAutorIdSelecionado,[\s\S]*?setPerfilUsuarioRemoto,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorProfileSaveActions\(\{[\s\S]*?perfilUsuarioRemotoAtivo,[\s\S]*?setPerfilUsuarioRemoto,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorProfileEditorSaveActions\(\{[\s\S]*?perfilUsuarioRemotoAtivo,[\s\S]*?setPerfilUsuarioRemoto,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /obterEstadoAlvoPerfilAutor\(\{[\s\S]*?perfilUsuarioRemoto,[\s\S]*?autorSelecionado,[\s\S]*?autorIdSelecionado,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /obterEstadoVisualExibicaoAutorPerfil\(\{[\s\S]*?perfilUsuarioRemoto,[\s\S]*?\}\);/,
  );
});
