import { normalizarTexto } from "../../../lib/utils";

type TipoPublicacaoComunidade =
  | "Discussão"
  | "Teoria"
  | "Enquete"
  | "Pedido de indicação"
  | "Divulgação"
  | "Review"
  | "Aviso de capítulo"
  | "Dúvida";

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

