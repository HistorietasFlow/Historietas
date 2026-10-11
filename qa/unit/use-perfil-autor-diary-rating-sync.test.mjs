import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-diary-rating-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega o carregamento da avaliação do Diário", () => {
  assert.match(pagina, /usePerfilAutorDiaryRatingSync/);
  assert.match(
    pagina,
    /usePerfilAutorDiaryRatingSync\(\{[\s\S]*?perfilParaMostrar,[\s\S]*?perfilUsuarioRemotoUserId:[\s\S]*?perfilUsaAvaliacaoDiario,[\s\S]*?podeEditarPerfil,[\s\S]*?usuarioIdLogado,[\s\S]*?setAvaliacaoDiario,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarAvaliacaoRealDiario\(/);
});

test("hook preserva fallbacks do Diário", () => {
  assert.match(
    source,
    /if \(!perfilParaMostrar \|\| !perfilUsaAvaliacaoDiario\)/,
  );
  assert.match(source, /setAvaliacaoDiario\(avaliacaoDiarioVazia\)/);
  assert.match(
    source,
    /!diarioUserId \|\| !idAutorSupabaseValido\(diarioUserId\)/,
  );
  assert.match(source, /carregado: true,[\s\S]*?visivel: podeEditarPerfil/);
});

test("hook preserva RPC, normalização, timer e cancelamento", () => {
  assert.match(source, /"carregar_avaliacao_diario"/);
  assert.match(source, /p_diario_user_id: diarioUserId/);
  assert.match(source, /normalizarAvaliacaoDiarioPerfil\(data, avaliacaoAtual\)/);
  assert.match(source, /let cancelado = false;/);
  assert.match(source, /if \(!cancelado\) \{/);
  assert.match(
    source,
    /window\.setTimeout\(\(\) => \{\s*void carregarAvaliacaoRealDiario\(\);\s*\}, 0\)/,
  );
  assert.match(source, /cancelado = true;/);
  assert.match(source, /window\.clearTimeout\(carregarAvaliacaoDiarioTimer\)/);
});
