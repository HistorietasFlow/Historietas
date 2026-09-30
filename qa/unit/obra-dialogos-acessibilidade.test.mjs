import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
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
  const bloco = obterBloco(
    "function manterFocoNoDialogo(",
    "type TraducaoObraDinamica",
  );

  assert.match(bloco, /event\.key === "Escape"/);
  assert.match(bloco, /fecharDialogo\(\)/);
  assert.match(bloco, /event\.key !== "Tab"/);
  assert.match(bloco, /event\.shiftKey && elementoAtivo === primeiro/);
  assert.match(bloco, /!event\.shiftKey && elementoAtivo === ultimo/);
  assert.match(bloco, /ultimo\.focus\(\)/);
  assert.match(bloco, /primeiro\.focus\(\)/);
});

test("comentarios classificacao e acoes recebem foco inicial ao abrir", () => {
  assert.match(
    paginaObra,
    /focarInicioDialogo\(comentariosSheetRef\.current\)/,
  );
  assert.match(
    paginaObra,
    /focarInicioDialogo\(classificacaoDialogRef\.current\)/,
  );
  assert.match(
    paginaObra,
    /focarInicioDialogo\(acoesObraDialogRef\.current\)/,
  );

  const marcadores = paginaObra.match(
    /data-dialog-initial-focus="true"/g,
  ) || [];

  assert.equal(marcadores.length, 3);
});

test("os tres dialogs usam aria modal tabIndex e controle de teclado", () => {
  const comentarios = obterBloco(
    'ref={comentariosSheetRef}',
    'data-comments-sheet-handle="true"',
  );
  const classificacao = obterBloco(
    'ref={classificacaoDialogRef}',
    '<header style={classificationPanelHeaderStyle}>',
  );
  const acoes = obterBloco(
    'ref={acoesObraDialogRef}',
    '<div style={obraActionSheetHandleStyle}',
  );

  for (const bloco of [comentarios, classificacao, acoes]) {
    assert.match(bloco, /role="dialog"/);
    assert.match(bloco, /aria-modal="true"/);
    assert.match(bloco, /tabIndex=\{-1\}/);
    assert.match(bloco, /manterFocoNoDialogo/);
  }
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
    bloco,
    /focoAntesAcoesObraRef\.current = obterElementoComFocoAtual\(\)/,
  );
  assert.match(
    bloco,
    /focoAntesComentariosRef\.current = obterElementoComFocoAtual\(\)/,
  );

  const restauracoes = bloco.match(/restaurarFocoAnterior\(focoAnterior\)/g) || [];
  assert.equal(restauracoes.length, 3);
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
  const bloco = obterBloco(
    "const commentsSheetHandleWrapStyle",
    "const commentsSheetHandleStyle",
  );

  assert.doesNotMatch(bloco, /outline:\s*"none"/);
  assert.match(bloco, /outlineOffset:\s*"3px"/);
});
