"use client";

import type { AbaConteudoSeguindo } from "../lib/seguindo-page-types";
import {
  desktopSocialTabsStyle,
  desktopSocialTabStyle,
  desktopSocialTabActiveStyle,
} from "../lib/seguindo-desktop-social-section-styles";
import {
  socialToolbarStyle,
  desktopSocialToolbarStyle,
  socialTabsStyle,
  socialTabStyle,
  socialTabActiveStyle,
  mobileThreeSocialTabStyle,
  socialTabCountStyle,
  mobileThreeSocialTabCountStyle,
} from "../lib/seguindo-social-toolbar-styles";

type SeguindoSocialToolbarProps = {
  isDesktop: boolean;
  abaConteudo: AbaConteudoSeguindo;
  trocarAbaConteudo: (aba: AbaConteudoSeguindo) => void;
  totalSeguidores: number;
  totalObrasSeguidas: number;
  totalPessoasSeguidas: number;
};

export function SeguindoSocialToolbar({
  isDesktop,
  abaConteudo,
  trocarAbaConteudo,
  totalSeguidores,
  totalObrasSeguidas,
  totalPessoasSeguidas,
}: SeguindoSocialToolbarProps) {
  return (
    <section style={isDesktop ? desktopSocialToolbarStyle : socialToolbarStyle}>
      <div
        style={
          isDesktop
            ? desktopSocialTabsStyle
            : {
                ...socialTabsStyle,
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              }
        }
      >
        <>
          <button
            type="button"
            onClick={() => trocarAbaConteudo("seguidores")}
            style={{
              ...(abaConteudo === "seguidores"
                ? socialTabActiveStyle
                : socialTabStyle),
              ...(isDesktop
                ? abaConteudo === "seguidores"
                  ? desktopSocialTabActiveStyle
                  : desktopSocialTabStyle
                : mobileThreeSocialTabStyle),
            }}
          >
            Seguidores
            <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
              {totalSeguidores}
            </span>
          </button>

          <button
            type="button"
            onClick={() => trocarAbaConteudo("obras")}
            style={{
              ...(abaConteudo === "obras"
                ? socialTabActiveStyle
                : socialTabStyle),
              ...(isDesktop
                ? abaConteudo === "obras"
                  ? desktopSocialTabActiveStyle
                  : desktopSocialTabStyle
                : mobileThreeSocialTabStyle),
            }}
          >
            Obras seguidas
            <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
              {totalObrasSeguidas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => trocarAbaConteudo("pessoas")}
            style={{
              ...(abaConteudo === "pessoas"
                ? socialTabActiveStyle
                : socialTabStyle),
              ...(isDesktop
                ? abaConteudo === "pessoas"
                  ? desktopSocialTabActiveStyle
                  : desktopSocialTabStyle
                : mobileThreeSocialTabStyle),
            }}
          >
            Pessoas seguidas
            <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
              {totalPessoasSeguidas}
            </span>
          </button>
        </>
      </div>
    </section>
  );
}
