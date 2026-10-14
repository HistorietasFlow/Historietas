import type {
  Dispatch,
  KeyboardEvent,
  RefObject,
  SetStateAction,
  TouchEvent,
} from "react";
import {
  ListasDiaryComment,
  type ListasDiaryCommentStyles,
} from "./listas-diary-comment";
import {
  ListasDiaryCommentThread,
  type ListasDiaryCommentThreadStyles,
} from "./listas-diary-comment-thread";
import {
  ListasDiaryCommentsSheet,
  type ListasDiaryCommentsSheetStyles,
} from "./listas-diary-comments-sheet";
import {
  criarInteracaoAnotacaoListasVazia,
  obterRespostasComentarioDiarioListas,
  ordenarComentariosRaizDiarioListas,
  type ComentarioAnotacaoListas,
  type InteracaoAnotacaoListas,
} from "../lib/listas-diary-comment-utils";
import { formatarDataCurta } from "../lib/listas-format-utils";
import { criarAvatarComentarioDiarioListasStyle } from "../lib/listas-diary-comments-styles";
import { idUsuarioValido } from "../lib/listas-value-utils";
import {
  commentActionsRowStyle,
  commentAuthorLinkStyle,
  commentAvatarLinkStyle,
  commentContentStyle,
  commentHeartIconStyle,
  commentItemStyle,
  commentLikeButtonStyle,
  commentLikeCountStyle,
  commentLikeWrapStyle,
  commentRemoveButtonStyle,
  commentRepliesControlsStyle,
  commentRepliesHideButtonStyle,
  commentRepliesLineStyle,
  commentRepliesListStyle,
  commentRepliesToggleStyle,
  commentReplyAvatarLinkStyle,
  commentReplyItemStyle,
  commentReportButtonStyle,
  commentReplyButtonStyle,
  commentsInputAvatarStyle,
  commentsInputBoxStyle,
  commentsInputIconButtonStyle,
  commentsLoadingStyle,
  commentsQuickReactionButtonStyle,
  commentsQuickReactionsStyle,
  commentsReplyingBannerStyle,
  commentsReplyingCancelStyle,
  commentsSheetBackdropStyle,
  commentsSheetCompactStyle,
  commentsSheetErrorStyle,
  commentsSheetExpandedStyle,
  commentsSheetFormStyle,
  commentsSheetHandleStyle,
  commentsSheetHandleWrapStyle,
  commentsSheetHeaderSpacerStyle,
  commentsSheetHeaderStyle,
  commentsSheetInputStyle,
  commentsSheetListStyle,
  commentsSheetOverlayStyle,
  commentsSheetSendStyle,
  commentsSheetStyle,
  commentsSheetTitleStyle,
  commentsSortMenuDividerStyle,
  commentsSortMenuItemActiveStyle,
  commentsSortMenuItemStyle,
  commentsSortMenuStyle,
  commentsSortMenuTriggerStyle,
  commentsSortMenuWrapStyle,
  commentsToolsStyle,
  commentTextStyle,
  commentThreadStyle,
  commentTimeStyle,
  commentTopLineStyle,
  desktopCommentsSheetStyle,
  emptyCommentsStyle,
} from "../lib/listas-diary-comments-styles";

type ItemDiarioListas = {
  anotacaoId?: string;
  obra: { titulo: string };
};

type PerfilAtualListas = { avatar: string; nome: string } | null;

type PermissoesComentarios = {
  podeComentar: boolean;
};

type ListasDiaryCommentsPanelProps<TItem extends ItemDiarioListas> = {
  comentarioCurtindoId: string;
  comentarioRemovendoId: string;
  comentariosDiarioExpandido: boolean;
  comentariosDiarioItem: TItem | null;
  diarioComentarioMaxLength: number;
  interacoesAnotacoes: Record<string, InteracaoAnotacaoListas | undefined>;
  isDesktop: boolean;
  menuOrdenacaoComentariosDiarioAberto: boolean;
  onAlterarOrdenacao: (anotacaoId: string, ordenacao: "relevantes" | "recentes") => void;
  onAlternarCurtida: (anotacaoId: string, comentario: ComentarioAnotacaoListas) => void;
  onCancelReply: (anotacaoId: string) => void;
  onChangeComentario: (anotacaoId: string, texto: string) => void;
  onClose: () => void;
  onHandleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onHandleTouchCancel: () => void;
  onHandleTouchEnd: () => void;
  onHandleTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  onHandleTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onInsertReaction: (texto: string) => void;
  onOpenReport: (tipo: "comentario_diario", id: string, titulo: string, usuarioId: string) => void;
  onRemoveComment: (item: TItem, comentario: ComentarioAnotacaoListas) => void;
  onReply: (anotacaoId: string, comentario: ComentarioAnotacaoListas) => void;
  onSend: (item: TItem) => void;
  onToggleExpand: () => void;
  onToggleOrdenacao: () => void;
  permissoes: PermissoesComentarios;
  respostasVisiveis: Record<string, number>;
  setMenuOrdenacaoComentariosDiarioAberto: Dispatch<SetStateAction<boolean>>;
  setRespostasVisiveis: Dispatch<SetStateAction<Record<string, number>>>;
  sheetRef: RefObject<HTMLElement | null>;
  usuarioAtualId: string;
  usuarioAtualPerfil: PerfilAtualListas;
};

export function ListasDiaryCommentsPanel<TItem extends ItemDiarioListas>({
  comentarioCurtindoId,
  comentarioRemovendoId,
  comentariosDiarioExpandido,
  comentariosDiarioItem,
  diarioComentarioMaxLength,
  interacoesAnotacoes,
  isDesktop,
  menuOrdenacaoComentariosDiarioAberto,
  onAlterarOrdenacao,
  onAlternarCurtida,
  onCancelReply,
  onChangeComentario,
  onClose,
  onHandleKeyDown,
  onHandleTouchCancel,
  onHandleTouchEnd,
  onHandleTouchMove,
  onHandleTouchStart,
  onInsertReaction,
  onOpenReport,
  onRemoveComment,
  onReply,
  onSend,
  onToggleExpand,
  onToggleOrdenacao,
  permissoes,
  respostasVisiveis,
  setMenuOrdenacaoComentariosDiarioAberto,
  setRespostasVisiveis,
  sheetRef,
  usuarioAtualId,
  usuarioAtualPerfil,
}: ListasDiaryCommentsPanelProps<TItem>) {
  const item = comentariosDiarioItem;

  if (!item || typeof document === "undefined") {
    return null;
  }

  const itemSelecionado = item;
  const anotacaoId = itemSelecionado.anotacaoId?.trim() || "";

  if (!anotacaoId) {
    return null;
  }

  const interacao = interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
  const comentariosRaiz = ordenarComentariosRaizDiarioListas(
    interacao.comentarios,
    interacao.ordenacaoComentarios,
  );
  const commentStyles: ListasDiaryCommentStyles = {
    actionsRow: commentActionsRowStyle, authorLink: commentAuthorLinkStyle,
    content: commentContentStyle, heartIcon: commentHeartIconStyle, item: commentItemStyle,
    likeButton: commentLikeButtonStyle, likeCount: commentLikeCountStyle, likeWrap: commentLikeWrapStyle,
    removeButton: commentRemoveButtonStyle, replyButton: commentReplyButtonStyle, replyItem: commentReplyItemStyle,
    reportButton: commentReportButtonStyle, text: commentTextStyle, time: commentTimeStyle, topLine: commentTopLineStyle,
  };
  const threadStyles: ListasDiaryCommentThreadStyles = {
    controls: commentRepliesControlsStyle, hideButton: commentRepliesHideButtonStyle, line: commentRepliesLineStyle,
    repliesList: commentRepliesListStyle, thread: commentThreadStyle, toggle: commentRepliesToggleStyle,
  };
  const sheetStyles: ListasDiaryCommentsSheetStyles = {
    backdrop: commentsSheetBackdropStyle, compact: commentsSheetCompactStyle, desktop: desktopCommentsSheetStyle,
    empty: emptyCommentsStyle, error: commentsSheetErrorStyle, expanded: commentsSheetExpandedStyle,
    form: commentsSheetFormStyle, handle: commentsSheetHandleStyle, handleWrap: commentsSheetHandleWrapStyle,
    header: commentsSheetHeaderStyle, headerSpacer: commentsSheetHeaderSpacerStyle, input: commentsSheetInputStyle,
    inputBox: commentsInputBoxStyle, inputIconButton: commentsInputIconButtonStyle, list: commentsSheetListStyle,
    loading: commentsLoadingStyle, overlay: commentsSheetOverlayStyle, panel: commentsSheetStyle,
    quickReactionButton: commentsQuickReactionButtonStyle, quickReactions: commentsQuickReactionsStyle,
    replyingBanner: commentsReplyingBannerStyle, replyingCancel: commentsReplyingCancelStyle, send: commentsSheetSendStyle,
    sortMenu: commentsSortMenuStyle, sortMenuDivider: commentsSortMenuDividerStyle, sortMenuItem: commentsSortMenuItemStyle,
    sortMenuItemActive: commentsSortMenuItemActiveStyle, sortMenuTrigger: commentsSortMenuTriggerStyle,
    sortMenuWrap: commentsSortMenuWrapStyle, title: commentsSheetTitleStyle, tools: commentsToolsStyle,
  };

  function renderizarComentario(comentario: ComentarioAnotacaoListas, resposta = false) {
    const comentarioEhProprio = Boolean(usuarioAtualId) && comentario.userId === usuarioAtualId;
    const comentarioCurtiu = Boolean(usuarioAtualId && comentario.curtidas.includes(usuarioAtualId));
    const hrefPerfil = idUsuarioValido(comentario.userId)
      ? `/perfil-autor?autorId=${encodeURIComponent(comentario.userId)}` : "/perfil-autor";
    const avatarBaseStyle = resposta ? commentReplyAvatarLinkStyle : commentAvatarLinkStyle;
    return <ListasDiaryComment
      key={comentario.id}
      avatarContent={!comentario.autorAvatar && (comentario.autorNome.slice(0, 1).toUpperCase() || "U")}
      avatarStyle={criarAvatarComentarioDiarioListasStyle(avatarBaseStyle, comentario.autorAvatar)}
      carregandoCurtida={comentarioCurtindoId === comentario.id}
      comentario={comentario}
      comentarioCurtiu={comentarioCurtiu}
      comentarioEhProprio={comentarioEhProprio}
      formatarData={formatarDataCurta}
      hrefPerfil={hrefPerfil}
      onLike={() => onAlternarCurtida(anotacaoId, comentario)}
      onRemove={() => onRemoveComment(itemSelecionado, comentario)}
      onReply={() => onReply(anotacaoId, comentario)}
      onReport={() => onOpenReport("comentario_diario", comentario.id, `Comentário de ${comentario.autorNome} em ${itemSelecionado.obra.titulo}`, comentario.userId)}
      podeResponder={permissoes.podeComentar}
      removendoComentario={comentarioRemovendoId === comentario.id}
      resposta={resposta}
      styles={commentStyles}
    />;
  }

  function renderizarThread(comentario: ComentarioAnotacaoListas) {
    const respostas = obterRespostasComentarioDiarioListas(interacao.comentarios, comentario.id);
    const quantidadeVisivel = Math.min(respostas.length, respostasVisiveis[comentario.id] || 0);
    const respostasOcultas = Math.max(0, respostas.length - quantidadeVisivel);
    return <ListasDiaryCommentThread
      key={comentario.id}
      comentario={renderizarComentario(comentario)}
      onCollapseReplies={() => setRespostasVisiveis((atuais) => ({ ...atuais, [comentario.id]: 0 }))}
      onExpandReplies={() => setRespostasVisiveis((atuais) => ({ ...atuais, [comentario.id]: Math.min(5, respostas.length) }))}
      onShowMoreReplies={() => setRespostasVisiveis((atuais) => ({ ...atuais, [comentario.id]: Math.min(respostas.length, (atuais[comentario.id] || 0) + 5) }))}
      quantidadeRespostas={respostas.length}
      quantidadeRespostasOcultas={respostasOcultas}
      respostas={respostas.slice(0, quantidadeVisivel).map((resposta) => renderizarComentario(resposta, true))}
      respostasExpandidas={quantidadeVisivel > 0}
      styles={threadStyles}
    />;
  }

  return <ListasDiaryCommentsSheet
    ariaLabelTextarea={permissoes.podeComentar ? interacao.respondendoComentarioId ? "Adicionar resposta" : "Adicionar comentário" : "Comentários limitados pelo dono do Diário"}
    avatar={<div style={criarAvatarComentarioDiarioListasStyle(commentsInputAvatarStyle, permissoes.podeComentar ? usuarioAtualPerfil?.avatar || "" : "")}>{!(permissoes.podeComentar && usuarioAtualPerfil?.avatar) && (permissoes.podeComentar ? usuarioAtualPerfil?.nome || "U" : "H").slice(0, 1).toUpperCase()}</div>}
    comentario={interacao.novoComentario}
    comentarioEmEnvio={interacao.enviandoComentario}
    comentarios={comentariosRaiz.map(renderizarThread)}
    comentariosCarregando={interacao.carregando}
    comentariosErro={interacao.erro}
    comentariosExpandido={comentariosDiarioExpandido}
    comentariosTemPermissao={permissoes.podeComentar}
    comentariosTemRaiz={comentariosRaiz.length > 0}
    comentariosTotal={interacao.comentarios.length}
    isDesktop={isDesktop}
    maxLength={diarioComentarioMaxLength}
    menuOrdenacaoAberto={menuOrdenacaoComentariosDiarioAberto}
    onCancelReply={() => onCancelReply(anotacaoId)}
    onChangeComentario={(texto) => onChangeComentario(anotacaoId, texto)}
    onClose={onClose}
    onHandleKeyDown={onHandleKeyDown}
    onHandleTouchCancel={onHandleTouchCancel}
    onHandleTouchEnd={onHandleTouchEnd}
    onHandleTouchMove={onHandleTouchMove}
    onHandleTouchStart={onHandleTouchStart}
    onInsertReaction={onInsertReaction}
    onSelectOrdenacao={(ordenacao) => { onAlterarOrdenacao(anotacaoId, ordenacao); setMenuOrdenacaoComentariosDiarioAberto(false); }}
    onSubmit={(event) => { event.preventDefault(); onSend(item); }}
    onToggleExpand={onToggleExpand}
    onToggleOrdenacao={onToggleOrdenacao}
    ordenacao={interacao.ordenacaoComentarios}
    placeholderTextarea={permissoes.podeComentar ? interacao.respondendoComentarioId ? "Adicionar resposta..." : "Adicionar comentário..." : "Comentários limitados pelo dono do Diário."}
    quickReactions={["💗", "🔥", "😂", "😮", "😭", "👏"]}
    respondendoAutorNome={interacao.respondendoAutorNome}
    respondendoComentarioId={interacao.respondendoComentarioId}
    sheetRef={sheetRef}
    styles={sheetStyles}
    tituloObra={item.obra.titulo}
  />;
}
