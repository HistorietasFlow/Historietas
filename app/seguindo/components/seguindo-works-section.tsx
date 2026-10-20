"use client";

import { SeguindoEmptyState } from "./seguindo-empty-state";
import { SeguindoWorkCard } from "./seguindo-work-card";
import {
  desktopGridStyle,
  gridStyle,
} from "../lib/seguindo-grid-layout-styles";
import {
  desktopSectionStyle,
  sectionStyle,
} from "../lib/seguindo-section-header-styles";
import type { ObraLocal } from "../lib/seguindo-page-types";

type SeguindoWorksSectionProps = {
  isDesktop: boolean;
  obrasFiltradas: ObraLocal[];
  visualizandoListaSocialDoPerfil: boolean;
  onDeixarDeSeguirObra: (obra: ObraLocal) => void;
};

export function SeguindoWorksSection({
  isDesktop,
  obrasFiltradas,
  visualizandoListaSocialDoPerfil,
  onDeixarDeSeguirObra,
}: SeguindoWorksSectionProps) {
  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      {obrasFiltradas.length === 0 ? (
        <SeguindoEmptyState>
          Nenhuma obra seguida encontrada
        </SeguindoEmptyState>
      ) : (
        <div style={isDesktop ? desktopGridStyle : gridStyle}>
          {obrasFiltradas.map((obra) => (
            <SeguindoWorkCard
              key={obra.id}
              obra={obra}
              isDesktop={isDesktop}
              visualizandoListaSocialDoPerfil={visualizandoListaSocialDoPerfil}
              onDeixarDeSeguirObra={(obraSeguida) =>
                void onDeixarDeSeguirObra(obraSeguida)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
