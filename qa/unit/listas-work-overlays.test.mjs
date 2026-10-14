import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/listas/page.tsx", "utf8");
const actionSheet = await readFile(
  "app/listas/components/listas-work-action-sheet.tsx",
  "utf8",
);
const editor = await readFile(
  "app/listas/components/listas-annotation-editor.tsx",
  "utf8",
);
const denuncia = await readFile(
  "app/listas/components/listas-diary-report-modal.tsx",
  "utf8",
);
const workMenuActions = await readFile(
  "app/listas/hooks/use-listas-work-menu-actions.ts",
  "utf8",
);
const diaryAnnotationActions = await readFile(
  "app/listas/hooks/use-listas-diary-annotation-actions.ts",
  "utf8",
);

test("Listas delega os overlays de obra para composições apresentacionais", () => {
  assert.match(
    pagina,
    /import \{ ListasWorkActionSheet \} from "\.\/components\/listas-work-action-sheet";/,
  );
  assert.match(
    pagina,
    /import \{ ListasDiaryReportModal \} from "\.\/components\/listas-diary-report-modal";/,
  );
  assert.match(pagina, /<ListasWorkActionSheet/);
  assert.match(pagina, /<ListasDiaryReportModal/);
  assert.doesNotMatch(pagina, /<DenunciaModal/);
  assert.doesNotMatch(pagina, /aria-label=\{`Opções de \$\{obra\.titulo\}`\}/);
});

test("Listas mantém estados, cálculos e mutações do action sheet na página", () => {
  for (const contrato of [
    "obraMenuAberta",
    "itemPerfilMenuAberto",
    "obraMenuNoQueroLer",
    "salvandoQueroLer",
    "editorAnotacao",
    "DIARIO_ANOTACAO_MAX_LENGTH",
    "obterHrefContinuarLeituraListas",
    "abrirDenunciaDiario",
  ]) {
    assert.match(pagina, new RegExp(`\\b${contrato}\\b`));
  }

  assert.match(pagina, /useListasDiaryAnnotationActions\(\{/);
  for (const helper of [
    "abrirEditorAnotacaoListas",
    "salvarAnotacaoListas",
    "removerAnotacaoListas",
  ]) {
    assert.match(diaryAnnotationActions, new RegExp(`function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    pagina,
    /import \{ useListasWorkMenuActions \} from "\.\/hooks\/use-listas-work-menu-actions";/,
  );
  assert.match(pagina, /useListasWorkMenuActions\(\{/);
  for (const helper of [
    "alternarObraNoQueroLer",
    "compartilharObraDoMenu",
    "fecharMenuObra",
  ]) {
    assert.match(workMenuActions, new RegExp(`function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(pagina, /setMensagemAcao\("Denúncia enviada para análise\."\)/);
});

test("action sheet preserva diálogo, ordem e estados das ações da obra", () => {
  assert.match(actionSheet, /export function ListasWorkActionSheet/);
  assert.match(actionSheet, /role="dialog"/);
  assert.match(actionSheet, /aria-modal="true"/);
  assert.match(actionSheet, /aria-label=\{`Opções de \$\{obra\.titulo\}`\}/);
  assert.match(actionSheet, /event\.target === event\.currentTarget/);
  assert.match(actionSheet, /event\.stopPropagation\(\)/);
  assert.match(actionSheet, /href=\{hrefPrincipal\}/);
  assert.match(actionSheet, /disabled=\{salvandoQueroLer\}/);
  assert.match(actionSheet, /styles\.buttonDisabled/);
  assert.match(actionSheet, /styles\.selectionActive/);
  assert.match(actionSheet, /ListasAnnotationEditor/);

  const leitura = actionSheet.indexOf("Continuar leitura");
  const queroLer = actionSheet.indexOf("Quero ler mais tarde");
  const compartilhar = actionSheet.indexOf("Compartilhar");
  const denunciar = actionSheet.indexOf("Denunciar anotação");
  const editar = actionSheet.indexOf("Editar anotação");

  assert.ok(leitura < queroLer);
  assert.ok(queroLer < compartilhar);
  assert.ok(compartilhar < denunciar);
  assert.ok(denunciar < editar);
});

test("editor de anotação preserva limite, spoiler, ações e erro", () => {
  assert.match(editor, /export function ListasAnnotationEditor/);
  assert.match(editor, /aria-label="Anotação da leitura"/);
  assert.match(editor, /event\.target\.value\.slice\(0, maxLength\)/);
  assert.match(editor, /maxLength=\{maxLength\}/);
  assert.match(editor, /Contém spoiler/);
  assert.match(editor, /showRemove/);
  assert.match(editor, /Remover/);
  assert.match(editor, /Cancelar/);
  assert.match(editor, /Salvando\.\.\./);
  assert.match(editor, /styles\.error/);
});

test("modal de denúncia do Diário preserva o alvo e callbacks da página", () => {
  assert.match(denuncia, /export function ListasDiaryReportModal/);
  assert.match(denuncia, /<DenunciaModal/);
  assert.match(denuncia, /alvoTipo=\{alvo\?\.tipo \|\| "diario_anotacao"\}/);
  assert.match(denuncia, /alvoTitulo=\{alvo\?\.titulo \|\| "Conteúdo do Diário"\}/);
  assert.match(denuncia, /onFechar=\{onClose\}/);
  assert.match(denuncia, /onEnviada=\{onSent\}/);
});
