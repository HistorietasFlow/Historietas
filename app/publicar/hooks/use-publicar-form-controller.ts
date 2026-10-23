"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SalvarObraPublicarParams } from "../lib/publicar-submission-action";
import type { ChaveTextoPublicar } from "../lib/publicar-translations";
import { obterMetadadosFormularioPublicar } from "../lib/publicar-form-display-metadata";
import { usePublicarBasicFields } from "./use-publicar-basic-fields";
import { usePublicarContentFileUpload } from "./use-publicar-content-file-upload";
import { usePublicarCoverUpload } from "./use-publicar-cover-upload";
import { usePublicarFormValidation } from "./use-publicar-form-validation";
import { usePublicarPublicationOptions } from "./use-publicar-publication-options";
import { usePublicarSubmission } from "./use-publicar-submission";
import { usePublicarTags } from "./use-publicar-tags";

type UsePublicarFormControllerParams = {
  router: SalvarObraPublicarParams["router"];
  setErro: Dispatch<SetStateAction<string>>;
  setProcessando: Dispatch<SetStateAction<boolean>>;
  t: (chave: ChaveTextoPublicar) => string;
};

export function usePublicarFormController({
  router,
  setErro,
  setProcessando,
  t,
}: UsePublicarFormControllerParams) {
  const basicFields = usePublicarBasicFields({ setErro });
  const tags = usePublicarTags({ setErro });
  const publicationOptions = usePublicarPublicationOptions({ setErro });
  const coverUpload = usePublicarCoverUpload({ setErro });
  const contentFileUpload = usePublicarContentFileUpload({ setErro });

  const validation = usePublicarFormValidation({
    arquivoCapituloTexto: contentFileUpload.arquivoCapituloTexto,
    arquivoObra: contentFileUpload.arquivoObra,
    autor: basicFields.autor,
    avisosConteudo18: publicationOptions.avisosConteudo18,
    capa: coverUpload.capa,
    classificacaoIndicativa: publicationOptions.classificacaoIndicativa,
    formato: publicationOptions.formato,
    formatoPersonalizado: publicationOptions.formatoPersonalizado,
    genero: publicationOptions.genero,
    generoPersonalizado: publicationOptions.generoPersonalizado,
    sinopse: basicFields.sinopse,
    tagPersonalizada: tags.tagPersonalizada,
    tags: tags.tags,
    titulo: basicFields.titulo,
    usarTagPersonalizada: tags.usarTagPersonalizada,
  });

  const metadata = obterMetadadosFormularioPublicar({
    arquivoCapituloTexto: contentFileUpload.arquivoCapituloTexto,
    arquivoObra: contentFileUpload.arquivoObra,
    arquivoTextoPendente: contentFileUpload.arquivoTextoPendente,
    sinopse: basicFields.sinopse,
    t,
  });

  const { salvarObra } = usePublicarSubmission({
    arquivoCapituloTexto: contentFileUpload.arquivoCapituloTexto,
    arquivoCapituloTitulo: contentFileUpload.arquivoCapituloTitulo,
    arquivoObra: contentFileUpload.arquivoObra,
    arquivoObraArquivo: contentFileUpload.arquivoObraArquivo,
    autor: basicFields.autor,
    avisosConteudo18Normalizados: validation.avisosConteudo18Normalizados,
    capaArquivo: coverUpload.capaArquivo,
    capaNome: coverUpload.capaNome,
    classificacaoFinal: validation.classificacaoFinal,
    formatoFinal: validation.formatoFinal,
    generoFinal: validation.generoFinal,
    router,
    setAutor: basicFields.setAutor,
    setErro,
    setProcessando,
    sinopse: basicFields.sinopse,
    tagsDaObra: tags.tagsDaObra,
    temCapituloImportado: validation.temCapituloImportado,
    titulo: basicFields.titulo,
    validarFormulario: validation.validarFormulario,
  });

  return {
    ...basicFields,
    ...tags,
    ...publicationOptions,
    ...coverUpload,
    ...contentFileUpload,
    ...validation,
    ...metadata,
    salvarObra,
  };
}
