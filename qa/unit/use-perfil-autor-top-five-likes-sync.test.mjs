import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-top-five-likes-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização das curtidas do TOP 5", () => {
  assert.match(pagina, /usePerfilAutorTopFiveLikesSync/);
  assert.match(
    pagina,
    /usePerfilAutorTopFiveLikesSync\(\{[\s\S]*?perfilAutorId:[\s\S]*?usuarioIdLogado,[\s\S]*?setTopFiveCurtidasTotal,[\s\S]*?setTopFiveCurtidoPorMim,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(
    pagina,
    /async function atualizarCurtidasTopFive\(/,
  );
});

test("hook preserva fallback local antes da leitura remota", () => {
  assert.match(source, /carregarCurtidasTopFiveLocais\(/);
  assert.match(source, /setTopFiveCurtidasTotal\(estadoLocal\.total\)/);
  assert.match(source, /setTopFiveCurtidoPorMim\(estadoLocal\.curtiu\)/);
  assert.match(source, /await carregarCurtidasTopFivePerfil\(/);
  assert.match(source, /setTopFiveCurtidasTotal\(estadoRemoto\.total\)/);
  assert.match(source, /setTopFiveCurtidoPorMim\(estadoRemoto\.curtiu\)/);
});

test("hook preserva cancelamento, timer e listeners de atualização", () => {
  assert.match(source, /let cancelado = false;/);
  assert.match(source, /if \(cancelado\) \{\s*return;\s*\}/);
  assert.match(source, /window\.setTimeout\(\(\) => \{\s*void atualizarCurtidasTopFive\(\);\s*\}, 0\)/);
  assert.match(source, /window\.addEventListener\("focus", atualizarCurtidasTopFive\)/);
  assert.match(source, /window\.addEventListener\("storage", atualizarCurtidasTopFive\)/);
  assert.match(source, /cancelado = true;/);
  assert.match(source, /window\.clearTimeout\(atualizarCurtidasTimer\)/);
  assert.match(source, /window\.removeEventListener\("focus", atualizarCurtidasTopFive\)/);
  assert.match(source, /window\.removeEventListener\("storage", atualizarCurtidasTopFive\)/);
});
