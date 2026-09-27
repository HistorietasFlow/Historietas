import type { CSSProperties, ReactNode } from "react";
import type { ComentarioComunidade } from "./community-comment";

type CommunityCommentsEmptyMessageProps = {
  children: ReactNode;
};

export function temComentariosRaizComunidade(
  comentariosRaiz: ComentarioComunidade[]
) {
  return comentariosRaiz.length > 0;
}

export function obterTextoEstadoVazioComentariosComunidade() {
  return "Sem comentários ainda";
}

export function CommunityCommentsEmptyMessage({
  children,
}: CommunityCommentsEmptyMessageProps) {
  return <p style={commentsEmptyMessageStyle}>{children}</p>;
}

const commentsEmptyMessageStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};
