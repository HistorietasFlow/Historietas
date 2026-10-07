import Link from "next/link";

import {
  desktopFollowedButtonStyle,
  desktopHeroActionsStyle,
  desktopObraAddButtonStyle,
  desktopPrimaryReadingButtonStyle,
  desktopSecondaryFollowButtonStyle,
  followedButtonStyle,
  heroActionsStyle,
  obraAddButtonStyle,
  primaryReadingButtonStyle,
  secondaryButtonStyle,
} from "../lib/obra-style-utils";

type ObraHeroActionsProps = {
  isDesktop: boolean;
  leituraHref?: string;
  leituraRotulo: string;
  leituraAriaLabel: string;
  seguindo: boolean;
  acoesAbertas: boolean;
  onAlternarSeguir: () => void | Promise<void>;
  onAlternarAcoes: () => void;
};

export default function ObraHeroActions({
  isDesktop,
  leituraHref,
  leituraRotulo,
  leituraAriaLabel,
  seguindo,
  acoesAbertas,
  onAlternarSeguir,
  onAlternarAcoes,
}: ObraHeroActionsProps) {
  return (
    <div style={isDesktop ? desktopHeroActionsStyle : heroActionsStyle}>
      {leituraHref ? (
        <Link
          href={leituraHref}
          style={
            isDesktop
              ? desktopPrimaryReadingButtonStyle
              : primaryReadingButtonStyle
          }
          aria-label={leituraAriaLabel}
        >
          {leituraRotulo}
        </Link>
      ) : null}

      <button
        type="button"
        onClick={onAlternarSeguir}
        style={
          isDesktop
            ? seguindo
              ? desktopFollowedButtonStyle
              : desktopSecondaryFollowButtonStyle
            : seguindo
              ? followedButtonStyle
              : secondaryButtonStyle
        }
      >
        {seguindo ? "✓ Seguindo" : "Seguir obra"}
      </button>

      <button
        type="button"
        onClick={onAlternarAcoes}
        style={isDesktop ? desktopObraAddButtonStyle : obraAddButtonStyle}
        aria-label="Abrir ações da obra"
        aria-expanded={acoesAbertas}
        aria-haspopup="dialog"
      >
        +
      </button>
    </div>
  );
}
