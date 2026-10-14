import Link from "next/link";
import type { CSSProperties } from "react";

export type ListasPublicWorkRowStyles = {
  mainLink: CSSProperties;
  moreDot: CSSProperties;
  moreOptions: CSSProperties;
  optionsButton: CSSProperties;
  text: CSSProperties;
  title: CSSProperties;
  meta: CSSProperties;
};

type ListasPublicWorkRowProps = {
  coverStyle: CSSProperties;
  genero: string;
  href: string;
  onOpenOptions: () => void;
  styles: ListasPublicWorkRowStyles;
  titulo: string;
};

export function ListasPublicWorkRow({
  coverStyle,
  genero,
  href,
  onOpenOptions,
  styles,
  titulo,
}: ListasPublicWorkRowProps) {
  return (
    <article className="historietas-list-row">
      <Link href={href} style={styles.mainLink}>
        <span style={coverStyle} aria-hidden="true" />

        <span style={styles.text}>
          <strong data-historietas-user-content="true" style={styles.title}>
            {titulo}
          </strong>
          <span data-historietas-user-content="true" style={styles.meta}>
            {genero}
          </span>
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
    </article>
  );
}
