import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-content-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente os estados de conteúdo do Diário e Comunidade", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /import \{[\s\S]*?comunidadePerfilVazia,[\s\S]*?diarioPerfilVazio,[\s\S]*?\} from "\.\.\/constants";/,
  );
  assert.match(
    hook,
    /import type \{[\s\S]*?ComunidadePerfilEstado,[\s\S]*?DiarioPerfilEstado,[\s\S]*?\} from "\.\.\/types";/,
  );
  assert.match(hook, /export function usePerfilAutorContentState\(\)/);
  assert.match(
    hook,
    /diarioPerfil, setDiarioPerfil\][\s\S]*?useState<DiarioPerfilEstado>\(diarioPerfilVazio\)/,
  );
  assert.match(
    hook,
    /comunidadePerfil, setComunidadePerfil\][\s\S]*?useState<ComunidadePerfilEstado>\(comunidadePerfilVazia\)/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega os estados e preserva consumidores de Diário e Comunidade", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorContentState \} from "\.\/hooks\/use-perfil-autor-content-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorContentState\(\);/);

  for (const estadoLocal of [
    "const [diarioPerfil, setDiarioPerfil]",
    "const [comunidadePerfil, setComunidadePerfil]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorDiarySync({",
    "usePerfilAutorCommunitySync({",
    "obterEstadoVisualConteudoPerfilAutor({",
    "obterEstadoVisualComunidadePerfilAutor({",
    "<ProfileTabContent",
    "<ProfileAboutSection",
    "recentActivityItems={atividadesDiarioPerfil}",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(
    pagina,
    /usePerfilAutorDiarySync\(\{[\s\S]*?setDiarioPerfil,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorCommunitySync\(\{[\s\S]*?setComunidadePerfil,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /obterEstadoVisualConteudoPerfilAutor\(\{[\s\S]*?diarioPerfil,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /obterEstadoVisualComunidadePerfilAutor\(\{[\s\S]*?comunidadePerfil,[\s\S]*?\}\);/,
  );
});
