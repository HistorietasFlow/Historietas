import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actionsSheet = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-actions-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("sheet preserva dialogo, tags, metricas e estados visuais", () => {
  for (const trecho of [
    'role="presentation"',
    "onClick={onFechar}",
    "ref={dialogRef}",
    'role="dialog"',
    'aria-modal="true"',
    "tabIndex={-1}",
    "onKeyDown={onKeyDown}",
    "event.stopPropagation()",
    'aria-hidden="true"',
    'data-historietas-i18n-ignore="true"',
    "autorHref",
    "autorBio || undefined",
    'data-dialog-initial-focus="true"',
    "mostrarDenuncia",
    "onSalvar",
    "onConcluir",
    "onDenunciar",
    "onCompartilhar",
    '"Salvar"',
    '"Salvo"',
    '"Concluir"',
    '"Concluída"',
    '"Compartilhar"',
    '"Link copiado!"',
    '"✓"',
  ]) {
    assert.ok(actionsSheet.includes(trecho), trecho);
  }

  assert.match(
    actionsSheet,
    /tags\s*\.filter\(\(tag\) => tag\.trim\(\)\)\s*\.slice\(0, 10\)/,
  );
  assert.match(actionsSheet, /\$\{obraId\}-menu-tag-\$\{tag\}-\$\{index\}/);
  assert.match(actionsSheet, /index > 0/);
  assert.match(actionsSheet, /"\u{1F441}"|"👁"/u);
  assert.match(actionsSheet, /"❤️"/u);
  assert.match(actionsSheet, /"💬"/u);
  assert.match(actionsSheet, /"🔖"/u);
  assert.match(
    actionsSheet,
    /isDesktop \? desktopObraActionsMenuStyle : obraActionsMenuStyle/,
  );
});

test("cliente preserva estado, foco, wrappers e denuncia", () => {
  for (const trecho of [
    "acoesObraAbertas",
    "acoesObraDialogRef",
    "manterFocoNoDialogo",
    "abrirDenunciaObraAtual",
    "fecharAcoesObra(false)",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }

  assert.match(
    paginaObra,
    /const salvarObraPeloMenu = \(\) => \{\s*fecharAcoesObra\(\);\s*void alternarFavoritoObra\(\);/,
  );
  assert.match(
    paginaObra,
    /const concluirObraPeloMenu = \(\) => \{\s*fecharAcoesObra\(\);\s*void alternarConcluirObra\(\);/,
  );
  assert.match(
    paginaObra,
    /const compartilharObraPeloMenu = \(\) => \{\s*fecharAcoesObra\(\);\s*void compartilharObraAtual\(\);/,
  );
  assert.match(paginaObra, /onDenunciar=\{abrirDenunciaObraAtual\}/);
});
