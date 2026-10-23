import type { ComponentProps, CSSProperties } from "react";
import {
  desktopMainGridSingleStyle,
  mainGridStyle,
} from "../lib/publicar-form-upload-styles";
import { PublicarPageBackdrop } from "./PublicarPageBackdrop";
import { PublicarPageShell } from "./PublicarPageShell";
import { PublicarPublicationForm } from "./PublicarPublicationForm";
import { PublicarWorkPreview } from "./PublicarWorkPreview";

type PublicarPageContentProps = {
  isDesktop: boolean;
  novaObra: string;
  pageThemeStyle: CSSProperties;
  publicationFormProps: ComponentProps<typeof PublicarPublicationForm>;
  voltarHome: string;
  workPreviewProps: ComponentProps<typeof PublicarWorkPreview>;
};

export function PublicarPageContent({
  isDesktop,
  novaObra,
  pageThemeStyle,
  publicationFormProps,
  voltarHome,
  workPreviewProps,
}: PublicarPageContentProps) {
  return (
    <main style={pageThemeStyle}>
      <PublicarPageBackdrop isDesktop={isDesktop} />

      <PublicarPageShell
        isDesktop={isDesktop}
        novaObra={novaObra}
        voltarHome={voltarHome}
      >
        <section style={isDesktop ? desktopMainGridSingleStyle : mainGridStyle}>
          <PublicarPublicationForm {...publicationFormProps} />

          <PublicarWorkPreview {...workPreviewProps} />
        </section>
      </PublicarPageShell>
    </main>
  );
}
