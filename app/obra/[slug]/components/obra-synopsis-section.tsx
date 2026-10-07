"use client";

import {
  accentSectionTitleStyle,
  sectionHeaderStyle,
  synopsisCardStyle,
  synopsisSectionStyle,
  synopsisTextStyle,
} from "../lib/obra-style-utils";

type ObraSynopsisSectionProps = {
  texto: string;
};

export default function ObraSynopsisSection({
  texto,
}: ObraSynopsisSectionProps) {
  return (
    <section id="sinopse" style={synopsisSectionStyle}>
      <div style={sectionHeaderStyle}>
        <h2 style={accentSectionTitleStyle}>SINOPSE</h2>
      </div>

      <div style={synopsisCardStyle}>
        <p
          data-historietas-i18n-ignore="true"
          style={synopsisTextStyle}
        >
          {texto}
        </p>
      </div>
    </section>
  );
}
