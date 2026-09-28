"use client";

import { createPortal } from "react-dom";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, TouchEvent } from "react";
import type { ComentarioComunidade } from "./community-comment";
import { deveDesabilitarAcaoComentarioComunidade } from "./community-comment-interaction-status";
import {
  alternarMenuOrdenacaoComentariosComunidade,
  ordenacaoComentariosEhRecentesComunidade,
  ordenacaoComentariosEhRelevantesComunidade,
  selecionarOrdenacaoComentariosRecentesComunidade,
  selecionarOrdenacaoComentariosRelevantesComunidade,
  type OrdenacaoComentariosComunidade,
} from "./community-comment-order";
import type { RespostaComentarioComunidade } from "./community-comment-reply";
import {
  criarEstruturaComentariosComunidade,
  obterRespostasComentarioComunidade,
} from "./community-comment-tree";
import type { ComentariosSheetProps } from "./community-comments-sheet-props";
import { CommunityCommentsSheetPanel } from "./community-comments-sheet-panel";
import { CommunityCommentsSheetOverlay } from "./community-comments-sheet-overlay";
import { CommunityCommentsSheetBackdrop } from "./community-comments-sheet-backdrop";
import { CommunityCommentsSheetHandleContainer } from "./community-comments-sheet-handle-container";
import { CommunityCommentsSheetHandleBar } from "./community-comments-sheet-handle-bar";
import { obterAriaLabelExpansaoComentariosComunidade } from "./community-comments-sheet-expansion-label";
import { deveAlternarExpansaoComentariosPorTeclaComunidade } from "./community-comments-sheet-expansion-key";
import {
  deveExpandirComentariosPorArrasteComunidade,
  deveFecharComentariosPorArrasteComunidade,
  deveRecolherComentariosPorArrasteComunidade,
} from "./community-comments-sheet-drag-decisions";
import {
  obterLimiteInferiorArrasteComentariosComunidade,
  obterLimiteSuperiorArrasteComentariosComunidade,
} from "./community-comments-sheet-drag-limits";
import {
  calcularDeslocamentoArrasteComentariosComunidade,
  deveIgnorarCliqueAposArrasteComunidade,
  obterPosicaoAtualArrasteComentariosComunidade,
} from "./community-comments-sheet-drag-motion";
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
import { CommunityCommentThreadContainer } from "./community-comment-thread-container";
import { CommunityCommentItem } from "./community-comment-item";
import { CommunityCommentRepliesListContainer } from "./community-comment-replies-list-container";
import { CommunityCommentRepliesToggleButton } from "./community-comment-replies-toggle-button";
import {
  obterTextoBotaoOcultarRespostasComunidade,
  obterTextoBotaoVerMaisRespostasComunidade,
  obterTextoBotaoVerRespostasComunidade,
} from "./community-comment-replies-action-text";
import {
  deveExibirBotaoVerRespostasComunidade,
  respostasEstaoExpandidasComunidade,
  temRespostasOcultasComunidade,
  temRespostasVisiveisComunidade,
} from "./community-comment-replies-visibility";
import {
  obterQuantidadeRespostasOcultasComunidade,
  obterQuantidadeRespostasVisiveisComunidade,
  obterRespostasVisiveisComunidade,
} from "./community-comment-replies-pagination";
import {
  mostrarMaisRespostasComunidade,
  mostrarRespostasIniciaisComunidade,
  ocultarRespostasComunidade,
} from "./community-comment-replies-pagination-actions";
import { CommunityCommentRepliesControlsContainer } from "./community-comment-replies-controls-container";
import { CommunityCommentRepliesHideButton } from "./community-comment-replies-hide-button";
import {
  CommunityCommentsEmptyMessage,
  obterTextoEstadoVazioComentariosComunidade,
  temComentariosRaizComunidade,
} from "./community-comments-empty-message";
import { CommunityCommentsErrorNotice } from "./community-comments-error-notice";
import { CommunityCommentsToolsContainer } from "./community-comments-tools-container";
import { CommunityCommentsQuickReactionsContainer } from "./community-comments-quick-reactions-container";
import { CommunityCommentsQuickReactionButton } from "./community-comments-quick-reaction-button";
import {
  obterAriaLabelReacaoRapidaComunidade,
  obterReacoesRapidasComentarioComunidade,
} from "./community-comments-quick-reaction-label";
import { CommunityCommentsFormContainer } from "./community-comments-form-container";
import {
  CommunityCommentsInputAvatar,
  deveExibirInicialAvatarFormularioComentarioComunidade,
  obterAvatarFormularioComentarioComunidade,
  obterInicialAvatarFormularioComentarioComunidade,
} from "./community-comments-input-avatar";
import { CommunityCommentsInputBox } from "./community-comments-input-box";
import { CommunityCommentsTextarea } from "./community-comments-textarea";
import {
  obterAriaLabelEnvioComentarioComunidade,
  obterAriaLabelMencaoComentarioComunidade,
  obterTextoBotaoEnviarComentarioComunidade,
  obterTextoCampoComentarioComunidade,
} from "./community-comments-composer-text";
import {
  deveDesabilitarInteracaoComentarioComunidade,
  envioComentarioEstaAtivoComunidade,
} from "./community-comments-composer-status";
import { CommunityCommentsMentionButton } from "./community-comments-mention-button";
import { CommunityCommentsSendButton } from "./community-comments-send-button";

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
  const sheetRef = useRef<HTMLElement | null>(null);
  const dragStartYRef = useRef(0);
  const dragOffsetYRef = useRef(0);
  const dragIgnorarCliqueRef = useRef(false);
  const dragResetTimerRef = useRef<number | null>(null);
  const [sheetExpandido, setSheetExpandido] = useState(false);
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState<string | null>(null);
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState<string | null>(null);
  const [comentarioDenunciandoId, setComentarioDenunciandoId] = useState<string | null>(null);
  const [respostaComentario, setRespostaComentario] =
    useState<RespostaComentarioComunidade | null>(null);
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});
  const [ordenacaoComentarios, setOrdenacaoComentarios] =
    useState<OrdenacaoComentariosComunidade>("relevantes");
  const [menuOrdenacaoAberto, setMenuOrdenacaoAberto] = useState(false);
  const [agoraComentarios, setAgoraComentarios] = useState(() => Date.now());
  const comentarioAcoesRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgoraComentarios(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);

      if (dragResetTimerRef.current !== null) {
        window.clearTimeout(dragResetTimerRef.current);
      }
    };
  }, []);

  const estruturaComentarios = useMemo(
    () =>
      criarEstruturaComentariosComunidade(
        post?.comentarios || [],
        ordenacaoComentarios
      ),
    [ordenacaoComentarios, post?.comentarios]
  );

  function fecharComentarios() {
    setSheetExpandido(false);
    setMenuOrdenacaoAberto(false);
    setRespostaComentario(null);
    dragOffsetYRef.current = 0;
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

  function iniciarAcaoComentario(chave: string) {
    if (comentarioAcoesRef.current.has(chave)) {
      return false;
    }

    comentarioAcoesRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComentario(chave: string) {
    comentarioAcoesRef.current.delete(chave);
  }

  async function curtirComentarioSeguro(postId: string, comentarioId: string) {
    const chaveAcao = `curtir-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioCurtindoId(comentarioId);

    try {
      await onCurtirComentario(postId, comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioCurtindoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  async function removerComentarioSeguro(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioRemovendoId(comentarioId);

    try {
      await onRemoverComentario(postId, comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioRemovendoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  async function denunciarComentarioSeguro(comentarioId: string) {
    const chaveAcao = `denunciar-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioDenunciandoId(comentarioId);

    try {
      await onDenunciarComentario(comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioDenunciandoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  function responderComentario(
    comentario: ComentarioComunidade,
    comentarioRaizId: string
  ) {
    if (!podeComentar) {
      return;
    }

    const nomeLimpo = comentario.autorNome.replace(/\s+/g, " ").trim();
    const raizIdLimpo = comentarioRaizId.trim();

    if (!nomeLimpo || !raizIdLimpo) {
      return;
    }

    setRespostaComentario({
      comentarioPaiId: raizIdLimpo,
      autorId: comentario.autorId,
      autorNome: nomeLimpo,
    });

    window.setTimeout(() => {
      if (!comentarioRef.current) {
        return;
      }

      const mencao = `@${nomeLimpo} `;
      comentarioRef.current.value = mencao;
      comentarioRef.current.focus();
      comentarioRef.current.setSelectionRange(mencao.length, mencao.length);
    }, 0);
  }

  function iniciarArraste(event: TouchEvent<HTMLDivElement>) {
    if (isDesktop) {
      return;
    }

    dragStartYRef.current = event.touches[0]?.clientY || 0;
    dragOffsetYRef.current = 0;
    dragIgnorarCliqueRef.current = false;

    if (dragResetTimerRef.current !== null) {
      window.clearTimeout(dragResetTimerRef.current);
      dragResetTimerRef.current = null;
    }

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }

  function moverArraste(event: TouchEvent<HTMLDivElement>) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual = obterPosicaoAtualArrasteComentariosComunidade(
      event.touches[0]?.clientY,
      dragStartYRef.current
    );
    const limiteSuperior =
      obterLimiteSuperiorArrasteComentariosComunidade(sheetExpandido);
    const limiteInferior =
      obterLimiteInferiorArrasteComentariosComunidade(sheetExpandido);
    const deslocamento = calcularDeslocamentoArrasteComentariosComunidade(
      limiteSuperior,
      limiteInferior,
      posicaoAtual,
      dragStartYRef.current
    );

    dragOffsetYRef.current = deslocamento;

    if (deveIgnorarCliqueAposArrasteComunidade(deslocamento)) {
      dragIgnorarCliqueRef.current = true;
    }

    if (sheetRef.current) {
      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
      }
    }
  }

  function finalizarArraste() {
    if (isDesktop) {
      return;
    }

    const deslocamento = dragOffsetYRef.current;

    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 220ms ease";

      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transition = "transform 160ms ease";
        handle.style.transform = "";
      }
    }

    if (dragIgnorarCliqueRef.current) {
      dragResetTimerRef.current = window.setTimeout(() => {
        dragIgnorarCliqueRef.current = false;
        dragResetTimerRef.current = null;
      }, 350);
    }

    if (deveExpandirComentariosPorArrasteComunidade(deslocamento)) {
      setSheetExpandido(true);
      return;
    }

    if (
      deveRecolherComentariosPorArrasteComunidade(
        deslocamento,
        sheetExpandido
      )
    ) {
      setSheetExpandido(false);
      return;
    }

    if (
      deveFecharComentariosPorArrasteComunidade(deslocamento, sheetExpandido)
    ) {
      fecharComentarios();
    }
  }

  function alternarExpansaoComentarios() {
    if (isDesktop || dragIgnorarCliqueRef.current) {
      return;
    }

    setSheetExpandido((expandidoAtual) => !expandidoAtual);
  }

  async function enviarComentario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!post) {
      return;
    }

    const chaveAcao = `enviar-comentario:${post.id}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioEnviando(true);

    try {
      const conteudoComentario = comentarioRef.current?.value || "";
      const respostaAnterior = respostaComentario;
      const enviado = await onEnviar(
        post.id,
        conteudoComentario,
        respostaAnterior?.comentarioPaiId || ""
      );

      if (enviado && comentarioRef.current) {
        comentarioRef.current.value = "";
        setRespostaComentario(null);

        if (respostaAnterior?.comentarioPaiId) {
          setRespostasVisiveisPorComentario((estadoAtual) => ({
            ...estadoAtual,
            [respostaAnterior.comentarioPaiId]: Math.max(
              5,
              estadoAtual[respostaAnterior.comentarioPaiId] || 0
            ),
          }));
        }
      }
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioEnviando(false);
    }
  }

  if (!post || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <CommunityCommentsSheetOverlay>
      <CommunityCommentsSheetBackdrop onClick={fecharComentarios} />

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
              onClick={() =>
                alternarMenuOrdenacaoComentariosComunidade(
                  setMenuOrdenacaoAberto
                )
              }
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
                  onClick={() =>
                    selecionarOrdenacaoComentariosRelevantesComunidade({
                      setOrdenacaoComentarios,
                      setMenuOrdenacaoAberto,
                    })
                  }
                  active={ordenacaoComentariosEhRelevantesComunidade(
                    ordenacaoComentarios
                  )}
                  role="menuitem"
                >
                  {obterTextoOrdenacaoComentariosRelevantesComunidade()}
                </CommunityCommentsSortMenuItem>

                <CommunityCommentsSortMenuDivider />

                <CommunityCommentsSortMenuItem
                  type="button"
                  onClick={() =>
                    selecionarOrdenacaoComentariosRecentesComunidade({
                      setOrdenacaoComentarios,
                      setMenuOrdenacaoAberto,
                    })
                  }
                  active={ordenacaoComentariosEhRecentesComunidade(
                    ordenacaoComentarios
                  )}
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
            estruturaComentarios.comentariosRaiz.map((comentario) => {
              const respostas = obterRespostasComentarioComunidade(
                estruturaComentarios.respostasPorRaiz,
                comentario.id
              );
              const quantidadeVisivel =
                obterQuantidadeRespostasVisiveisComunidade(
                  respostas,
                  respostasVisiveisPorComentario,
                  comentario
                );
              const respostasVisiveis = obterRespostasVisiveisComunidade(
                respostas,
                quantidadeVisivel
              );
              const respostasOcultas =
                obterQuantidadeRespostasOcultasComunidade(
                  respostas,
                  quantidadeVisivel
                );
              const respostasExpandidas =
                respostasEstaoExpandidasComunidade(quantidadeVisivel);

              return (
                <CommunityCommentThreadContainer key={comentario.id}>
                  <CommunityCommentItem
                    key={comentario.id}
                    comentario={comentario}
                    comentarioRaizId={comentario.id}
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

                  {temRespostasVisiveisComunidade(respostasVisiveis) ? (
                    <CommunityCommentRepliesListContainer>
                      {respostasVisiveis.map((resposta) => (
                        <CommunityCommentItem
                          key={resposta.id}
                          comentario={resposta}
                          comentarioRaizId={comentario.id}
                          resposta
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
                      ))}
                    </CommunityCommentRepliesListContainer>
                  ) : null}

                  {deveExibirBotaoVerRespostasComunidade(
                    respostas,
                    respostasExpandidas
                  ) ? (
                    <CommunityCommentRepliesToggleButton
                      type="button"
                      onClick={() =>
                        mostrarRespostasIniciaisComunidade({
                          respostas,
                          comentario,
                          setRespostasVisiveisPorComentario,
                        })
                      }
                    >
                      {obterTextoBotaoVerRespostasComunidade(respostas.length)}
                    </CommunityCommentRepliesToggleButton>
                  ) : null}

                  {respostasExpandidas ? (
                    <CommunityCommentRepliesControlsContainer>
                      {temRespostasOcultasComunidade(respostasOcultas) ? (
                        <CommunityCommentRepliesToggleButton
                          type="button"
                          onClick={() =>
                            mostrarMaisRespostasComunidade({
                              respostas,
                              comentario,
                              setRespostasVisiveisPorComentario,
                            })
                          }
                        >
                          {obterTextoBotaoVerMaisRespostasComunidade(
                            respostasOcultas
                          )}
                        </CommunityCommentRepliesToggleButton>
                      ) : null}

                      <CommunityCommentRepliesHideButton
                        type="button"
                        onClick={() =>
                          ocultarRespostasComunidade({
                            comentario,
                            setRespostasVisiveisPorComentario,
                          })
                        }
                      >
                        {obterTextoBotaoOcultarRespostasComunidade()}
                      </CommunityCommentRepliesHideButton>
                    </CommunityCommentRepliesControlsContainer>
                  ) : null}
                </CommunityCommentThreadContainer>
              );
            })
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

        <CommunityCommentsToolsContainer>
          <CommunityCommentsQuickReactionsContainer>
            {obterReacoesRapidasComentarioComunidade().map((emoji) => (
              <CommunityCommentsQuickReactionButton
                key={emoji}
                type="button"
                onClick={() => inserirNoComentario(emoji)}
                disabled={deveDesabilitarAcaoComentarioComunidade(
                  podeComentar
                )}
                aria-label={obterAriaLabelReacaoRapidaComunidade(emoji)}
              >
                {emoji}
              </CommunityCommentsQuickReactionButton>
            ))}
          </CommunityCommentsQuickReactionsContainer>
        </CommunityCommentsToolsContainer>

        <CommunityCommentsFormContainer onSubmit={enviarComentario}>
          <CommunityCommentsInputAvatar
            avatar={obterAvatarFormularioComentarioComunidade(
              podeComentar,
              usuarioAvatar
            )}
          >
            {deveExibirInicialAvatarFormularioComentarioComunidade(
              podeComentar,
              usuarioAvatar
            ) &&
              obterInicialAvatarFormularioComentarioComunidade(
                podeComentar,
                usuarioNome
              )}
          </CommunityCommentsInputAvatar>

          <CommunityCommentsInputBox>
            <CommunityCommentsTextarea
              aria-label={obterTextoCampoComentarioComunidade(podeComentar)}
              ref={comentarioRef}
              placeholder={obterTextoCampoComentarioComunidade(podeComentar)}
              disabled={deveDesabilitarInteracaoComentarioComunidade(
                podeComentar,
                comentarioEnviando
              )}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="send"
              maxLength={420}
              rows={1}
            />
          </CommunityCommentsInputBox>

          <CommunityCommentsMentionButton
            type="button"
            onClick={() => inserirNoComentario("@")}
            disabled={deveDesabilitarAcaoComentarioComunidade(podeComentar)}
            aria-label={obterAriaLabelMencaoComentarioComunidade()}
          >
            @
          </CommunityCommentsMentionButton>

          <CommunityCommentsSendButton
            type="submit"
            aria-label={obterAriaLabelEnvioComentarioComunidade()}
            disabled={deveDesabilitarInteracaoComentarioComunidade(
              podeComentar,
              comentarioEnviando
            )}
            active={envioComentarioEstaAtivoComunidade(
              podeComentar,
              comentarioEnviando
            )}
          >
            {obterTextoBotaoEnviarComentarioComunidade(comentarioEnviando)}
          </CommunityCommentsSendButton>
        </CommunityCommentsFormContainer>
      </CommunityCommentsSheetPanel>
    </CommunityCommentsSheetOverlay>,
    document.body
  );
});
