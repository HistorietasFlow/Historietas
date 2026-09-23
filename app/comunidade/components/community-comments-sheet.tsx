"use client";

import { createPortal } from "react-dom";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, TouchEvent } from "react";
import type { ComentarioComunidade } from "./community-comment";
import { formatarTempoRelativoComentarioComunidade } from "./community-comment-relative-time";
import type { OrdenacaoComentariosComunidade } from "./community-comment-order";
import type { RespostaComentarioComunidade } from "./community-comment-reply";
import { criarEstruturaComentariosComunidade } from "./community-comment-tree";
import type { ComentariosSheetProps } from "./community-comments-sheet-props";
import { criarPerfilHrefComunidade } from "./community-profile-link";
import { CommunityCommentsSheetPanel } from "./community-comments-sheet-panel";
import { CommunityCommentsSheetOverlay } from "./community-comments-sheet-overlay";
import { CommunityCommentsSheetBackdrop } from "./community-comments-sheet-backdrop";
import { CommunityCommentsSheetHandleContainer } from "./community-comments-sheet-handle-container";
import { CommunityCommentsSheetHandleBar } from "./community-comments-sheet-handle-bar";
import { CommunityCommentsSheetHeaderContainer } from "./community-comments-sheet-header-container";
import { CommunityCommentsSheetHeaderSpacer } from "./community-comments-sheet-header-spacer";
import { CommunityCommentsSheetTitle } from "./community-comments-sheet-title";
import { CommunityCommentsSortMenuContainer } from "./community-comments-sort-menu-container";
import { CommunityCommentsSortMenuTrigger } from "./community-comments-sort-menu-trigger";
import { CommunityCommentsSortMenuPanel } from "./community-comments-sort-menu-panel";
import { CommunityCommentsSortMenuItem } from "./community-comments-sort-menu-item";
import { CommunityCommentsSortMenuDivider } from "./community-comments-sort-menu-divider";
import { CommunityCommentsListContainer } from "./community-comments-list-container";
import { CommunityCommentThreadContainer } from "./community-comment-thread-container";
import { CommunityCommentItemContainer } from "./community-comment-item-container";
import { CommunityCommentRepliesListContainer } from "./community-comment-replies-list-container";
import { CommunityCommentRepliesToggleButton } from "./community-comment-replies-toggle-button";
import { CommunityCommentRepliesControlsContainer } from "./community-comment-replies-controls-container";
import { CommunityCommentRepliesHideButton } from "./community-comment-replies-hide-button";
import { CommunityCommentAvatar } from "./community-comment-avatar";
import { CommunityCommentContentContainer } from "./community-comment-content-container";
import { CommunityCommentAuthorTimeRow } from "./community-comment-author-time-row";
import { CommunityCommentAuthorLink } from "./community-comment-author-link";
import { CommunityCommentTime } from "./community-comment-time";
import { CommunityCommentText } from "./community-comment-text";
import { CommunityCommentActionsRow } from "./community-comment-actions-row";
import { CommunityCommentReplyButton } from "./community-comment-reply-button";
import { CommunityCommentRemoveButton } from "./community-comment-remove-button";
import { CommunityCommentReportButton } from "./community-comment-report-button";
import { CommunityCommentLikeContainer } from "./community-comment-like-container";
import { CommunityCommentLikeButton } from "./community-comment-like-button";
import { CommunityCommentLikeCount } from "./community-comment-like-count";
import { CommunityCommentHeartIcon } from "./community-comment-heart-icon";
import { CommunityCommentsEmptyMessage } from "./community-comments-empty-message";
import { CommunityCommentsErrorNotice } from "./community-comments-error-notice";
import { CommunityCommentsToolsContainer } from "./community-comments-tools-container";
import { CommunityCommentsQuickReactionsContainer } from "./community-comments-quick-reactions-container";
import { CommunityCommentsQuickReactionButton } from "./community-comments-quick-reaction-button";
import { CommunityCommentsFormContainer } from "./community-comments-form-container";
import { CommunityCommentsInputAvatar } from "./community-comments-input-avatar";
import { CommunityCommentsInputBox } from "./community-comments-input-box";
import { CommunityCommentsTextarea } from "./community-comments-textarea";
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

    const posicaoAtual = event.touches[0]?.clientY || dragStartYRef.current;
    const limiteSuperior = sheetExpandido ? -46 : -58;
    const limiteInferior = sheetExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(limiteInferior, posicaoAtual - dragStartYRef.current)
    );

    dragOffsetYRef.current = deslocamento;

    if (Math.abs(deslocamento) > 6) {
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

    if (deslocamento < -34) {
      setSheetExpandido(true);
      return;
    }

    if (deslocamento > 52 && sheetExpandido) {
      setSheetExpandido(false);
      return;
    }

    if (deslocamento > 118 && !sheetExpandido) {
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

  function renderizarComentario(
    comentario: ComentarioComunidade,
    comentarioRaizId: string,
    resposta = false
  ) {
    const usuarioCurtiuComentario = Boolean(
      usuarioId && comentario.curtidas.includes(usuarioId)
    );
    const podeRemoverComentario = Boolean(
      usuarioId && comentario.autorId === usuarioId
    );
    const podeDenunciarComentario = Boolean(
      usuarioId && comentario.autorId !== usuarioId
    );
    const comentarioCurtindo = comentarioCurtindoId === comentario.id;
    const comentarioRemovendo = comentarioRemovendoId === comentario.id;
    const comentarioDenunciando = comentarioDenunciandoId === comentario.id;
    return (
      <CommunityCommentItemContainer key={comentario.id} isReply={resposta}>
        <CommunityCommentAvatar
          href={criarPerfilHrefComunidade(
            comentario.autorId,
            comentario.autorNome
          )}
          authorName={comentario.autorNome}
          avatar={comentario.autorAvatar}
          isReply={resposta}
        />

        <CommunityCommentContentContainer>
          <CommunityCommentAuthorTimeRow>
            <CommunityCommentAuthorLink
              href={criarPerfilHrefComunidade(
                comentario.autorId,
                comentario.autorNome
              )}
            >
              {comentario.autorNome}
            </CommunityCommentAuthorLink>

            <CommunityCommentTime>
              {formatarTempoRelativoComentarioComunidade(
                comentario.criadoEm,
                agoraComentarios
              )}
            </CommunityCommentTime>
          </CommunityCommentAuthorTimeRow>

          <CommunityCommentText>{comentario.texto}</CommunityCommentText>

          <CommunityCommentActionsRow>
            <CommunityCommentReplyButton
              onClick={() =>
                responderComentario(comentario, comentarioRaizId)
              }
              disabled={!podeComentar}
            >
              Responder
            </CommunityCommentReplyButton>

            {podeRemoverComentario ? (
              <CommunityCommentRemoveButton
                onClick={() =>
                  removerComentarioSeguro(post?.id || "", comentario.id)
                }
                disabled={comentarioRemovendo}
              >
                {comentarioRemovendo ? "Removendo..." : "Remover"}
              </CommunityCommentRemoveButton>
            ) : null}

            {podeDenunciarComentario ? (
              <CommunityCommentReportButton
                onClick={() => denunciarComentarioSeguro(comentario.id)}
                disabled={comentarioDenunciando}
              >
                {comentarioDenunciando ? "Enviando..." : "Denunciar"}
              </CommunityCommentReportButton>
            ) : null}
          </CommunityCommentActionsRow>
        </CommunityCommentContentContainer>

        <CommunityCommentLikeContainer>
          <CommunityCommentLikeButton
            aria-pressed={usuarioCurtiuComentario}
            aria-label={`${
              usuarioCurtiuComentario
                ? "Remover curtida do comentário"
                : "Curtir comentário"
            }. ${comentario.curtidas.length} ${
              comentario.curtidas.length === 1 ? "curtida" : "curtidas"
            }`}
            onClick={() =>
              curtirComentarioSeguro(post?.id || "", comentario.id)
            }
            disabled={!podeComentar || comentarioCurtindo}
          >
            <CommunityCommentHeartIcon
              liked={usuarioCurtiuComentario}
            />
          </CommunityCommentLikeButton>

          <CommunityCommentLikeCount>
            {comentario.curtidas.length}
          </CommunityCommentLikeCount>
        </CommunityCommentLikeContainer>
      </CommunityCommentItemContainer>
    );
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
          aria-label={
            sheetExpandido ? "Recolher comentários" : "Expandir comentários"
          }
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
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
            {post.comentarios.length === 1
              ? "1 comentário"
              : `${post.comentarios.length} comentários`}
          </CommunityCommentsSheetTitle>

          <CommunityCommentsSortMenuContainer>
            <CommunityCommentsSortMenuTrigger
              type="button"
              onClick={() => setMenuOrdenacaoAberto((aberto) => !aberto)}
              aria-label="Ordenar comentários"
              aria-haspopup="menu"
              aria-expanded={menuOrdenacaoAberto}
            >
              +
            </CommunityCommentsSortMenuTrigger>

            {menuOrdenacaoAberto ? (
              <CommunityCommentsSortMenuPanel role="menu">
                <CommunityCommentsSortMenuItem
                  type="button"
                  onClick={() => {
                    setOrdenacaoComentarios("relevantes");
                    setMenuOrdenacaoAberto(false);
                  }}
                  active={ordenacaoComentarios === "relevantes"}
                  role="menuitem"
                >
                  Relevantes
                </CommunityCommentsSortMenuItem>

                <CommunityCommentsSortMenuDivider />

                <CommunityCommentsSortMenuItem
                  type="button"
                  onClick={() => {
                    setOrdenacaoComentarios("recentes");
                    setMenuOrdenacaoAberto(false);
                  }}
                  active={ordenacaoComentarios === "recentes"}
                  role="menuitem"
                >
                  Recentes
                </CommunityCommentsSortMenuItem>
              </CommunityCommentsSortMenuPanel>
            ) : null}
          </CommunityCommentsSortMenuContainer>
        </CommunityCommentsSheetHeaderContainer>

        <CommunityCommentsListContainer>
          {estruturaComentarios.comentariosRaiz.length > 0 ? (
            estruturaComentarios.comentariosRaiz.map((comentario) => {
              const respostas =
                estruturaComentarios.respostasPorRaiz.get(comentario.id) || [];
              const quantidadeVisivel = Math.min(
                respostas.length,
                respostasVisiveisPorComentario[comentario.id] || 0
              );
              const respostasVisiveis = respostas.slice(0, quantidadeVisivel);
              const respostasOcultas = Math.max(
                0,
                respostas.length - quantidadeVisivel
              );
              const respostasExpandidas = quantidadeVisivel > 0;

              return (
                <CommunityCommentThreadContainer key={comentario.id}>
                  {renderizarComentario(comentario, comentario.id)}

                  {respostasVisiveis.length > 0 ? (
                    <CommunityCommentRepliesListContainer>
                      {respostasVisiveis.map((resposta) =>
                        renderizarComentario(resposta, comentario.id, true)
                      )}
                    </CommunityCommentRepliesListContainer>
                  ) : null}

                  {respostas.length > 0 && !respostasExpandidas ? (
                    <CommunityCommentRepliesToggleButton
                      type="button"
                      onClick={() =>
                        setRespostasVisiveisPorComentario((estadoAtual) => ({
                          ...estadoAtual,
                          [comentario.id]: Math.min(5, respostas.length),
                        }))
                      }
                    >
                      {`Ver ${respostas.length} ${
                        respostas.length === 1 ? "resposta" : "respostas"
                      }`}
                    </CommunityCommentRepliesToggleButton>
                  ) : null}

                  {respostasExpandidas ? (
                    <CommunityCommentRepliesControlsContainer>
                      {respostasOcultas > 0 ? (
                        <CommunityCommentRepliesToggleButton
                          type="button"
                          onClick={() =>
                            setRespostasVisiveisPorComentario((estadoAtual) => ({
                              ...estadoAtual,
                              [comentario.id]: Math.min(
                                respostas.length,
                                (estadoAtual[comentario.id] || 0) + 5
                              ),
                            }))
                          }
                        >
                          {`Ver mais ${respostasOcultas} ${
                            respostasOcultas === 1 ? "resposta" : "respostas"
                          }`}
                        </CommunityCommentRepliesToggleButton>
                      ) : null}

                      <CommunityCommentRepliesHideButton
                        type="button"
                        onClick={() =>
                          setRespostasVisiveisPorComentario((estadoAtual) => ({
                            ...estadoAtual,
                            [comentario.id]: 0,
                          }))
                        }
                      >
                        Ocultar respostas
                      </CommunityCommentRepliesHideButton>
                    </CommunityCommentRepliesControlsContainer>
                  ) : null}
                </CommunityCommentThreadContainer>
              );
            })
          ) : (
            <CommunityCommentsEmptyMessage>
              Sem comentários ainda
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
            {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
              <CommunityCommentsQuickReactionButton
                key={emoji}
                type="button"
                onClick={() => inserirNoComentario(emoji)}
                disabled={!podeComentar}
                aria-label={`Adicionar ${emoji} ao comentário`}
              >
                {emoji}
              </CommunityCommentsQuickReactionButton>
            ))}
          </CommunityCommentsQuickReactionsContainer>
        </CommunityCommentsToolsContainer>

        <CommunityCommentsFormContainer onSubmit={enviarComentario}>
          <CommunityCommentsInputAvatar
            avatar={podeComentar ? usuarioAvatar : ""}
          >
            {!(podeComentar && usuarioAvatar) &&
              (podeComentar ? usuarioNome : "H").slice(0, 1).toUpperCase()}
          </CommunityCommentsInputAvatar>

          <CommunityCommentsInputBox>
            <CommunityCommentsTextarea
              aria-label={
                podeComentar ? "Adicionar comentário..." : "Entre para comentar."
              }
              ref={comentarioRef}
              placeholder={
                podeComentar ? "Adicionar comentário..." : "Entre para comentar."
              }
              disabled={!podeComentar || comentarioEnviando}
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
            disabled={!podeComentar}
            aria-label="Adicionar menção"
          >
            @
          </CommunityCommentsMentionButton>

          <CommunityCommentsSendButton
            type="submit"
            aria-label="Enviar comentário"
            disabled={!podeComentar || comentarioEnviando}
            active={podeComentar && !comentarioEnviando}
          >
            {comentarioEnviando ? "..." : "↑"}
          </CommunityCommentsSendButton>
        </CommunityCommentsFormContainer>
      </CommunityCommentsSheetPanel>
    </CommunityCommentsSheetOverlay>,
    document.body
  );
});
