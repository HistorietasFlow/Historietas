import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-sorting-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const controls = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-page-controls.ts",
    import.meta.url,
  ),
  "utf8",
);

test("painel de ordenação preserva portal, acessibilidade e opções", () => {
  for (const contrato of [
    '"use client"',
    "NotificacoesOverlayPortal",
    'data-historietas-notificacoes-overlay="true"',
    "event.stopPropagation()",
    "Opções de notificações",
    "Mostrar",
    "Classificar por",
    "Ações",
    "Marcar todas como lidas",
    "Marcar seleção",
    "Apagar lidas",
    "Limpar todos",
    'ativo ? "✓" : ""',
    "totalNotificacoes === 0",
    "totalNotificacoesFiltradas === 0",
    "totalLidas === 0",
  ]) {
    assert.ok(componente.includes(contrato), `contrato ausente: ${contrato}`);
  }
});

test("painel usa estilos externos sem hooks, Supabase ou storage", () => {
  assert.match(
    componente,
    /from "\.\.\/lib\/notificacoes-shell-styles";/,
  );

  for (const proibido of ["useEffect", "useState", "supabase", "localStorage", "window", "document"]) {
    assert.ok(!componente.includes(proibido), `referência indevida: ${proibido}`);
  }
});

test("página delega o painel e os controles preservam os callbacks de estado", () => {
  assert.match(pagina, /import NotificacoesSortingSheet/);
  assert.match(
    pagina,
    /<NotificacoesSortingSheet[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?filtro=\{filtro\}[\s\S]*?ordenacao=\{ordenacao\}/,
  );
  assert.match(pagina, /onFiltroChange=\{atualizarFiltro\}/);
  assert.match(pagina, /onOrdenacaoChange=\{atualizarOrdenacao\}/);
  assert.match(
    controls,
    /function atualizarFiltro\(proximoFiltro: FiltroNotificacao\) \{\s*setFiltro\(proximoFiltro\);\s*setMostrarPainelOrdenacao\(false\);\s*\}/,
  );
  assert.match(
    controls,
    /function atualizarOrdenacao\(proximaOrdenacao: OrdenacaoNotificacao\) \{\s*setOrdenacao\(proximaOrdenacao\);\s*setMostrarPainelOrdenacao\(false\);\s*\}/,
  );
  assert.match(pagina, /onMarcarTodasComoLidas=\{\(\) => \{/);
  assert.match(pagina, /onMarcarFiltradasComoLidas=\{\(\) => \{/);
  assert.match(pagina, /onLimparLidas=\{\(\) => \{/);
  assert.match(pagina, /onLimparTodas=\{\(\) => \{/);
  assert.doesNotMatch(pagina, /<NotificacoesOverlayPortal>[\s\S]*?Opções de notificações/);
});
