"use client";

import { useRouter } from "next/navigation";
import { usePublicarDesktopMode } from "./hooks/use-publicar-desktop-mode";
import { usePublicarInitialAccess } from "./hooks/use-publicar-initial-access";
import { usePublicarPageState } from "./hooks/use-publicar-page-state";
import { usePublicarPagePresentation } from "./hooks/use-publicar-page-presentation";
import { usePublicarFormController } from "./hooks/use-publicar-form-controller";
import {
  PublicarLoadingShell,
} from "./components/PublicarPageShell";
import { PublicarPageContent } from "./components/PublicarPageContent";
import { criarPropsComponentesPaginaPublicar } from "./lib/publicar-page-component-props";

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
