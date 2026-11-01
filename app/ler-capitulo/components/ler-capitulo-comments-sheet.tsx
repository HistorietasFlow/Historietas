"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLerCapituloCommentSheetActions } from "../hooks/use-ler-capitulo-comment-sheet-actions";
import { useLerCapituloCommentSheetComposer } from "../hooks/use-ler-capitulo-comment-sheet-composer";
import { useLerCapituloCommentSheetGestures } from "../hooks/use-ler-capitulo-comment-sheet-gestures";
import {
  criarEstruturaComentariosCapitulo,
  type OrdenacaoComentariosCapitulo,
} from "../lib/ler-capitulo-comment-thread-structure";
import {
  criarAvatarComentarioBaseStyle,
  LerCapituloCommentItem,
} from "./ler-capitulo-comment-item";
import { LoadingSpinner } from "./ler-capitulo-loading-spinner";
import {
  commentsSheetOverlayStyle,
  commentsSheetBackdropStyle,
  commentsSheetStyle,
  commentsSheetCompactStyle,
  commentsSheetExpandedStyle,
  desktopCommentsSheetStyle,
  commentsSheetHandleWrapStyle,
  commentsSheetHandleStyle,
  commentsSheetHeaderStyle,
  commentsSheetHeaderSpacerStyle,
  commentsSheetTitleStyle,
  commentsSortMenuWrapStyle,
  commentsSortMenuTriggerStyle,
  commentsSortMenuStyle,
  commentsSortMenuItemStyle,
  commentsSortMenuItemActiveStyle,
  commentsSortMenuDividerStyle,
  commentsSheetListStyle,
  commentThreadStyle,
  commentRepliesListStyle,
  commentRepliesToggleStyle,
  commentRepliesControlsStyle,
  commentRepliesHideButtonStyle,
  commentRepliesLineStyle,
  commentsLoadingStyle,
  emptyCommentsStyle,
  commentsSheetErrorStyle,
  commentsToolsStyle,
  commentsQuickReactionsStyle,
  commentsQuickReactionButtonStyle,
  commentsSheetFormStyle,
  commentsInputAvatarStyle,
  commentsInputBoxStyle,
  commentsSheetInputStyle,
  commentsInputIconButtonStyle,
  commentsSheetSendStyle,
} from "../lib/ler-capitulo-comments-styles";

export type ComentarioCapituloPublico = {
  id: string;
  userId: string;
  nome: string;
  avatar: string;
  texto: string;
  criadoEm: string;
  comentarioPaiId: string;
  meuComentario: boolean;
  curtidas: string[];
};

export type ComentariosCapituloPost = {
  id: string;
  comentarios: ComentarioCapituloPublico[];
};

type ComentariosCapituloSheetProps = {
  post: ComentariosCapituloPost | null;
  podeComentar: boolean;
  usuarioId: string;
  usuarioNome: string;
  usuarioAvatar: string;
  erroInteracao: string;
  carregando: boolean;
  isDesktop: boolean;
  onFechar: () => void;
  onEnviar: (
    postId: string,
    texto: string,
    comentarioPaiId: string
  ) => boolean | Promise<boolean>;
  onCurtirComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onRemoverComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onDenunciarComentario: (comentarioId: string) => void | Promise<void>;
};

const ComentariosCapituloSheet = memo(function ComentariosCapituloSheet({
  post,
  podeComentar,
  usuarioId,
  usuarioNome,
  usuarioAvatar,
  erroInteracao,
  carregando,
  isDesktop,
  onFechar,
  onEnviar,
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: ComentariosCapituloSheetProps) {
  const comentarioRef = useRef<HTMLTextAreaElement | null>(null);
  const [respostasVisiveisPorComentario, setRespostasVisiveisPorComentario] =
    useState<Record<string, number>>({});
  const [ordenacaoComentarios, setOrdenacaoComentarios] =
    useState<OrdenacaoComentariosCapitulo>("relevantes");
  const [menuOrdenacaoAberto, setMenuOrdenacaoAberto] = useState(false);
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
  } = useLerCapituloCommentSheetActions({
    onCurtirComentario,
    onRemoverComentario,
    onDenunciarComentario,
  });
  const {
    comentarioEnviando,
    limparRespostaComentario,
    responderComentario,
    enviarComentario,
  } = useLerCapituloCommentSheetComposer({
    comentarioRef,
    podeComentar,
    post,
    onEnviar,
    iniciarAcaoComentario,
    finalizarAcaoComentario,
    setRespostasVisiveisPorComentario,
  });

  function fecharComentarios() {
    setMenuOrdenacaoAberto(false);
    limparRespostaComentario();
    onFechar();
  }
  const {
    sheetRef,
    sheetExpandido,
    fecharSheetComentarios,
    iniciarArraste,
    moverArraste,
    finalizarArraste,
    alternarExpansaoComentarios,
  } = useLerCapituloCommentSheetGestures({
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

  const estruturaComentarios = useMemo(
    () =>
      criarEstruturaComentariosCapitulo(
        post?.comentarios || [],
        ordenacaoComentarios
      ),
    [ordenacaoComentarios, post?.comentarios]
  );

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
    <section data-historietas-ler-capitulo-comments-root="true" style={commentsSheetOverlayStyle} aria-label="Comentários">
      <button
        type="button"
        aria-label="Fechar comentários"
        onClick={fecharSheetComentarios}
        style={commentsSheetBackdropStyle}
      />

      <article
        ref={sheetRef}
        style={
          isDesktop
            ? desktopCommentsSheetStyle
            : {
                ...commentsSheetStyle,
                ...(sheetExpandido
                  ? commentsSheetExpandedStyle
                  : commentsSheetCompactStyle),
              }
        }
      >
        <div
          data-comments-sheet-handle="true"
          style={commentsSheetHandleWrapStyle}
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
          <div style={commentsSheetHandleStyle} />
        </div>

        <header style={commentsSheetHeaderStyle}>
          <span style={commentsSheetHeaderSpacerStyle} aria-hidden="true" />

          <strong style={commentsSheetTitleStyle}>
            {post.comentarios.length === 1
              ? "1 comentário"
              : `${post.comentarios.length} comentários`}
          </strong>

          <div style={commentsSortMenuWrapStyle}>
            <button
              type="button"
              onClick={() => setMenuOrdenacaoAberto((aberto) => !aberto)}
              style={commentsSortMenuTriggerStyle}
              aria-label="Ordenar comentários"
              aria-haspopup="menu"
              aria-expanded={menuOrdenacaoAberto}
            >
              +
            </button>

            {menuOrdenacaoAberto ? (
              <div style={commentsSortMenuStyle} role="menu">
                <button
                  type="button"
                  onClick={() => {
                    setOrdenacaoComentarios("relevantes");
                    setMenuOrdenacaoAberto(false);
                  }}
                  style={
                    ordenacaoComentarios === "relevantes"
                      ? commentsSortMenuItemActiveStyle
                      : commentsSortMenuItemStyle
                  }
                  role="menuitem"
                >
                  Relevantes
                </button>

                <div style={commentsSortMenuDividerStyle} aria-hidden="true" />

                <button
                  type="button"
                  onClick={() => {
                    setOrdenacaoComentarios("recentes");
                    setMenuOrdenacaoAberto(false);
                  }}
                  style={
                    ordenacaoComentarios === "recentes"
                      ? commentsSortMenuItemActiveStyle
                      : commentsSortMenuItemStyle
                  }
                  role="menuitem"
                >
                  Recentes
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <section style={commentsSheetListStyle}>
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
                <section key={comentario.id} style={commentThreadStyle}>
                  <LerCapituloCommentItem
                    comentario={comentario}
                    comentarioRaizId={comentario.id}
                    usuarioId={usuarioId}
                    podeComentar={podeComentar}
                    postId={post?.id || ""}
                    agoraComentarios={agoraComentarios}
                    comentarioCurtindoId={comentarioCurtindoId}
                    comentarioRemovendoId={comentarioRemovendoId}
                    comentarioDenunciandoId={comentarioDenunciandoId}
                    onResponderComentario={responderComentario}
                    onCurtirComentario={curtirComentarioSeguro}
                    onRemoverComentario={removerComentarioSeguro}
                    onDenunciarComentario={denunciarComentarioSeguro}
                  />

                  {respostasVisiveis.length > 0 ? (
                    <div style={commentRepliesListStyle}>
                      {respostasVisiveis.map((resposta) => (
                        <LerCapituloCommentItem
                          key={resposta.id}
                          comentario={resposta}
                          comentarioRaizId={comentario.id}
                          resposta
                          usuarioId={usuarioId}
                          podeComentar={podeComentar}
                          postId={post?.id || ""}
                          agoraComentarios={agoraComentarios}
                          comentarioCurtindoId={comentarioCurtindoId}
                          comentarioRemovendoId={comentarioRemovendoId}
                          comentarioDenunciandoId={comentarioDenunciandoId}
                          onResponderComentario={responderComentario}
                          onCurtirComentario={curtirComentarioSeguro}
                          onRemoverComentario={removerComentarioSeguro}
                          onDenunciarComentario={denunciarComentarioSeguro}
                        />
                      ))}
                    </div>
                  ) : null}

                  {respostas.length > 0 && !respostasExpandidas ? (
                    <button
                      type="button"
                      onClick={() =>
                        setRespostasVisiveisPorComentario((estadoAtual) => ({
                          ...estadoAtual,
                          [comentario.id]: Math.min(5, respostas.length),
                        }))
                      }
                      style={commentRepliesToggleStyle}
                    >
                      <span style={commentRepliesLineStyle} />
                      {`Ver ${respostas.length} ${
                        respostas.length === 1 ? "resposta" : "respostas"
                      }`}
                    </button>
                  ) : null}

                  {respostasExpandidas ? (
                    <div style={commentRepliesControlsStyle}>
                      {respostasOcultas > 0 ? (
                        <button
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
                          style={commentRepliesToggleStyle}
                        >
                          <span style={commentRepliesLineStyle} />
                          {`Ver mais ${respostasOcultas} ${
                            respostasOcultas === 1 ? "resposta" : "respostas"
                          }`}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          setRespostasVisiveisPorComentario((estadoAtual) => ({
                            ...estadoAtual,
                            [comentario.id]: 0,
                          }))
                        }
                        style={commentRepliesHideButtonStyle}
                      >
                        Ocultar respostas
                      </button>
                    </div>
                  ) : null}
                </section>
              );
            })
          ) : carregando ? (
            <div style={commentsLoadingStyle}>
              <LoadingSpinner
                compacto
                label="Carregando comentários"
              />
            </div>
          ) : (
            <p style={emptyCommentsStyle}>Sem comentários ainda</p>
          )}
        </section>

        {erroInteracao ? (
          <span style={commentsSheetErrorStyle}>{erroInteracao}</span>
        ) : null}

        <section style={commentsToolsStyle}>
          <div style={commentsQuickReactionsStyle}>
            {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => inserirNoComentario(emoji)}
                disabled={!podeComentar}
                style={commentsQuickReactionButtonStyle}
                aria-label={`Adicionar ${emoji} ao comentário`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={enviarComentario} style={commentsSheetFormStyle}>
          <div
            style={criarAvatarComentarioBaseStyle(
              commentsInputAvatarStyle,
              podeComentar ? usuarioAvatar : ""
            )}
          >
            {!(podeComentar && usuarioAvatar) &&
              (podeComentar ? usuarioNome : "H").slice(0, 1).toUpperCase()}
          </div>

          <div style={commentsInputBoxStyle}>
            <textarea
              aria-label="Adicionar comentário"
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
              style={commentsSheetInputStyle}
            />
          </div>

          <button
            type="button"
            onClick={() => inserirNoComentario("@")}
            disabled={!podeComentar}
            style={commentsInputIconButtonStyle}
            aria-label="Adicionar menção"
          >
            @
          </button>

          <button
            type="submit"
            aria-label="Enviar comentário"
            disabled={!podeComentar || comentarioEnviando}
            style={{
              ...commentsSheetSendStyle,
              opacity: podeComentar && !comentarioEnviando ? 1 : 0.58,
              cursor:
                podeComentar && !comentarioEnviando
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {comentarioEnviando ? (
              <LoadingSpinner
                compacto
                label="Enviando comentário"
              />
            ) : (
              "↑"
            )}
          </button>
        </form>
      </article>
    </section>,
    document.body
  );
});

export default ComentariosCapituloSheet;
