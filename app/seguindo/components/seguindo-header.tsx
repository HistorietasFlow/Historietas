"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AbaConteudoSeguindo } from "../lib/seguindo-page-types";
import { seguindoHeaderFilterIconStyle } from "../lib/seguindo-header-icon-style";
import { seguindoSearchToggleStyle, seguindoHeaderFilterButtonStyle, desktopSeguindoHeaderFilterButtonStyle } from "../lib/seguindo-header-controls-styles";
import { desktopSeguindoHeaderSearchIconStyle, desktopSeguindoHeaderSearchInputStyle } from "../lib/seguindo-header-search-styles";
import {
  seguindoHeaderSearchShellStyle,
  desktopSeguindoHeaderSearchShellStyle,
  seguindoHeaderSearchInputStyle,
} from "../lib/seguindo-search-shell-styles";
import { desktopSeguindoHeaderActionsStyle, desktopSeguindoHeaderTitleStyle } from "../lib/seguindo-header-typography-styles";
import { desktopSeguindoHeaderStyle, seguindoHeaderStyle } from "../lib/seguindo-header-base-styles";

type SeguindoHeaderProps = {
  isDesktop: boolean;
  busca: string;
  setBusca: Dispatch<SetStateAction<string>>;
  buscaSeguindoAberta: boolean;
  setBuscaSeguindoAberta: Dispatch<SetStateAction<boolean>>;
  setMostrarPainelOrdenacao: Dispatch<SetStateAction<boolean>>;
  visualizandoListaSocialDoPerfil: boolean;
  descricaoListaSocial: string;
  abaConteudo: AbaConteudoSeguindo;
};

export function SeguindoHeader({
  isDesktop,
  busca,
  setBusca,
  buscaSeguindoAberta,
  setBuscaSeguindoAberta,
  setMostrarPainelOrdenacao,
  visualizandoListaSocialDoPerfil,
  descricaoListaSocial,
  abaConteudo,
}: SeguindoHeaderProps) {
  return (
    <>
        {isDesktop ? (
          <header style={desktopSeguindoHeaderStyle}>
            <h1 style={desktopSeguindoHeaderTitleStyle}>Seguindo</h1>

            <div style={desktopSeguindoHeaderActionsStyle}>
              <label style={desktopSeguindoHeaderSearchShellStyle}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={desktopSeguindoHeaderSearchIconStyle}
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  aria-label={
                    visualizandoListaSocialDoPerfil
                      ? `Pesquisar em ${descricaoListaSocial}`
                      : abaConteudo === "seguidores"
                        ? "Pesquisar seguidor ou perfil"
                        : abaConteudo === "obras"
                          ? "Pesquisar obra, autor, gênero ou tag"
                          : "Pesquisar pessoa, autor ou perfil"
                  }
                  placeholder={
                    visualizandoListaSocialDoPerfil
                      ? `Pesquisar em ${descricaoListaSocial}`
                      : abaConteudo === "seguidores"
                        ? "Pesquisar seguidor ou perfil"
                        : abaConteudo === "obras"
                          ? "Pesquisar obra, autor, gênero ou tag"
                          : "Pesquisar pessoa, autor ou perfil"
                  }
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  style={desktopSeguindoHeaderSearchInputStyle}
                  type="text"
                />
              </label>

              <button
                type="button"
                onClick={() => setMostrarPainelOrdenacao(true)}
                style={desktopSeguindoHeaderFilterButtonStyle}
                aria-label="Abrir classificação de Seguindo"
              >
                <span>Filtros</span>
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </header>
        ) : (
          <header style={seguindoHeaderStyle}>
            <button
              type="button"
              onClick={() => setMostrarPainelOrdenacao(true)}
              style={seguindoHeaderFilterButtonStyle}
              aria-label="Abrir classificação de Seguindo"
            >
              <span>Seguindo</span>
              <span style={seguindoHeaderFilterIconStyle} aria-hidden="true">
                +
              </span>
            </button>

            {buscaSeguindoAberta ? (
              <>
                <label style={seguindoHeaderSearchShellStyle}>
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    aria-label={
                      visualizandoListaSocialDoPerfil
                        ? `Pesquisar em ${descricaoListaSocial}`
                        : abaConteudo === "seguidores"
                          ? "Pesquisar seguidor ou perfil"
                          : abaConteudo === "obras"
                            ? "Pesquisar obra, autor, gênero ou tag"
                            : "Pesquisar pessoa, autor ou perfil"
                    }
                    placeholder={
                      visualizandoListaSocialDoPerfil
                        ? `Pesquisar em ${descricaoListaSocial}`
                        : abaConteudo === "seguidores"
                          ? "Pesquisar seguidor ou perfil"
                          : abaConteudo === "obras"
                            ? "Pesquisar obra, autor, gênero ou tag"
                            : "Pesquisar pessoa, autor ou perfil"
                    }
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    style={seguindoHeaderSearchInputStyle}
                    type="text"
                    autoFocus
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setBuscaSeguindoAberta(false);
                  }}
                  aria-label="Fechar busca"
                  aria-expanded="true"
                  style={seguindoSearchToggleStyle}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      cx="10.85"
                      cy="10.85"
                      r="6.65"
                      stroke="currentColor"
                      strokeWidth="2.15"
                    />
                    <path
                      d="M16.05 16.05L20.25 20.25"
                      stroke="currentColor"
                      strokeWidth="2.15"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setBuscaSeguindoAberta(true)}
                aria-label="Abrir busca"
                aria-expanded="false"
                style={seguindoSearchToggleStyle}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </header>
        )}
    </>
  );
}
