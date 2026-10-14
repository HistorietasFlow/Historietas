import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export type ListasProfileWorkRowStyles = {
  detail: CSSProperties;
  mainLink: CSSProperties;
  moreDot: CSSProperties;
  moreOptions: CSSProperties;
  optionsButton: CSSProperties;
  ratingSignal: CSSProperties;
  ratingSignalStar: CSSProperties;
  signal: CSSProperties;
  signalAnnotationToggle: CSSProperties;
  signals: CSSProperties;
  text: CSSProperties;
  title: CSSProperties;
  meta: CSSProperties;
};

type ListasProfileWorkRowProps = {
  annotationOpen: boolean;
  annotation?: ReactNode;
  className: string;
  coverStyle: CSSProperties;
  detalhe: ReactNode;
  genero: string;
  hasAnnotation: boolean;
  href: string;
  notaFormatada: string;
  onOpenOptions: () => void;
  onToggleAnnotation: () => void;
  showRating: boolean;
  styles: ListasProfileWorkRowStyles;
  titulo: string;
  workId: string;
  autor: string;
};

export function ListasProfileWorkRow({
  annotationOpen,
  annotation,
  autor,
  className,
  coverStyle,
  detalhe,
  genero,
  hasAnnotation,
  href,
  notaFormatada,
  onOpenOptions,
  onToggleAnnotation,
  showRating,
  styles,
  titulo,
  workId,
}: ListasProfileWorkRowProps) {
  return (
    <article id={`lista-obra-${workId}`} className={className}>
      <Link href={href} style={styles.mainLink}>
        <span style={coverStyle} aria-hidden="true" />

        <span style={styles.text}>
          <strong data-historietas-user-content="true" style={styles.title}>
            {titulo}
          </strong>
          <span data-historietas-user-content="true" style={styles.meta}>
            {autor} • {genero}
          </span>

          {detalhe && <span style={styles.detail}>{detalhe}</span>}

          {(hasAnnotation || showRating) && (
            <span style={styles.signals}>
              {showRating && (
                <span style={styles.ratingSignal}>
                  <span style={styles.ratingSignalStar} aria-hidden="true">
                    ★
                  </span>
                  <span>{notaFormatada}</span>
                </span>
              )}
              {hasAnnotation && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-expanded={annotationOpen}
                  aria-controls={`anotacao-${workId}`}
                  aria-label={
                    annotationOpen
                      ? `Ocultar anotação de ${titulo}`
                      : `Mostrar anotação de ${titulo}`
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleAnnotation();
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    onToggleAnnotation();
                  }}
                  style={{
                    ...styles.signalAnnotationToggle,
                    background: annotationOpen
                      ? "rgba(255,255,255,0.16)"
                      : styles.signal.background,
                    color: annotationOpen ? "#FFFFFF" : styles.signal.color,
                  }}
                >
                  ✎ Anotação
                </span>
              )}
            </span>
          )}
        </span>
      </Link>

      <button
        type="button"
        onClick={onOpenOptions}
        style={styles.optionsButton}
        aria-label={`Abrir opções de ${titulo}`}
      >
        <span aria-hidden="true" style={styles.moreOptions}>
          <span style={styles.moreDot} />
          <span style={styles.moreDot} />
          <span style={styles.moreDot} />
        </span>
      </button>

      {annotation}
    </article>
  );
}
