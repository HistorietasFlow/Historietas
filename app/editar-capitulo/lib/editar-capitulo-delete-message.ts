import type { HistorietasLanguage } from "../../../lib/i18n";

export function criarMensagemConfirmacaoExclusaoCapitulo(
  tituloCapitulo: string,
  idioma: HistorietasLanguage,
) {
  const tituloSeguro = tituloCapitulo.trim() || "Capítulo";

  if (idioma === "en") {
    return `Delete "${tituloSeguro}" permanently? This action cannot be undone.`;
  }

  if (idioma === "es") {
    return `¿Eliminar "${tituloSeguro}" permanentemente? Esta acción no se puede deshacer.`;
  }

  return `Excluir "${tituloSeguro}" permanentemente? Esta ação não pode ser desfeita.`;
}
