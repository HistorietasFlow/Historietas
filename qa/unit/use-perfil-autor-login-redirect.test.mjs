import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-login-redirect.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega o redirecionamento para login", () => {
  assert.match(pagina, /usePerfilAutorLoginRedirect/);
  assert.match(
    pagina,
    /usePerfilAutorLoginRedirect\(\{[\s\S]*?redirecionandoParaLogin,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /router\.replace\(criarLoginHrefPerfilAutor\(\)\)/);
});

test("hook preserva guarda e rota segura de login", () => {
  assert.match(source, /if \(!redirecionandoParaLogin\)/);
  assert.match(source, /router\.replace\(criarLoginHrefPerfilAutor\(\)\)/);
  assert.match(source, /useRouter\(\)/);
});
