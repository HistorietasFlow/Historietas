"use client";

import type {
  Dispatch,
  KeyboardEvent,
  RefObject,
  SetStateAction,
  TouchEvent,
} from "react";
import { ListasDiaryCommentsPanel } from "../components/listas-diary-comments-panel";
import { DIARIO_COMENTARIO_MAX_LENGTH } from "../lib/listas-page-constants";
import { obterPermissoesAnotacaoListas } from "../lib/listas-diary-annotation-permissions-utils";
import { type ComentarioAnotacaoListas } from "../lib/listas-diary-comment-utils";
import { type InteracoesAnotacoesListasEstado } from "../lib/listas-diary-interactions-loader";
import type { ItemObraLista, PerfilLista } from "../types";

type UseListasDiaryCommentsRendererProps = {
  abrirDenunciaDiario: (tipo: "comentario_diario", id: string, titulo: string, autorId: string) => void;
  alterarOrdenacaoComentariosAnotacaoListas: (anotacaoId: string, ordenacao: "relevantes" | "recentes") => void;
  alternarCurtidaComentarioAnotacaoListas: (anotacaoId: string, comentario: ComentarioAnotacaoListas) => Promise<void>;
  alternarExpansaoComentariosDiario: () => void;
  atualizarComentarioAnotacaoListas: (anotacaoId: string, texto: string) => void;
  cancelarRespostaComentarioAnotacaoListas: (anotacaoId: string) => void;
  comentarioCurtindoId: string;
  comentarioRemovendoId: string;
  comentariosDiarioExpandido: boolean;
  comentariosDiarioItem: ItemObraLista | null;
  comentariosSheetRef: RefObject<HTMLElement | null>;
  enviarComentarioAnotacaoListas: (item: ItemObraLista) => Promise<void>;
  fecharComentariosDiario: () => void;
  finalizarArrasteComentariosDiario: () => void;
  iniciarArrasteComentariosDiario: (event: TouchEvent<HTMLDivElement>) => void;
  iniciarRespostaComentarioAnotacaoListas: (anotacaoId: string, comentario: ComentarioAnotacaoListas) => void;
  inserirNoComentarioDiario: (texto: string) => void;
  interacoesAnotacoes: InteracoesAnotacoesListasEstado;
  isDesktop: boolean;
  menuOrdenacaoComentariosDiarioAberto: boolean;
  moverArrasteComentariosDiario: (event: TouchEvent<HTMLDivElement>) => void;
  perfilEhProprio: boolean;
  preferenciasPerfil: { quemPodeComentarDiario: string };
  relacionamentoPerfil: string;
  removerComentarioAnotacaoListas: (item: ItemObraLista, comentario: ComentarioAnotacaoListas) => Promise<void>;
  respostasVisiveisComentariosDiario: Record<string, number>;
  setMenuOrdenacaoComentariosDiarioAberto: Dispatch<SetStateAction<boolean>>;
  setRespostasVisiveisComentariosDiario: Dispatch<SetStateAction<Record<string, number>>>;
  usuarioAtualId: string;
  usuarioAtualPerfil: PerfilLista | null;
};

export function useListasDiaryCommentsRenderer({
  abrirDenunciaDiario,
  alterarOrdenacaoComentariosAnotacaoListas,
  alternarCurtidaComentarioAnotacaoListas,
  alternarExpansaoComentariosDiario,
  atualizarComentarioAnotacaoListas,
  cancelarRespostaComentarioAnotacaoListas,
  comentarioCurtindoId,
  comentarioRemovendoId,
  comentariosDiarioExpandido,
  comentariosDiarioItem,
  comentariosSheetRef,
  enviarComentarioAnotacaoListas,
  fecharComentariosDiario,
  finalizarArrasteComentariosDiario,
  iniciarArrasteComentariosDiario,
  iniciarRespostaComentarioAnotacaoListas,
  inserirNoComentarioDiario,
  interacoesAnotacoes,
  isDesktop,
  menuOrdenacaoComentariosDiarioAberto,
  moverArrasteComentariosDiario,
  perfilEhProprio,
  preferenciasPerfil,
  relacionamentoPerfil,
  removerComentarioAnotacaoListas,
  respostasVisiveisComentariosDiario,
  setMenuOrdenacaoComentariosDiarioAberto,
  setRespostasVisiveisComentariosDiario,
  usuarioAtualId,
  usuarioAtualPerfil,
}: UseListasDiaryCommentsRendererProps) {
  function renderizarComentariosDiarioSheet() {
    const item = comentariosDiarioItem;

    if (!item) {
      return null;
    }

    const permissoes = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });

    return (
      <ListasDiaryCommentsPanel
        comentarioCurtindoId={comentarioCurtindoId}
        comentarioRemovendoId={comentarioRemovendoId}
        comentariosDiarioExpandido={comentariosDiarioExpandido}
        comentariosDiarioItem={item}
        diarioComentarioMaxLength={DIARIO_COMENTARIO_MAX_LENGTH}
        interacoesAnotacoes={interacoesAnotacoes}
        isDesktop={isDesktop}
        menuOrdenacaoComentariosDiarioAberto={menuOrdenacaoComentariosDiarioAberto}
        onAlterarOrdenacao={alterarOrdenacaoComentariosAnotacaoListas}
        onAlternarCurtida={(anotacaoId, comentario) => void alternarCurtidaComentarioAnotacaoListas(anotacaoId, comentario)}
        onCancelReply={cancelarRespostaComentarioAnotacaoListas}
        onChangeComentario={atualizarComentarioAnotacaoListas}
        onClose={fecharComentariosDiario}
        onHandleKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            alternarExpansaoComentariosDiario();
          }
        }}
        onHandleTouchCancel={finalizarArrasteComentariosDiario}
        onHandleTouchEnd={finalizarArrasteComentariosDiario}
        onHandleTouchMove={moverArrasteComentariosDiario}
        onHandleTouchStart={iniciarArrasteComentariosDiario}
        onInsertReaction={inserirNoComentarioDiario}
        onOpenReport={abrirDenunciaDiario}
        onRemoveComment={(itemSelecionado, comentario) => void removerComentarioAnotacaoListas(itemSelecionado, comentario)}
        onReply={iniciarRespostaComentarioAnotacaoListas}
        onSend={(itemSelecionado) => void enviarComentarioAnotacaoListas(itemSelecionado)}
        onToggleExpand={alternarExpansaoComentariosDiario}
        onToggleOrdenacao={() => setMenuOrdenacaoComentariosDiarioAberto((aberto) => !aberto)}
        permissoes={permissoes}
        respostasVisiveis={respostasVisiveisComentariosDiario}
        setMenuOrdenacaoComentariosDiarioAberto={setMenuOrdenacaoComentariosDiarioAberto}
        setRespostasVisiveis={setRespostasVisiveisComentariosDiario}
        sheetRef={comentariosSheetRef}
        usuarioAtualId={usuarioAtualId}
        usuarioAtualPerfil={usuarioAtualPerfil}
      />
    );
  }

  return { renderizarComentariosDiarioSheet };
}
