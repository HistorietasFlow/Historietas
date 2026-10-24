import type { ComponentType } from "react";
import {
  sectionStyle,
  worksGridStyle,
} from "../lib/painel-autor-work-card-layout-style-utils";
import {
  desktopSectionStyle,
  desktopWorksGridStyle,
} from "../lib/painel-autor-desktop-compositions-style-utils";

export function PainelSecao<T extends { id: string }>({
  obras,
  isDesktop,
  onAbrirArquivo,
  onCompartilhar,
  onExcluirObra,
  Card,
}: {
  obras: T[];
  isDesktop: boolean;
  onAbrirArquivo: (obra: T) => void | Promise<void>;
  onCompartilhar: (obra: T) => void | Promise<void>;
  onExcluirObra: (obraId: string, tituloObra: string) => void | Promise<void>;
  Card: ComponentType<{
    obra: T;
    isDesktop: boolean;
    onAbrirArquivo: (obra: T) => void | Promise<void>;
    onCompartilhar: (obra: T) => void | Promise<void>;
    onExcluirObra: (obraId: string, tituloObra: string) => void | Promise<void>;
  }>;
}) {
  if (obras.length === 0) {
    return null;
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div style={isDesktop ? desktopWorksGridStyle : worksGridStyle}>
        {obras.map((obra) => (
          <Card key={obra.id} obra={obra} isDesktop={isDesktop} onAbrirArquivo={onAbrirArquivo} onCompartilhar={onCompartilhar} onExcluirObra={onExcluirObra} />
        ))}
      </div>
    </section>
  );
}
