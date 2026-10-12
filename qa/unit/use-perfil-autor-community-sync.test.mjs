import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-community-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega o carregamento da Comunidade", () => {
  assert.match(pagina, /usePerfilAutorCommunitySync/);
  assert.match(
    pagina,
    /usePerfilAutorCommunitySync\(\{[\s\S]*?perfilAutorId,[\s\S]*?comunidadePerfilVisivel,[\s\S]*?perfilPertenceAoUsuario,[\s\S]*?setComunidadePerfil,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarComunidadePerfil\(/);
});

test("hook preserva fallback e estado de carregamento", () => {
  assert.match(
    source,
    /!comunidadePerfilVisivel \|\|[\s\S]*?!userIdPerfil \|\|[\s\S]*?!idAutorSupabaseValido\(userIdPerfil\)/,
  );
  assert.match(source, /setComunidadePerfil\(comunidadePerfilVazia\)/);
  assert.match(
    source,
    /setComunidadePerfil\(\{[\s\S]*?\.\.\.comunidadePerfilVazia,[\s\S]*?carregando: true,[\s\S]*?\}\)/,
  );
});

test("hook preserva leitura remota, erro, timer e cancelamento", () => {
  assert.match(source, /await carregarComunidadePerfilSupabase\(/);
  assert.match(source, /perfilPertenceAoUsuario/);
  assert.match(source, /let cancelado = false;/);
  assert.match(source, /if \(!cancelado\) \{/);
  assert.match(
    source,
    /erro: "Não foi possível carregar as publicações deste perfil agora\."/,
  );
  assert.match(
    source,
    /window\.setTimeout\(\(\) => \{\s*void carregarComunidadePerfil\(\);\s*\}, 0\)/,
  );
  assert.match(source, /cancelado = true;/);
  assert.match(source, /window\.clearTimeout\(carregarComunidadeTimer\)/);
});
