import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/components/admin-comunidade-filters-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/page.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Admin Comunidade delega o painel de filtros ao componente dedicado", () => {
  assert.match(
    pageSource,
    /import \{ AdminComunidadeFiltersSheet \} from "\.\/components\/admin-comunidade-filters-sheet";/,
  );
  assert.match(
    pageSource,
    /\{mostrarFiltrosModeracao && \(\s*<AdminComunidadeFiltersSheet/,
  );
  assert.match(
    pageSource,
    /useAdminComunidadeModerationFilters\(\{\s*denuncias,\s*denunciasPerfis,\s*setMenuDenunciaAbertoId,\s*\}\)/,
  );
  assert.match(pageSource, /onSelecionarStatus=\{\(status\) => setStatusFiltro\(status\)\}/);
  assert.match(pageSource, /onLimparFiltros=\{limparFiltros\}/);
});

test("AdminComunidadeFiltersSheet preserva status, rótulos e acessibilidade", () => {
  assert.match(
    componentSource,
    /import type \{ StatusFiltroDenuncia \} from "\.\.\/lib\/admin-comunidade-filter-utils";/,
  );
  assert.match(componentSource, /STATUS_DENUNCIAS/);
  assert.match(componentSource, /STATUS_LABEL/);
  assert.match(
    componentSource,
    /\["todas", \.\.\.STATUS_DENUNCIAS, "arquivadas"\] as const/,
  );

  for (const text of [
    'aria-label="Filtrar denúncias"',
    'aria-label="Fechar filtros"',
    "Moderação",
    "Status",
    "Todas",
    "Arquivadas",
    "✓",
    "Limpar filtros",
  ]) {
    assert.match(componentSource, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(
    componentSource,
    /busca \|\| statusFiltro !== "todas"/,
  );
  assert.match(
    componentSource,
    /onSelecionarStatus\(status\);\s*onFechar\(\);/,
  );
  assert.match(componentSource, /onClick=\{onLimparFiltros\}/);
});

test("AdminComunidadeFiltersSheet permanece visual e sem regras de runtime", () => {
  assert.doesNotMatch(
    componentSource,
    /useState|useEffect|useMemo|useRef|supabase|auth|router|localStorage|sessionStorage/i,
  );
  assert.doesNotMatch(componentSource, /limparFiltros\s*\(/);
  assert.match(componentSource, /adminFiltersSheetOverlayStyle/);
  assert.match(componentSource, /adminFiltersSheetClearButtonStyle/);
});
