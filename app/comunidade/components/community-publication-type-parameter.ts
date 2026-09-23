import { normalizarTexto } from "../../../lib/utils";
import type { TipoPublicacaoComunidade } from "./community-publication-type";

const TIPOS_PUBLICACAO_COMUNIDADE: TipoPublicacaoComunidade[] = [
  "Discussão",
  "Teoria",
  "Enquete",
  "Pedido de indicação",
  "Divulgação",
  "Review",
  "Aviso de capítulo",
  "Dúvida",
];

export function obterTipoPublicacaoPorParametro(valor: string) {
  const valorNormalizado = normalizarTexto(valor);

  if (!valorNormalizado) {
    return null;
  }

  return (
    TIPOS_PUBLICACAO_COMUNIDADE.find(
      (tipo) => normalizarTexto(tipo) === valorNormalizado
    ) || null
  );
}
