import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const statsGrid = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-stats-grid.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("grid de metricas preserva layout responsivo, ordem e interacoes", () => {
  for (const trecho of [
    "isDesktop ? desktopStatsGridStyle : statsGridStyle",
    '<MetricCard numero={seguidores} rotulo="seguidores" />',
    "numero={curtidas}",
    'rotulo="curtidas"',
    "ativo={curtidaAtiva}",
    "mostrarCoracao",
    "onClick={onCurtir}",
    "numero={comentarios}",
    'rotulo="comentários"',
    "onClick={onAbrirComentarios}",
    'aria-hidden="true"',
    "synopsisToggleIconStyle",
    'sinopseAberta ? "rotate(180deg)" : "rotate(0deg)"',
    "⌄",
    'sinopseAberta ? "Capítulos" : "Sinopse"',
    'sinopseAberta ? "Mostrar capítulos" : "Mostrar sinopse"',
    "ariaExpanded={sinopseAberta}",
    "onClick={onAlternarSinopse}",
  ]) {
    assert.ok(statsGrid.includes(trecho), trecho);
  }

  assert.equal((statsGrid.match(/<MetricCard/g) || []).length, 4);
  assert.ok(
    statsGrid.indexOf('rotulo="seguidores"') <
      statsGrid.indexOf('rotulo="curtidas"'),
  );
  assert.ok(
    statsGrid.indexOf('rotulo="curtidas"') <
      statsGrid.indexOf('rotulo="comentários"'),
  );
  assert.ok(
    statsGrid.indexOf('rotulo="comentários"') <
      statsGrid.indexOf('sinopseAberta ? "Capítulos" : "Sinopse"'),
  );
});

test("cliente preserva estado, handlers e logica protegida das metricas", () => {
  for (const trecho of [
    "metricasObra",
    "totalComentariosObra",
    "sinopseAberta",
    "async function alternarCurtidaObra()",
    "criarGuardIdentidadeAcao",
    "salvarCurtidaObraPublicaSupabase",
    "function abrirComentariosObra()",
    "setComentariosAbertos(true)",
    "const alternarSinopseObra = () => {",
    "setSinopseAberta((aberta) => !aberta);",
    "<ObraStatsGrid",
    "onCurtir={alternarCurtidaObra}",
    "onAbrirComentarios={abrirComentariosObra}",
    "onAlternarSinopse={alternarSinopseObra}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }

  assert.doesNotMatch(statsGrid, /supabase|useState|setSinopseAberta/);
});
