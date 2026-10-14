import type { CSSProperties, ReactNode } from "react";

type ListasDiaryCommentThreadStyles = {
  controls: CSSProperties;
  hideButton: CSSProperties;
  line: CSSProperties;
  repliesList: CSSProperties;
  toggle: CSSProperties;
  thread: CSSProperties;
};

type ListasDiaryCommentThreadProps = {
  onCollapseReplies: () => void;
  onExpandReplies: () => void;
  onShowMoreReplies: () => void;
  quantidadeRespostas: number;
  quantidadeRespostasOcultas: number;
  respostas: ReactNode;
  respostasExpandidas: boolean;
  styles: ListasDiaryCommentThreadStyles;
  comentario: ReactNode;
};

export function ListasDiaryCommentThread({
  comentario,
  onCollapseReplies,
  onExpandReplies,
  onShowMoreReplies,
  quantidadeRespostas,
  quantidadeRespostasOcultas,
  respostas,
  respostasExpandidas,
  styles,
}: ListasDiaryCommentThreadProps) {
  return (
    <section style={styles.thread}>
      {comentario}

      {respostasExpandidas ? (
        <div style={styles.repliesList}>{respostas}</div>
      ) : null}

      {quantidadeRespostas > 0 && !respostasExpandidas ? (
        <button type="button" onClick={onExpandReplies} style={styles.toggle}>
          <span style={styles.line} />
          {`Ver ${quantidadeRespostas} ${
            quantidadeRespostas === 1 ? "resposta" : "respostas"
          }`}
        </button>
      ) : null}

      {respostasExpandidas ? (
        <div style={styles.controls}>
          {quantidadeRespostasOcultas > 0 ? (
            <button
              type="button"
              onClick={onShowMoreReplies}
              style={styles.toggle}
            >
              <span style={styles.line} />
              {`Ver mais ${quantidadeRespostasOcultas} ${
                quantidadeRespostasOcultas === 1 ? "resposta" : "respostas"
              }`}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onCollapseReplies}
            style={styles.hideButton}
          >
            Ocultar respostas
          </button>
        </div>
      ) : null}
    </section>
  );
}

export type { ListasDiaryCommentThreadStyles };
