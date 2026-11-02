import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-header-menu-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza o estado e as acoes semanticas do cabecalho e menu", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePerfilAutorHeaderMenuState\(\)/);
  assert.match(hook, /menuPerfilAberto, setMenuPerfilAberto\] = useState\(false\)/);
  assert.match(
    hook,
    /usernameCabecalhoVisivel, setUsernameCabecalhoVisivel\][\s\S]*?useState\(false\)/,
  );
  assert.match(
    hook,
    /function abrirMenuPerfil\(\) \{\s*setMenuPerfilAberto\(true\);\s*\}/,
  );
  assert.match(
    hook,
    /function fecharMenuPerfil\(\) \{\s*setMenuPerfilAberto\(false\);\s*\}/,
  );
  assert.match(
    hook,
    /function alternarUsernameCabecalho\(\) \{\s*setUsernameCabecalhoVisivel\(\(visivel\) => !visivel\);\s*\}/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega o estado e preserva os consumidores de cabecalho e menu", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorHeaderMenuState \} from "\.\/hooks\/use-perfil-autor-header-menu-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorHeaderMenuState\(\);/);
  assert.equal(
    pagina.includes("const [menuPerfilAberto, setMenuPerfilAberto]"),
    false,
  );
  assert.equal(
    pagina.includes("const [usernameCabecalhoVisivel, setUsernameCabecalhoVisivel]"),
    false,
  );

  for (const integracao of [
    "usePerfilAutorSessionActions({",
    "usePerfilAutorShareActions({",
    "usePerfilAutorReportActions({",
    "usePerfilAutorBlockActions({",
    "usePerfilAutorProfileEditorActions({",
    "usePerfilAutorProfileLoadSync({",
    "obterEstadoVisualShellPerfilAutor({",
    "<ProfileHeader",
    "<ProfileMenu",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(pagina, /onOpenMenu=\{abrirMenuPerfil\}/);
  assert.match(pagina, /onClose=\{fecharMenuPerfil\}/);
  assert.match(pagina, /onToggleUsername=\{alternarUsernameCabecalho\}/);
});
