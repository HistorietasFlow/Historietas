"use client";

import { createPortal } from "react-dom";
import { memo, useEffect, useRef, useState } from "react";
import type { ComentarioComunidade } from "./community-comment";
import type { ComentariosSheetProps } from "./community-comments-sheet-props";
import { CommunityCommentsSheetPanel } from "./community-comments-sheet-panel";
import { CommunityCommentsSheetOverlay } from "./community-comments-sheet-overlay";
import { CommunityCommentsSheetBackdrop } from "./community-comments-sheet-backdrop";
import { CommunityCommentsSheetHandleContainer } from "./community-comments-sheet-handle-container";
import { CommunityCommentsSheetHandleBar } from "./community-comments-sheet-handle-bar";
import { obterAriaLabelExpansaoComentariosComunidade } from "./community-comments-sheet-expansion-label";
import { deveAlternarExpansaoComentariosPorTeclaComunidade } from "./community-comments-sheet-expansion-key";
import { CommunityCommentsSheetHeaderContainer } from "./community-comments-sheet-header-container";
import { CommunityCommentsSheetHeaderSpacer } from "./community-comments-sheet-header-spacer";
import { CommunityCommentsSheetTitle } from "./community-comments-sheet-title";
import { obterTituloComentariosComunidade } from "./community-comments-title-text";
import { CommunityCommentsSortMenuContainer } from "./community-comments-sort-menu-container";
import { CommunityCommentsSortMenuTrigger } from "./community-comments-sort-menu-trigger";
import { CommunityCommentsSortMenuPanel } from "./community-comments-sort-menu-panel";
import { CommunityCommentsSortMenuItem } from "./community-comments-sort-menu-item";
import { CommunityCommentsSortMenuDivider } from "./community-comments-sort-menu-divider";
import {
  obterAriaLabelOrdenacaoComentariosComunidade,
  obterTextoOrdenacaoComentariosRecentesComunidade,
  obterTextoOrdenacaoComentariosRelevantesComunidade,
} from "./community-comments-sort-text";
import { CommunityCommentsListContainer } from "./community-comments-list-container";
import { CommunityCommentThread } from "./community-comment-thread";
import {
  CommunityCommentsEmptyMessage,
  obterTextoEstadoVazioComentariosComunidade,
  temComentariosRaizComunidade,
} from "./community-comments-empty-message";
import { CommunityCommentsErrorNotice } from "./community-comments-error-notice";
import { CommunityCommentsComposer } from "./community-comments-composer";
import { useCommunityCommentSheetActions } from "../hooks/use-community-comment-sheet-actions";
import { useCommunityCommentSheetComposer } from "../hooks/use-community-comment-sheet-composer";
import { useCommunityCommentSheetGestures } from "../hooks/use-community-comment-sheet-gestures";
import { useCommunityCommentSheetOrdering } from "../hooks/use-community-comment-sheet-ordering";

type PostComentariosComunidade = {
  id: string;
  comentarios: ComentarioComunidade[];
};

export const ComentariosSheet = memo(function ComentariosSheet({
  post,
  podeComentar,
  usuarioId,
  usuarioNome,
  usuarioAvatar,
  erroInteracao,
  isDesktop,
  onFechar,
  onEnviar,
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: ComentariosSheetProps<PostComentariosComunidade>) {
  const comentarioRef = useRef<HTMLTextAreaElement | null>(null);
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});
  const [agoraComentarios, setAgoraComentarios] = useState(() => Date.now());
  const {
    comentarioCurtindoId,
    comentarioRemovendoId,
    comentarioDenunciandoId,
    iniciarAcaoComentario,
    finalizarAcaoComentario,
    curtirComentarioSeguro,
    removerComentarioSeguro,
    denunciarComentarioSeguro,
  } = useCommunityCommentSheetActions({
    onCurtirComentario,
    onRemoverComentario,
    onDenunciarComentario,
  });
  const {
    comentarioEnviando,
    limparRespostaComentario,
    responderComentario,
    enviarComentario,
  } = useCommunityCommentSheetComposer({
    comentarioRef,
    podeComentar,
    post,
    onEnviar,
    iniciarAcaoComentario,
    finalizarAcaoComentario,
    setRespostasVisiveisPorComentario,
  });
  const {
    menuOrdenacaoAberto,
    estruturaComentarios,
    ordenacaoRelevantesAtiva,
    ordenacaoRecentesAtiva,
    alternarMenuOrdenacao,
    selecionarOrdenacaoRelevantes,
    selecionarOrdenacaoRecentes,
    fecharMenuOrdenacao,
  } = useCommunityCommentSheetOrdering({
    comentarios: post?.comentarios,
  });
  const {
    sheetRef,
    sheetExpandido,
    fecharSheetComentarios,
    iniciarArraste,
    moverArraste,
    finalizarArraste,
    alternarExpansaoComentarios,
  } = useCommunityCommentSheetGestures({
    isDesktop,
    onFecharComentarios: fecharComentarios,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgoraComentarios(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  function fecharComentarios() {
    fecharMenuOrdenacao();
    limparRespostaComentario();
    onFechar();
  }

  function inserirNoComentario(valor: string) {
    if (!podeComentar || !comentarioRef.current) {
      return;
    }

    const campo = comentarioRef.current;
    const inicio = campo.selectionStart ?? campo.value.length;
    const fim = campo.selectionEnd ?? campo.value.length;
    const textoAtual = campo.value;

    campo.value = `${textoAtual.slice(0, inicio)}${valor}${textoAtual.slice(fim)}`.slice(
      0,
      420
    );
    campo.focus();

    const novaPosicao = Math.min(inicio + valor.length, campo.value.length);
    campo.setSelectionRange(novaPosicao, novaPosicao);
  }

  if (!post || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <CommunityCommentsSheetOverlay>
      <CommunityCommentsSheetBackdrop onClick={fecharSheetComentarios} />

      <CommunityCommentsSheetPanel
        ref={sheetRef}
        isDesktop={isDesktop}
        expanded={sheetExpandido}
      >
        <CommunityCommentsSheetHandleContainer
          data-comments-sheet-handle="true"
          onClick={alternarExpansaoComentarios}
          onTouchStart={iniciarArraste}
          onTouchMove={moverArraste}
          onTouchEnd={finalizarArraste}
          onTouchCancel={finalizarArraste}
          role="button"
          tabIndex={0}
          aria-label={obterAriaLabelExpansaoComentariosComunidade(
            sheetExpandido
          )}
          onKeyDown={(event) => {
            if (
              deveAlternarExpansaoComentariosPorTeclaComunidade(event.key)
            ) {
              event.preventDefault();
              alternarExpansaoComentarios();
            }
          }}
        >
          <CommunityCommentsSheetHandleBar />
        </CommunityCommentsSheetHandleContainer>

        <CommunityCommentsSheetHeaderContainer>
          <CommunityCommentsSheetHeaderSpacer />

          <CommunityCommentsSheetTitle>
            {obterTituloComentariosComunidade(post.comentarios.length)}
          </CommunityCommentsSheetTitle>

          <CommunityCommentsSortMenuContainer>
            <CommunityCommentsSortMenuTrigger
              type="button"
              onClick={alternarMenuOrdenacao}
              aria-label={obterAriaLabelOrdenacaoComentariosComunidade()}
              aria-haspopup="menu"
              aria-expanded={menuOrdenacaoAberto}
            >
              +
            </CommunityCommentsSortMenuTrigger>

            {menuOrdenacaoAberto ? (
              <CommunityCommentsSortMenuPanel role="menu">
                <CommunityCommentsSortMenuItem
                  type="button"
                  onClick={selecionarOrdenacaoRelevantes}
                  active={ordenacaoRelevantesAtiva}
                  role="menuitem"
                >
                  {obterTextoOrdenacaoComentariosRelevantesComunidade()}
                </CommunityCommentsSortMenuItem>

                <CommunityCommentsSortMenuDivider />

                <CommunityCommentsSortMenuItem
                  type="button"
                  onClick={selecionarOrdenacaoRecentes}
                  active={ordenacaoRecentesAtiva}
                  role="menuitem"
                >
                  {obterTextoOrdenacaoComentariosRecentesComunidade()}
                </CommunityCommentsSortMenuItem>
              </CommunityCommentsSortMenuPanel>
            ) : null}
          </CommunityCommentsSortMenuContainer>
        </CommunityCommentsSheetHeaderContainer>

        <CommunityCommentsListContainer>
          {temComentariosRaizComunidade(
            estruturaComentarios.comentariosRaiz
          ) ? (
            estruturaComentarios.comentariosRaiz.map((comentario) => (
              <CommunityCommentThread
                key={comentario.id}
                comentario={comentario}
                respostasPorRaiz={estruturaComentarios.respostasPorRaiz}
                respostasVisiveisPorComentario={
                  respostasVisiveisPorComentario
                }
                setRespostasVisiveisPorComentario={
                  setRespostasVisiveisPorComentario
                }
                usuarioId={usuarioId}
                podeComentar={podeComentar}
                agoraComentarios={agoraComentarios}
                postId={post?.id || ""}
                comentarioCurtindoId={comentarioCurtindoId}
                comentarioRemovendoId={comentarioRemovendoId}
                comentarioDenunciandoId={comentarioDenunciandoId}
                onResponderComentario={responderComentario}
                onCurtirComentario={curtirComentarioSeguro}
                onRemoverComentario={removerComentarioSeguro}
                onDenunciarComentario={denunciarComentarioSeguro}
              />
            ))
          ) : (
            <CommunityCommentsEmptyMessage>
              {obterTextoEstadoVazioComentariosComunidade()}
            </CommunityCommentsEmptyMessage>
          )}
        </CommunityCommentsListContainer>

        {erroInteracao ? (
          <CommunityCommentsErrorNotice>
            {erroInteracao}
          </CommunityCommentsErrorNotice>
        ) : null}

        <CommunityCommentsComposer
          comentarioRef={comentarioRef}
          podeComentar={podeComentar}
          usuarioAvatar={usuarioAvatar}
          usuarioNome={usuarioNome}
          comentarioEnviando={comentarioEnviando}
          onInserirNoComentario={inserirNoComentario}
          onEnviarComentario={enviarComentario}
        />
      </CommunityCommentsSheetPanel>
    </CommunityCommentsSheetOverlay>,
    document.body
  );
});
