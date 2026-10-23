"use client";

import { useRouter } from "next/navigation";
import { criarPropsComponentesPaginaPublicar } from "../lib/publicar-page-component-props";
import { usePublicarDesktopMode } from "./use-publicar-desktop-mode";
import { usePublicarFormController } from "./use-publicar-form-controller";
import { usePublicarInitialAccess } from "./use-publicar-initial-access";
import { usePublicarPagePresentation } from "./use-publicar-page-presentation";
import { usePublicarPageState } from "./use-publicar-page-state";

export function usePublicarPageController() {
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

  return {
    isDesktop,
    presentation,
    publicationFormProps,
    verificandoAutenticacao,
    workPreviewProps,
  };
}
