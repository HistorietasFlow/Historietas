"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useLerCapituloCommentSheetActions } from "../hooks/use-ler-capitulo-comment-sheet-actions";
import { useLerCapituloCommentSheetComposer } from "../hooks/use-ler-capitulo-comment-sheet-composer";
import { useLerCapituloCommentSheetGestures } from "../hooks/use-ler-capitulo-comment-sheet-gestures";
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
  commentItemStyle,
  commentRepliesListStyle,
  commentReplyItemStyle,
  commentRepliesToggleStyle,
  commentRepliesControlsStyle,
  commentRepliesHideButtonStyle,
  commentRepliesLineStyle,
  commentAvatarLinkStyle,
  commentReplyAvatarLinkStyle,
  commentContentStyle,
  commentTopLineStyle,
  commentAuthorLinkStyle,
  commentTimeStyle,
  commentTextStyle,
  commentActionsRowStyle,
  commentReplyButtonStyle,
  commentRemoveButtonStyle,
  commentReportButtonStyle,
  commentLikeWrapStyle,
  commentLikeButtonStyle,
  commentLikeCountStyle,
  commentHeartIconStyle,
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

type OrdenacaoComentariosCapitulo = "relevantes" | "recentes";

export type ComentariosCapituloPost = {
  id: string;
  comentarios: ComentarioCapituloPublico[];
};

function criarHrefPerfilUsuarioLeitor(userId: string, nome: string) {
  const params = new URLSearchParams();
  const userIdLimpo = userId.trim();
  const nomeLimpo = nome.trim() || "Usuário";

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
    params.set("autorId", userIdLimpo);
  }

  params.set("autor", nomeLimpo);

  return `/perfil-autor?${params.toString()}`;
}

function criarAvatarComentarioBaseStyle(
  estiloBase: CSSProperties,
  avatar: string
): CSSProperties {
  const avatarLimpo = avatar.trim();

  if (!avatarLimpo) {
    return estiloBase;
  }

  return {
    ...estiloBase,
    backgroundImage: `url(${avatarLimpo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

function dataComentarioCapitulo(comentario: ComentarioCapituloPublico) {
  const data = new Date(comentario.criadoEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

function formatarTempoRelativoComentarioCapitulo(
  criadaEm: string,
  agora = Date.now()
) {
  const dataComentario = new Date(criadaEm).getTime();

  if (Number.isNaN(dataComentario)) {
    return "agora";
  }

  const segundos = Math.max(0, Math.floor((agora - dataComentario) / 1000));

  if (segundos < 5) {
    return "agora";
  }

  if (segundos < 60) {
    return `há ${segundos} ${segundos === 1 ? "segundo" : "segundos"}`;
  }

  const minutos = Math.floor(segundos / 60);

  if (minutos < 60) {
    return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  const dias = Math.floor(horas / 24);

  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

function criarEstruturaComentariosCapitulo(
  comentarios: ComentarioCapituloPublico[],
  ordenacao: OrdenacaoComentariosCapitulo
) {
  const comentariosPorId = new Map(
    comentarios.map((comentario) => [comentario.id, comentario])
  );
  const respostasPorRaiz = new Map<string, ComentarioCapituloPublico[]>();
  const comentariosRaiz: ComentarioCapituloPublico[] = [];

  function obterRaiz(comentario: ComentarioCapituloPublico) {
    let atual = comentario;
    const visitados = new Set<string>([comentario.id]);

    while (atual.comentarioPaiId) {
      const pai = comentariosPorId.get(atual.comentarioPaiId);

      if (!pai || visitados.has(pai.id)) {
        break;
      }

      visitados.add(pai.id);
      atual = pai;
    }

    return atual;
  }

  comentarios.forEach((comentario) => {
    const paiExiste = Boolean(
      comentario.comentarioPaiId &&
        comentariosPorId.has(comentario.comentarioPaiId)
    );

    if (!paiExiste) {
      comentariosRaiz.push(comentario);
      return;
    }

    const raiz = obterRaiz(comentario);
    const respostasAtuais = respostasPorRaiz.get(raiz.id) || [];

    respostasPorRaiz.set(raiz.id, [...respostasAtuais, comentario]);
  });

  respostasPorRaiz.forEach((respostas, raizId) => {
    respostasPorRaiz.set(
      raizId,
      [...respostas].sort(
        (a, b) => dataComentarioCapitulo(a) - dataComentarioCapitulo(b)
      )
    );
  });

  comentariosRaiz.sort((a, b) => {
    if (ordenacao === "recentes") {
      return dataComentarioCapitulo(b) - dataComentarioCapitulo(a);
    }

    const relevanciaA =
      a.curtidas.length * 3 + (respostasPorRaiz.get(a.id)?.length || 0);
    const relevanciaB =
      b.curtidas.length * 3 + (respostasPorRaiz.get(b.id)?.length || 0);

    return (
      relevanciaB - relevanciaA ||
      dataComentarioCapitulo(b) - dataComentarioCapitulo(a)
    );
  });

  return {
    comentariosRaiz,
    respostasPorRaiz,
  };
}

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

  function renderizarComentario(
    comentario: ComentarioCapituloPublico,
    comentarioRaizId: string,
    resposta = false
  ) {
    const usuarioCurtiuComentario = Boolean(
      usuarioId && comentario.curtidas.includes(usuarioId)
    );
    const podeRemoverComentario = Boolean(
      usuarioId && comentario.userId === usuarioId
    );
    const podeDenunciarComentario = Boolean(
      usuarioId && comentario.userId !== usuarioId
    );
    const comentarioCurtindo = comentarioCurtindoId === comentario.id;
    const comentarioRemovendo = comentarioRemovendoId === comentario.id;
    const comentarioDenunciando = comentarioDenunciandoId === comentario.id;
    const avatarBaseStyle = resposta
      ? commentReplyAvatarLinkStyle
      : commentAvatarLinkStyle;

    return (
      <article
        key={comentario.id}
        style={resposta ? commentReplyItemStyle : commentItemStyle}
      >
        <Link
          href={criarHrefPerfilUsuarioLeitor(
            comentario.userId,
            comentario.nome
          )}
          aria-label={`Abrir perfil de ${comentario.nome}`}
          style={criarAvatarComentarioBaseStyle(
            avatarBaseStyle,
            comentario.avatar
          )}
        >
          {!comentario.avatar &&
            (comentario.nome.slice(0, 1).toUpperCase() || "U")}
        </Link>

        <div style={commentContentStyle}>
          <div style={commentTopLineStyle}>
            <Link
              href={criarHrefPerfilUsuarioLeitor(
                comentario.userId,
                comentario.nome
              )}
              style={commentAuthorLinkStyle}
            >
              <span data-historietas-i18n-ignore="true">
                {comentario.nome}
              </span>
            </Link>

            <span style={commentTimeStyle}>
              {formatarTempoRelativoComentarioCapitulo(
                comentario.criadoEm,
                agoraComentarios
              )}
            </span>
          </div>

          <p style={commentTextStyle}>
            <span data-historietas-i18n-ignore="true">
              {comentario.texto}
            </span>
          </p>

          <div style={commentActionsRowStyle}>
            <button
              type="button"
              onClick={() =>
                responderComentario(comentario, comentarioRaizId)
              }
              disabled={!podeComentar}
              style={{
                ...commentReplyButtonStyle,
                opacity: podeComentar ? 1 : 0.52,
                cursor: podeComentar ? "pointer" : "not-allowed",
              }}
            >
              Responder
            </button>

            {podeRemoverComentario ? (
              <button
                type="button"
                onClick={() =>
                  removerComentarioSeguro(post?.id || "", comentario.id)
                }
                disabled={comentarioRemovendo}
                style={{
                  ...commentRemoveButtonStyle,
                  opacity: comentarioRemovendo ? 0.58 : 1,
                  cursor: comentarioRemovendo ? "not-allowed" : "pointer",
                }}
              >
                {comentarioRemovendo ? "Removendo..." : "Remover"}
              </button>
            ) : null}

            {podeDenunciarComentario ? (
              <button
                type="button"
                onClick={() => denunciarComentarioSeguro(comentario.id)}
                disabled={comentarioDenunciando}
                style={{
                  ...commentReportButtonStyle,
                  opacity: comentarioDenunciando ? 0.58 : 1,
                  cursor: comentarioDenunciando ? "not-allowed" : "pointer",
                }}
              >
                {comentarioDenunciando ? "Enviando..." : "Denunciar"}
              </button>
            ) : null}
          </div>
        </div>

        <div style={commentLikeWrapStyle}>
          <button
            type="button"
            data-historietas-reader-like="comment"
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
            style={{
              ...commentLikeButtonStyle,
              opacity: podeComentar && !comentarioCurtindo ? 1 : 0.58,
              cursor:
                podeComentar && !comentarioCurtindo
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{
                ...commentHeartIconStyle,
                animation: usuarioCurtiuComentario
                  ? "historietas-reader-heart-pop 260ms ease-out"
                  : "none",
              }}
            >
              <path
                d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
                fill={
                  usuarioCurtiuComentario
                    ? "var(--historietas-reader-heart, #FFFFFF)"
                    : "none"
                }
                stroke={
                  usuarioCurtiuComentario
                    ? "var(--historietas-reader-heart, #FFFFFF)"
                    : "#FFFFFF"
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span style={commentLikeCountStyle}>
            {comentario.curtidas.length}
          </span>
        </div>
      </article>
    );
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
                  {renderizarComentario(comentario, comentario.id)}

                  {respostasVisiveis.length > 0 ? (
                    <div style={commentRepliesListStyle}>
                      {respostasVisiveis.map((resposta) =>
                        renderizarComentario(resposta, comentario.id, true)
                      )}
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
