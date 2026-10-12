import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-privacy-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização da privacidade", () => {
  assert.match(pagina, /usePerfilAutorPrivacySync/);
  assert.match(
    pagina,
    /usePerfilAutorPrivacySync\(\{[\s\S]*?perfilAutorId,[\s\S]*?perfilPertenceAoUsuario,[\s\S]*?estadoRelacionamentoPerfil,[\s\S]*?setPermissoesAbasPerfil,[\s\S]*?setPrivacidadePerfilCarregando,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarPrivacidadePerfil\(/);
});

test("hook preserva fallback das permissões para perfil inválido", () => {
  assert.match(source, /setPrivacidadePerfilCarregando\(true\)/);
  assert.match(source, /!userIdPerfil \|\| !idAutorSupabaseValido\(userIdPerfil\)/);
  assert.match(source, /PERMISSOES_ABAS_PERFIL_PROPRIO/);
  assert.match(source, /PERMISSOES_ABAS_PERFIL_PADRAO/);
  assert.match(source, /setPrivacidadePerfilCarregando\(false\)/);
});

test("hook preserva leitura remota, relacionamento e cancelamento", () => {
  assert.match(source, /await carregarPreferenciasPrivacidade\(userIdPerfil, \{/);
  assert.match(source, /usarFallbackLocal: perfilPertenceAoUsuario/);
  assert.match(source, /await carregarPermissoesAbasPerfil\(userIdPerfil, preferencias\)/);
  assert.match(source, /estadoRelacionamentoPerfil/);
  assert.match(source, /let cancelado = false;/);
  assert.match(source, /if \(!cancelado\) \{/);
  assert.match(source, /cancelado = true;/);
});
