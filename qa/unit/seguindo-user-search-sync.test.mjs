import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-user-search-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const interacoes = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-content-interactions.ts",
    import.meta.url,
  ),
  "utf8",
);

test("hook preserva debounce, filtros, cancelamento e cleanup da busca", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /const timerBusca = window\.setTimeout\(/,
  );
  assert.match(
    hook,
    /buscaSugestoesUsuariosAtiva \? 220 : 0/,
  );
  assert.match(
    hook,
    /if \(!buscaSugestoesUsuariosAtiva\) \{[\s\S]*?setUsuariosSugestoesBusca\(\[\]\);[\s\S]*?setCarregandoUsuariosSugestoes\(false\);/,
  );
  assert.match(
    hook,
    /void buscarUsuariosParaSeguirSupabase\(busca\)/,
  );
  assert.match(
    hook,
    /const idsJaSeguidos = new Set\([\s\S]*?usuariosSeguidos\.map/,
  );
  assert.match(
    hook,
    /usuarioEncontrado\.id !== usuarioLogadoId[\s\S]*?!idsJaSeguidos\.has\(usuarioEncontrado\.id\)/,
  );
  assert.match(
    hook,
    /return \(\) => \{[\s\S]*?cancelado = true;[\s\S]*?window\.clearTimeout\(timerBusca\);[\s\S]*?\};/,
  );
});

test("página delega a busca de sugestões ao hook", () => {
  assert.match(
    interacoes,
    /import \{ useSeguindoUserSearchSync \} from "\.\/use-seguindo-user-search-sync";/,
  );
  assert.match(
    interacoes,
    /useSeguindoUserSearchSync\(\{[\s\S]*?busca,[\s\S]*?buscaSugestoesUsuariosAtiva,[\s\S]*?usuarioLogadoId,[\s\S]*?usuariosSeguidos,[\s\S]*?setUsuariosSugestoesBusca,[\s\S]*?setCarregandoUsuariosSugestoes,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /useSeguindoPageContentInteractions\(/);
  assert.doesNotMatch(pagina, /buscarUsuariosParaSeguirSupabase/);
  assert.doesNotMatch(pagina, /const timerBusca = window\.setTimeout/);
});
