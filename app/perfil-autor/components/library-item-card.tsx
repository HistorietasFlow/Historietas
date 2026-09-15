import Link from "next/link";
import type { ItemBibliotecaPerfil } from "../types";
import {
  criarCapaGridPerfilAutor,
  desktopDiaryVisualCardStyle,
  diaryCardCommentMetaStyle,
  diaryCardCoverMetaStyle,
  diaryCardCoverOverlayStyle,
  diaryCardCoverTitleStyle,
  diaryCardHeartMetaStyle,
  diaryVisualCardStyle,
  diaryVisualCoverLinkStyle,
  profileWorkDotsButtonStyle,
  profileWorkMenuAnchorStyle,
} from "../styles";

type LibraryItemCardProps = {
  item: ItemBibliotecaPerfil;
  href: string;
  isDesktop: boolean;
  menuAberto: boolean;
  totalComentarios: number;
  totalCurtidas: number;
  visualizacoes: string;
  onToggleMenu: () => void;
};

export function LibraryItemCard({
  item,
  href,
  isDesktop,
  menuAberto,
  totalComentarios,
  totalCurtidas,
  visualizacoes,
  onToggleMenu,
}: LibraryItemCardProps) {
  return (
    <article style={isDesktop ? desktopDiaryVisualCardStyle : diaryVisualCardStyle}>
      <Link
        href={href}
        style={diaryVisualCoverLinkStyle}
        aria-label={`Abrir ${item.obra.titulo}`}
      >
        <div style={criarCapaGridPerfilAutor(item.obra.capa, isDesktop)}>
          <div style={diaryCardCoverOverlayStyle}>
            <strong data-historietas-user-content="true" style={diaryCardCoverTitleStyle}>{item.obra.titulo}</strong>

            <span style={diaryCardCoverMetaStyle}>
              <span>👁 {visualizacoes}</span>
              <span>
                <span style={diaryCardHeartMetaStyle}>❤️</span>{" "}
                {totalCurtidas}
              </span>
              <span>
                <span style={diaryCardCommentMetaStyle}>💬</span>{" "}
                {totalComentarios}
              </span>
            </span>
          </div>
        </div>
      </Link>

      <div style={profileWorkMenuAnchorStyle}>
        <button
          type="button"
          onClick={() => onToggleMenu()}
          style={profileWorkDotsButtonStyle}
          aria-label={`Abrir opções de ${item.obra.titulo}`}
          aria-expanded={menuAberto}
        >
          ⋮
        </button>
      </div>
    </article>
  );
}
