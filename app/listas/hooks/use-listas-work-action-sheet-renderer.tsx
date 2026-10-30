"use client";

import type { Dispatch, SetStateAction } from "react";
import { ListasWorkActionSheet } from "../components/listas-work-action-sheet";
import { DIARIO_ANOTACAO_MAX_LENGTH, EDITOR_ANOTACAO_LISTAS_VAZIO } from "../lib/listas-page-constants";
import { obterHrefContinuarLeituraListas } from "../lib/listas-profile-items-utils";
import { textoSecundarioItem } from "../lib/listas-profile-text-utils";
import {
  actionSheetActionsStyle,
  actionSheetButtonDisabledStyle,
  actionSheetButtonIconStyle,
  actionSheetButtonStyle,
  actionSheetDetailStyle,
  actionSheetHandleStyle,
  actionSheetHeaderStyle,
  actionSheetMetaStyle,
  actionSheetOverlayStyle,
  actionSheetSelectionDotActiveStyle,
  actionSheetSelectionDotStyle,
  actionSheetStyle,
  actionSheetTitleStyle,
  listDiaryActionSheetEditorStyle,
  listDiaryActionSheetReportStyle,
  listDiaryAnnotationCancelStyle,
  listDiaryAnnotationCounterStyle,
  listDiaryAnnotationEditorMetaStyle,
  listDiaryAnnotationErrorStyle,
  listDiaryAnnotationMetaActionsStyle,
  listDiaryAnnotationRemoveStyle,
  listDiaryAnnotationSaveStyle,
  listDiaryAnnotationSpoilerCheckboxStyle,
  listDiaryAnnotationSpoilerLabelStyle,
  listDiaryAnnotationTextareaStyle,
  listDiaryAnnotationTextareaWrapStyle,
} from "../lib/listas-work-styles";
import type {
  CategoriaPerfil,
  EditorAnotacaoListasEstado,
  ItemObraLista,
  ObraLista,
  PerfilLista,
} from "../types";

type UseListasWorkActionSheetRendererProps = {
  abrirDenunciaDiario: (
    tipo: "diario_anotacao",
    id: string,
    titulo: string,
    autorId: string,
  ) => void;
  abrirEditorAnotacaoListas: () => void;
  alternarObraNoQueroLer: () => Promise<void>;
  categoriaMenuAberta: CategoriaPerfil;
  compartilharObraDoMenu: () => Promise<void>;
  editorAnotacao: EditorAnotacaoListasEstado;
  fecharMenuObra: () => void;
  itemPerfilMenuAberto: ItemObraLista | null;
  obraMenuAberta: ObraLista | null;
  obraMenuNoQueroLer: boolean;
  perfil: PerfilLista | null;
  perfilEhProprio: boolean;
  removerAnotacaoListas: () => Promise<void>;
  salvandoQueroLer: boolean;
  salvarAnotacaoListas: () => Promise<void>;
  setEditorAnotacao: Dispatch<SetStateAction<EditorAnotacaoListasEstado>>;
  setItemPerfilMenuAberto: Dispatch<SetStateAction<ItemObraLista | null>>;
  setObraMenuAberta: Dispatch<SetStateAction<ObraLista | null>>;
  setObraMenuNoQueroLer: Dispatch<SetStateAction<boolean>>;
};

export function useListasWorkActionSheetRenderer({
  abrirDenunciaDiario,
  abrirEditorAnotacaoListas,
  alternarObraNoQueroLer,
  categoriaMenuAberta,
  compartilharObraDoMenu,
  editorAnotacao,
  fecharMenuObra,
  itemPerfilMenuAberto,
  obraMenuAberta,
  obraMenuNoQueroLer,
  perfil,
  perfilEhProprio,
  removerAnotacaoListas,
  salvandoQueroLer,
  salvarAnotacaoListas,
  setEditorAnotacao,
  setItemPerfilMenuAberto,
  setObraMenuAberta,
  setObraMenuNoQueroLer,
}: UseListasWorkActionSheetRendererProps) {
  function renderizarWorkActionSheet() {
    return (
      obraMenuAberta && (
        <ListasWorkActionSheet
          detalhe={
            itemPerfilMenuAberto
              ? textoSecundarioItem(itemPerfilMenuAberto, categoriaMenuAberta)
              : ""
          }
          editor={editorAnotacao}
          editorStyles={{
            cancel: listDiaryAnnotationCancelStyle,
            counter: listDiaryAnnotationCounterStyle,
            editor: listDiaryActionSheetEditorStyle,
            editorMeta: listDiaryAnnotationEditorMetaStyle,
            error: listDiaryAnnotationErrorStyle,
            metaActions: listDiaryAnnotationMetaActionsStyle,
            remove: listDiaryAnnotationRemoveStyle,
            save: listDiaryAnnotationSaveStyle,
            spoilerCheckbox: listDiaryAnnotationSpoilerCheckboxStyle,
            spoilerLabel: listDiaryAnnotationSpoilerLabelStyle,
            textarea: listDiaryAnnotationTextareaStyle,
            textareaWrap: listDiaryAnnotationTextareaWrapStyle,
          }}
          hrefPrincipal={
            itemPerfilMenuAberto
              ? obterHrefContinuarLeituraListas(itemPerfilMenuAberto)
              : obraMenuAberta.link
          }
          item={itemPerfilMenuAberto}
          maxAnnotationLength={DIARIO_ANOTACAO_MAX_LENGTH}
          onCancelAnnotation={() => setEditorAnotacao(EDITOR_ANOTACAO_LISTAS_VAZIO)}
          onClose={fecharMenuObra}
          onEditAnnotation={abrirEditorAnotacaoListas}
          onRemoveAnnotation={() => void removerAnotacaoListas()}
          onReportAnnotation={() => {
            const anotacaoId = itemPerfilMenuAberto?.anotacaoId?.trim() || "";

            if (!anotacaoId) {
              return;
            }

            setObraMenuAberta(null);
            setItemPerfilMenuAberto(null);
            setObraMenuNoQueroLer(false);
            abrirDenunciaDiario(
              "diario_anotacao",
              anotacaoId,
              `Anotação de ${perfil?.nome || "usuário"} em ${obraMenuAberta.titulo}`,
              perfil?.userId || "",
            );
          }}
          onSaveAnnotation={() => void salvarAnotacaoListas()}
          onShare={() => void compartilharObraDoMenu()}
          onToggleWantToRead={() => void alternarObraNoQueroLer()}
          obra={obraMenuAberta}
          perfilEhProprio={perfilEhProprio}
          podeContinuar={Boolean(
            itemPerfilMenuAberto && itemPerfilMenuAberto.progresso > 0,
          )}
          queroLer={obraMenuNoQueroLer}
          salvandoQueroLer={salvandoQueroLer}
          setEditor={setEditorAnotacao}
          styles={{
            actions: actionSheetActionsStyle,
            button: actionSheetButtonStyle,
            buttonDisabled: actionSheetButtonDisabledStyle,
            buttonIcon: actionSheetButtonIconStyle,
            detail: actionSheetDetailStyle,
            handle: actionSheetHandleStyle,
            header: actionSheetHeaderStyle,
            meta: actionSheetMetaStyle,
            overlay: actionSheetOverlayStyle,
            panel: actionSheetStyle,
            report: listDiaryActionSheetReportStyle,
            selection: actionSheetSelectionDotStyle,
            selectionActive: actionSheetSelectionDotActiveStyle,
            title: actionSheetTitleStyle,
          }}
        />
      )
    );
  }

  return { renderizarWorkActionSheet };
}
