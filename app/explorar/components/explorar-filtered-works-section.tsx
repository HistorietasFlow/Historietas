import type { ReactNode } from "react";
import ObraPublicadaCard from "./explorar-obra-publicada-card";
import { SectionHeader } from "./explorar-section-components";
import type { TemaCategoriaExplorar } from "./explorar-section-components";
import {
  desktopPublishedGridStyle,
  desktopSectionStyle,
  gridStyle,
  sectionStyle,
} from "../lib/explorar-content-styles";
import type { ObraLocal } from "../lib/explorar-work-normalizers";

type ExplorarFilteredWorksSectionProps = {
  obras: ObraLocal[];
  titulo: string;
  tema: TemaCategoriaExplorar;
  isDesktop: boolean;
  children?: ReactNode;
};

export function ExplorarFilteredWorksSection({
  obras,
  titulo,
  tema,
  isDesktop,
  children,
}: ExplorarFilteredWorksSectionProps) {
  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <SectionHeader title={titulo} tema={tema} isDesktop={isDesktop} />

      <div style={isDesktop ? desktopPublishedGridStyle : gridStyle}>
        {obras.map((obra) => (
          <ObraPublicadaCard
            key={obra.id}
            obra={obra}
            isDesktop={isDesktop}
          />
        ))}
      </div>

      {children}
    </section>
  );
}
