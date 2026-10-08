import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const helperFocoDialogo = readFileSync(
  new URL("../../app/obra/[slug]/lib/obra-dialog-focus.ts", import.meta.url),
  "utf8",
);
const hookFocoInicialDialogo = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-dialog-initial-focus.ts",
    import.meta.url,
  ),
  "utf8",
);
const hookAcoes = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-actions-sheet.ts",
    import.meta.url,
  ),
  "utf8",
);
const obraStyleUtils = readFileSync(
  new URL("../../app/obra/[slug]/lib/obra-style-utils.ts", import.meta.url),
  "utf8",
);
const handleComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comments-handle.tsx",
    import.meta.url,
  ),
  "utf8",
);
const commentsSheet = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comments-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const classificationPanel = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-classification-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);
const actionsSheet = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-actions-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);

function obterBloco(inicioTexto, fimTexto) {
  const inicio = paginaObra.indexOf(inicioTexto);
  const fim = paginaObra.indexOf(fimTexto, inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  return paginaObra.slice(inicio, fim);
}

test("helper de dialog trata Escape e prende Tab nos limites focaveis", () => {
  assert.match(helperFocoDialogo, /event\.key === "Escape"/);
  assert.match(helperFocoDialogo, /fecharDialogo\(\)/);
  assert.match(helperFocoDialogo, /event\.key !== "Tab"/);
  assert.match(helperFocoDialogo, /event\.shiftKey && elementoAtivo === primeiro/);
  assert.match(helperFocoDialogo, /!event\.shiftKey && elementoAtivo === ultimo/);
  assert.match(helperFocoDialogo, /ultimo\.focus\(\)/);
  assert.match(helperFocoDialogo, /primeiro\.focus\(\)/);
});

test("comentarios classificacao e acoes recebem foco inicial ao abrir", () => {
  assert.match(
    hookFocoInicialDialogo,
    /if \(!aberto\) \{\s*return;\s*\}/,
  );
  assert.match(
    hookFocoInicialDialogo,
    /window\.setTimeout\(\(\) => \{\s*focarInicioDialogo\(dialogRef\.current\);\s*\}, 0\)/,
  );
  assert.match(
    hookFocoInicialDialogo,
    /window\.clearTimeout\(focoTimer\)/,
  );
  assert.match(
    paginaObra,
    /useObraDialogInitialFocus\(comentariosAbertos, comentariosSheetRef\)/,
  );
  assert.match(
    paginaObra,
    /useObraDialogInitialFocus\(\s*painelClassificacaoAberto,\s*classificacaoDialogRef,\s*\)/,
  );
  assert.match(
    hookAcoes,
    /useObraDialogInitialFocus\(acoesObraAbertas, acoesObraDialogRef\)/,
  );

  const marcadoresPagina = paginaObra.match(
    /\sdata-dialog-initial-focus="true"/g,
  ) || [];

  assert.equal(marcadoresPagina.length, 0);
  assert.match(handleComentarios, /data-dialog-initial-focus="true"/);
  assert.match(classificationPanel, /data-dialog-initial-focus="true"/);
  assert.match(actionsSheet, /data-dialog-initial-focus="true"/);
});

test("os tres dialogs usam aria modal tabIndex e controle de teclado", () => {
  assert.match(commentsSheet, /role="dialog"/);
  assert.match(commentsSheet, /aria-modal="true"/);
  assert.match(commentsSheet, /tabIndex=\{-1\}/);
  assert.match(commentsSheet, /onKeyDown=\{onKeyDown\}/);
  assert.match(
    paginaObra,
    /onKeyDown=\{\(event\) =>\s*manterFocoNoDialogo\(event, fecharComentariosObra\)\s*\}/,
  );

  assert.match(classificationPanel, /role="dialog"/);
  assert.match(classificationPanel, /aria-modal="true"/);
  assert.match(classificationPanel, /tabIndex=\{-1\}/);
  assert.match(classificationPanel, /onKeyDown=\{onKeyDown\}/);
  assert.match(
    paginaObra,
    /onKeyDown=\{\(event\) =>\s*manterFocoNoDialogo\(event, fecharPainelClassificacaoObra\)\s*\}/,
  );

  assert.match(actionsSheet, /role="dialog"/);
  assert.match(actionsSheet, /aria-modal="true"/);
  assert.match(actionsSheet, /tabIndex=\{-1\}/);
  assert.match(actionsSheet, /onKeyDown=\{onKeyDown\}/);
  assert.match(
    paginaObra,
    /onKeyDown=\{\(event\)\s*=>\s*manterFocoNoDialogo\(event,\s*\(\)\s*=>\s*fecharAcoesObra\(\)\)\s*\}/,
  );
});

test("fechamento normal restaura foco ao elemento que abriu o dialog", () => {
  const bloco = obterBloco(
    "function abrirPainelClassificacaoObra()",
    "function iniciarArrasteComentariosObra(",
  );

  assert.match(
    bloco,
    /focoAntesClassificacaoRef\.current = obterElementoComFocoAtual\(\)/,
  );
  assert.match(
    hookAcoes,
    /focoAntesAcoesObraRef\.current = obterElementoComFocoAtual\(\)/,
  );
  assert.match(
    bloco,
    /focoAntesComentariosRef\.current = obterElementoComFocoAtual\(\)/,
  );

  const restauracoes = bloco.match(/restaurarFocoAnterior\(focoAnterior\)/g) || [];
  assert.equal(restauracoes.length, 2);
  assert.match(
    hookAcoes,
    /const focoAnterior = focoAntesAcoesObraRef\.current;\s*focoAntesAcoesObraRef\.current = null;\s*setAcoesObraAbertas\(false\);\s*if \(restaurarFoco\) \{\s*restaurarFocoAnterior\(focoAnterior\);/,
  );
});

test("abrir denuncia pelo menu nao rouba foco do modal seguinte", () => {
  const bloco = obterBloco(
    "function abrirDenunciaObraAtual()",
    "function abrirDenunciaComentarioObra(",
  );

  assert.match(bloco, /fecharAcoesObra\(false\)/);
  assert.doesNotMatch(bloco, /restaurarFocoAnterior/);
});

test("handle dos comentarios preserva indicacao visual de foco", () => {
  const inicio = obraStyleUtils.indexOf(
    "export const commentsSheetHandleWrapStyle",
  );
  const fim = obraStyleUtils.indexOf("};", inicio);

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  const bloco = obraStyleUtils.slice(inicio, fim);

  assert.doesNotMatch(bloco, /outline:\s*"none"/);
  assert.match(bloco, /outlineOffset:\s*"3px"/);
});
