import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/comunidade/hooks/use-comunidade-auth-account-state.ts",
);
const pagina = ler("../../app/comunidade/page.tsx");

test("hook centraliza somente o estado de autenticação e conta da Comunidade", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(
    hook,
    /import type \{ UsuarioComunidade \} from "\.\.\/components\/community-user";/,
  );
  assert.match(hook, /export function useComunidadeAuthAccountState\(\)/);
  assert.match(
    hook,
    /usuario, setUsuario\] = useState<UsuarioComunidade \| null>\(null\)/,
  );
  assert.match(hook, /usuarioEhAdmin, setUsuarioEhAdmin\] = useState\(false\)/);
  assert.match(
    hook,
    /carregandoUsuario, setCarregandoUsuario\] = useState\(true\)/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("página delega o estado e preserva o lifecycle e consumidores da conta", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeAuthAccountState \} from "\.\/hooks\/use-comunidade-auth-account-state";/,
  );
  assert.match(pagina, /\} = useComunidadeAuthAccountState\(\);/);

  for (const estadoLocal of [
    "const [usuario, setUsuario]",
    "const [usuarioEhAdmin, setUsuarioEhAdmin]",
    "const [carregandoUsuario, setCarregandoUsuario]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useComunidadeAuthAccountLifecycle\(\{[\s\S]*?setUsuario,[\s\S]*?setUsuarioEhAdmin,[\s\S]*?setCarregandoUsuario,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /usuario\?\.id/);
  assert.match(pagina, /usuarioEhAdmin/);
  assert.match(pagina, /carregandoUsuario/);
  assert.doesNotMatch(pagina, /supabase\.auth\./);
});
