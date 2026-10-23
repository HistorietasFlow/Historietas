import { formatarTamanhoArquivo } from "../../../lib/utils";
import type { ArquivoObraLocal } from "./publicar-models";
import {
  calcularMinutosLeitura,
  contarCaracteresValidos,
  contarPalavras,
} from "./publicar-text-utils";
import type { ChaveTextoPublicar } from "./publicar-translations";

type ObterMetadadosFormularioPublicarParams = {
  arquivoCapituloTexto: string;
  arquivoObra: ArquivoObraLocal | null;
  arquivoTextoPendente: File | null;
  sinopse: string;
  t: (chave: ChaveTextoPublicar) => string;
};

export function obterMetadadosFormularioPublicar({
  arquivoCapituloTexto,
  arquivoObra,
  arquivoTextoPendente,
  sinopse,
  t,
}: ObterMetadadosFormularioPublicarParams) {
  const sinopseCaracteresValidos = contarCaracteresValidos(sinopse);
  const sinopsePalavras = contarPalavras(sinopse);
  const arquivoObraTamanhoTexto = arquivoObra
    ? formatarTamanhoArquivo(arquivoObra.tamanho)
    : "";
  const arquivoObraTipoTexto = arquivoObra
    ? arquivoObra.categoria === "imagem"
      ? t("imagem")
      : arquivoObra.categoria === "documento"
      ? "PDF"
      : arquivoObra.categoria === "texto"
      ? t("texto")
      : t("arquivo")
    : "";
  const arquivoTextoPendenteTamanhoTexto = arquivoTextoPendente
    ? formatarTamanhoArquivo(arquivoTextoPendente.size)
    : "";
  const arquivoCapituloPalavras = contarPalavras(arquivoCapituloTexto);
  const arquivoCapituloMinutos = calcularMinutosLeitura(arquivoCapituloTexto);

  return {
    arquivoCapituloMinutos,
    arquivoCapituloPalavras,
    arquivoObraTamanhoTexto,
    arquivoObraTipoTexto,
    arquivoTextoPendenteTamanhoTexto,
    sinopseCaracteresValidos,
    sinopsePalavras,
  };
}
