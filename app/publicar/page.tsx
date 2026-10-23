"use client";

import { usePublicarPageController } from "./hooks/use-publicar-page-controller";
import {
  PublicarLoadingShell,
} from "./components/PublicarPageShell";
import { PublicarPageContent } from "./components/PublicarPageContent";

export default function PublicarPage() {
  const {
    isDesktop,
    presentation,
    publicationFormProps,
    verificandoAutenticacao,
    workPreviewProps,
  } = usePublicarPageController();

  if (verificandoAutenticacao) {
    return (
      <PublicarLoadingShell
        isDesktop={isDesktop}
        pageThemeStyle={presentation.pageThemeStyle}
      />
    );
  }

  return (
    <PublicarPageContent
      isDesktop={isDesktop}
      novaObra={presentation.t("novaObra")}
      pageThemeStyle={presentation.pageThemeStyle}
      publicationFormProps={publicationFormProps}
      voltarHome={presentation.t("voltarHome")}
      workPreviewProps={workPreviewProps}
    />
  );
}
