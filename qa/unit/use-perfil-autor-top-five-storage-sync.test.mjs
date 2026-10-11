import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-top-five-storage-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização local do TOP 5", () => {
  assert.match(pagina, /usePerfilAutorTopFiveStorageSync/);
  assert.match(
    pagina,
    /usePerfilAutorTopFiveStorageSync\(\{[\s\S]*?perfilAutorId:[\s\S]*?usuarioIdLogado,[\s\S]*?setTopFiveObraIds,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(
    pagina,
    /window\.addEventListener\("storage", atualizarTopFivePerfil\)/,
  );
});

test("hook preserva timer inicial e listeners do TOP 5", () => {
  assert.match(source, /window\.setTimeout\([\s\S]*?atualizarTopFivePerfil,[\s\S]*?0,/);
  assert.match(source, /window\.addEventListener\("focus", atualizarTopFivePerfil\)/);
  assert.match(source, /window\.addEventListener\("storage", atualizarTopFivePerfil\)/);
  assert.match(
    source,
    /document\.addEventListener\([\s\S]*?"visibilitychange",[\s\S]*?atualizarQuandoVoltarParaTela/,
  );
  assert.match(source, /document\.visibilityState !== "hidden"/);
});

test("hook preserva limpeza dos listeners e fonte por perfil ou usuário", () => {
  assert.match(
    source,
    /const topFiveUserId = perfilAutorId\.trim\(\) \|\| usuarioIdLogado\.trim\(\);/,
  );
  assert.match(source, /carregarTopFivePerfilAutor\(topFiveUserId\)/);
  assert.match(source, /window\.clearTimeout\(atualizarTopFiveTimer\)/);
  assert.match(source, /window\.removeEventListener\("focus", atualizarTopFivePerfil\)/);
  assert.match(source, /window\.removeEventListener\("storage", atualizarTopFivePerfil\)/);
  assert.match(source, /document\.removeEventListener\(/);
});
