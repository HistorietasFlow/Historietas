import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-auth-loading-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente os estados de autenticação e carregamento", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /export function usePerfilAutorAuthLoadingState\(\)/);
  assert.match(
    hook,
    /usuarioIdLogado, setUsuarioIdLogado\] = useState\(""\)/,
  );
  assert.match(
    hook,
    /autenticacaoCarregada, setAutenticacaoCarregada\] = useState\(false\)/,
  );
  assert.match(hook, /carregando, setCarregando\] = useState\(true\)/);
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega os estados e preserva consumidores de autenticação e carregamento", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorAuthLoadingState \} from "\.\/hooks\/use-perfil-autor-auth-loading-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorAuthLoadingState\(\);/);

  for (const estadoLocal of [
    "const [usuarioIdLogado, setUsuarioIdLogado]",
    "const [autenticacaoCarregada, setAutenticacaoCarregada]",
    "const [carregando, setCarregando]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorAuthIdentitySync({",
    "usePerfilAutorProfileLoadSync({",
    "usePerfilAutorNotificationCountSync({",
    "usePerfilAutorRatingSync({",
    "usePerfilAutorDiaryRatingSync({",
    "usePerfilAutorDiarySync({",
    "usePerfilAutorFollowStateSync({",
    "usePerfilAutorBlockStateSync({",
    "obterEstadoAlvoPerfilAutor({",
    "obterEstadoVisualPaginaPerfilAutor({",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(
    pagina,
    /usePerfilAutorAuthIdentitySync\(\{[\s\S]*?setCarregando,[\s\S]*?setUsuarioIdLogado,[\s\S]*?setAutenticacaoCarregada,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorProfileLoadSync\(\{[\s\S]*?autenticacaoCarregada,[\s\S]*?usuarioIdLogado,[\s\S]*?setCarregando,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /obterEstadoVisualPaginaPerfilAutor\(\{[\s\S]*?carregando,[\s\S]*?\}\);/,
  );
});
