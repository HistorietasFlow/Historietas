"use client";

import { useRouter } from "next/navigation";
import { usePublicarDesktopMode } from "./hooks/use-publicar-desktop-mode";
import { usePublicarInitialAccess } from "./hooks/use-publicar-initial-access";
import { usePublicarPageState } from "./hooks/use-publicar-page-state";
import { usePublicarPagePresentation } from "./hooks/use-publicar-page-presentation";
import { usePublicarFormController } from "./hooks/use-publicar-form-controller";
import {
  PublicarLoadingShell,
  PublicarPageShell,
} from "./components/PublicarPageShell";
import { PublicarPageBackdrop } from "./components/PublicarPageBackdrop";
import { PublicarWorkPreview } from "./components/PublicarWorkPreview";
import { PublicarPublicationForm } from "./components/PublicarPublicationForm";
import { criarPropsComponentesPaginaPublicar } from "./lib/publicar-page-component-props";
import {
  desktopMainGridSingleStyle,
  mainGridStyle,
} from "./lib/publicar-form-upload-styles";

export default function PublicarPage() {
  const router = useRouter();

  const {
    erro,
    processando,
    setErro,
    setProcessando,
    setVerificandoAutenticacao,
    verificandoAutenticacao,
  } = usePublicarPageState();
  const isDesktop = usePublicarDesktopMode();
  const presentation = usePublicarPagePresentation();
  const formulario = usePublicarFormController({
    router,
    setErro,
    setProcessando,
    t: presentation.t,
  });
  const { publicationFormProps, workPreviewProps } =
    criarPropsComponentesPaginaPublicar({
      erro,
      formulario,
      isDesktop,
      presentation,
      processando,
    });

  usePublicarInitialAccess({
    router,
    setAutor: formulario.setAutor,
    setVerificandoAutenticacao,
  });

  if (verificandoAutenticacao) {
    return (
      <PublicarLoadingShell
        isDesktop={isDesktop}
        pageThemeStyle={presentation.pageThemeStyle}
      />
    );
  }

  return (
    <main style={presentation.pageThemeStyle}>
      <PublicarPageBackdrop isDesktop={isDesktop} />

      <PublicarPageShell
        isDesktop={isDesktop}
        novaObra={presentation.t("novaObra")}
        voltarHome={presentation.t("voltarHome")}
      >
        <section style={isDesktop ? desktopMainGridSingleStyle : mainGridStyle}>
          <PublicarPublicationForm {...publicationFormProps} />

          <PublicarWorkPreview {...workPreviewProps} />
        </section>
      </PublicarPageShell>
    </main>
  );
}
