import Link from "next/link";
import type { ObraLocal } from "../types";
import {
  criarCapaMiniCardDiarioPerfilStyle,
  diarySummaryCardLinkStyle,
  diarySummaryCardTitleStyle,
} from "../styles";

type DiarySummaryCardProps = {
  href: string;
  obra: ObraLocal;
};

export function DiarySummaryCard({ href, obra }: DiarySummaryCardProps) {
  return (
    <Link
      href={href}
      style={diarySummaryCardLinkStyle}
      aria-label={`Abrir ${obra.titulo} na página Listas`}
      title={`Ver ${obra.titulo} nas Listas`}
    >
      <div
        style={criarCapaMiniCardDiarioPerfilStyle(obra.capa)}
        aria-hidden="true"
      />

      <strong
        data-historietas-user-content="true"
        style={diarySummaryCardTitleStyle}
      >
        {obra.titulo}
      </strong>

    </Link>
  );
}
