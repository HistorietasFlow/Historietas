import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const controles = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-top-controls.tsx",
    import.meta.url,
  ),
  "utf8",
);
const acoes = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-actions-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("controles preservam busca e filtros nas variantes desktop e móvel", () => {
  for (const contrato of [
    '"use client"',
    "if (isDesktop)",
    "Notificações",
    "Filtros",
    "Buscar notificações...",
    "Abrir opções das notificações",
    "Fechar busca",
    "Abrir busca",
    "maxLength={90}",
    "autoFocus",
    "onBuscaChange(event.target.value)",
    "onAlternarPainelOrdenacao",
  ]) {
    assert.ok(controles.includes(contrato), `contrato ausente: ${contrato}`);
  }
});

test("menu de ações preserva portal, links e mutações condicionais", () => {
  for (const contrato of [
    "NotificacoesOverlayPortal",
    'data-historietas-notificacoes-overlay="true"',
    "AÇÕES DA NOTIFICAÇÃO",
    "montarLinkNotificacao(notificacao, obra)",
    "criarPerfilHrefNotificacao",
    "solicitacao-seguidor",
    "Aceitando...",
    "Recusando...",
    "Marcar como nova",
    "Marcar como lida",
    "Abrir obra",
    "Apagar",
    "event.stopPropagation()",
  ]) {
    assert.ok(acoes.includes(contrato), `contrato ausente: ${contrato}`);
  }

  assert.match(
    acoes,
    /isDesktop\s*\?\s*desktopNotificationActionsSheetStyle\s*:\s*notificationActionsSheetStyle/,
  );
});

test("página delega os dois blocos visuais sem deslocar estados e ações", () => {
  assert.match(pagina, /import NotificacoesTopControls/);
  assert.match(pagina, /import NotificacoesActionsSheet/);
  assert.match(
    pagina,
    /<NotificacoesTopControls[\s\S]*?busca=\{busca\}[\s\S]*?onBuscaChange=\{/,
  );
  assert.match(
    pagina,
    /<NotificacoesActionsSheet[\s\S]*?notificacaoOriginal=\{notificacaoMenuAberta\}[\s\S]*?onResponderSolicitacaoSeguidor=\{/,
  );
  assert.doesNotMatch(pagina, /<NotificacoesOverlayPortal>/);
});

test("componentes visuais não introduzem hooks, Supabase ou storage", () => {
  for (const componente of [controles, acoes]) {
    for (const proibido of ["useEffect", "useState", "supabase", "localStorage", "window", "document"]) {
      assert.ok(!componente.includes(proibido), `referência indevida: ${proibido}`);
    }
  }
});
