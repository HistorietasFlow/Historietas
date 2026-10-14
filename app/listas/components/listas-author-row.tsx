import Link from "next/link";
import type { CSSProperties } from "react";

export type ListasAuthorRowStyles = {
  authorLink: CSSProperties;
  meta: CSSProperties;
  text: CSSProperties;
  title: CSSProperties;
};

type ListasAuthorRowProps = {
  avatar: string;
  avatarStyle: CSSProperties;
  href: string;
  nome: string;
  styles: ListasAuthorRowStyles;
  totalObras: number;
  username: string;
};

export function ListasAuthorRow({
  avatar,
  avatarStyle,
  href,
  nome,
  styles,
  totalObras,
  username,
}: ListasAuthorRowProps) {
  return (
    <article className="historietas-list-row">
      <Link href={href} style={styles.authorLink}>
        <span style={avatarStyle} aria-hidden="true">
          {!avatar ? nome.slice(0, 1).toLocaleUpperCase("pt-BR") : ""}
        </span>

        <span style={styles.text}>
          <strong data-historietas-user-content="true" style={styles.title}>
            {nome}
          </strong>
          <span data-historietas-user-content="true" style={styles.meta}>
            {username ? `@${username} • ` : ""}
            {totalObras} {totalObras === 1 ? "obra" : "obras"}
          </span>
        </span>
      </Link>
    </article>
  );
}
