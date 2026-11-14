import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/perfil-autor/hooks/use-perfil-autor-tab-privacy-state.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/perfil-autor/page.tsx", import.meta.url);

test("o hook centraliza somente o estado de privacidade das abas", async () => {
  const source = await readFile(hookPath, "utf8");

  assert.match(source, /^"use client";/);
  assert.match(
    source,
    /import type \{ PermissoesAbasPerfil \} from "\.\.\/\.\.\/\.\.\/lib\/historietasPrivacy";/,
  );
  assert.match(
    source,
    /import \{ PERMISSOES_ABAS_PERFIL_PADRAO \} from "\.\.\/constants";/,
  );
  assert.match(source, /export function usePerfilAutorTabPrivacyState\(\)/);
  assert.match(
    source,
    /useState<PermissoesAbasPerfil>\(PERMISSOES_ABAS_PERFIL_PADRAO\)/,
  );
  assert.match(source, /useState\(true\)/);
  assert.match(source, /setPermissoesAbasPerfil/);
  assert.match(source, /setPrivacidadePerfilCarregando/);
  assert.doesNotMatch(source, /useEffect|supabase|localStorage|router/);
});

test("a pagina delega o estado e preserva os consumidores de privacidade", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(
    source,
    /import \{ usePerfilAutorTabPrivacyState \} from "\.\/hooks\/use-perfil-autor-tab-privacy-state";/,
  );
  assert.match(source, /\} = usePerfilAutorTabPrivacyState\(\);/);
  assert.doesNotMatch(
    source,
    /const \[permissoesAbasPerfil, setPermissoesAbasPerfil\]/,
  );
  assert.doesNotMatch(
    source,
    /const \[privacidadePerfilCarregando, setPrivacidadePerfilCarregando\]/,
  );
  assert.match(
    source,
    /obterEstadoVisualAcessoPerfilAutor\(\{[\s\S]*?privacidadePerfilCarregando: privacidadePerfilCarregando \|\| !privacidadeAtual,[\s\S]*?permissoesAbasPerfil,/,
  );
  assert.match(
    source,
    /usePerfilAutorPrivacySync\(\{[\s\S]*?setPermissoesAbasPerfil,[\s\S]*?setPrivacidadePerfilCarregando,/,
  );
  assert.match(
    source,
    /usePerfilAutorBlockActions\(\{[\s\S]*?setPermissoesAbasPerfil,/,
  );
});
