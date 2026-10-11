import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-follow-state-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização do seguimento", () => {
  assert.match(pagina, /usePerfilAutorFollowStateSync/);
  assert.match(
    pagina,
    /usePerfilAutorFollowStateSync\(\{[\s\S]*?perfilAutorId:[\s\S]*?usuarioIdLogado,[\s\S]*?setEstadoRelacionamentoPerfil,[\s\S]*?setSeguindoUsuarioPerfil,[\s\S]*?setSeguidoresUsuarioPerfilTotal,[\s\S]*?setSeguindoUsuarioPerfilTotal,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarSeguimentoUsuario\(/);
});

test("hook preserva fallback para perfil inválido", () => {
  assert.match(
    source,
    /!perfilUserId \|\| !idAutorSupabaseValido\(perfilUserId\)/,
  );
  assert.match(source, /setSeguindoUsuarioPerfil\(false\)/);
  assert.match(source, /setEstadoRelacionamentoPerfil\("nenhum"\)/);
});

test("hook preserva relacionamento, contagens, timer e cancelamento", () => {
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /carregarEstadoSeguimentoUsuarioPerfil\(/);
  assert.match(source, /carregarEstadoRelacionamentoPerfil\(/);
  assert.match(source, /estadoRelacionamento === "seguindo" \|\| estadoSeguimento\.seguindo/);
  assert.match(source, /"proprio_perfil"/);
  assert.match(source, /setSeguidoresUsuarioPerfilTotal\(estadoSeguimento\.seguidoresTotal\)/);
  assert.match(source, /setSeguindoUsuarioPerfilTotal\(estadoSeguimento\.seguindoTotal\)/);
  assert.match(source, /let cancelado = false;/);
  assert.match(source, /if \(cancelado\) \{\s*return;\s*\}/);
  assert.match(
    source,
    /window\.setTimeout\(\(\) => \{\s*void carregarSeguimentoUsuario\(\);\s*\}, 0\)/,
  );
  assert.match(source, /cancelado = true;/);
  assert.match(source, /window\.clearTimeout\(carregarSeguimentoTimer\)/);
});
