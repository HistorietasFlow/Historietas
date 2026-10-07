"use client";

import MetricCard from "../ObraMetricCard";
import {
  desktopStatsGridStyle,
  statsGridStyle,
  synopsisToggleIconStyle,
} from "../lib/obra-style-utils";

type ObraStatsGridProps = {
  isDesktop: boolean;
  seguidores: string;
  curtidas: string;
  curtidaAtiva: boolean;
  comentarios: string;
  sinopseAberta: boolean;
  onCurtir: () => void | Promise<void>;
  onAbrirComentarios: () => void;
  onAlternarSinopse: () => void;
};

export default function ObraStatsGrid({
  isDesktop,
  seguidores,
  curtidas,
  curtidaAtiva,
  comentarios,
  sinopseAberta,
  onCurtir,
  onAbrirComentarios,
  onAlternarSinopse,
}: ObraStatsGridProps) {
  return (
    <section style={isDesktop ? desktopStatsGridStyle : statsGridStyle}>
      <MetricCard numero={seguidores} rotulo="seguidores" />
      <MetricCard
        numero={curtidas}
        rotulo="curtidas"
        ativo={curtidaAtiva}
        mostrarCoracao
        onClick={onCurtir}
      />
      <MetricCard
        numero={comentarios}
        rotulo="comentários"
        onClick={onAbrirComentarios}
      />
      <MetricCard
        numero={
          <span
            aria-hidden="true"
            style={{
              ...synopsisToggleIconStyle,
              transform: sinopseAberta ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ⌄
          </span>
        }
        rotulo={sinopseAberta ? "Capítulos" : "Sinopse"}
        onClick={onAlternarSinopse}
        ariaLabel={sinopseAberta ? "Mostrar capítulos" : "Mostrar sinopse"}
        ariaExpanded={sinopseAberta}
      />
    </section>
  );
}
