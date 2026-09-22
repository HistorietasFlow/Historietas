import { obterLinhasTexto } from "./community-text-lines";

export function obterTodasOpcoesEnquete(texto: string) {
  return obterLinhasTexto(texto)
    .map((linha) => {
      const match = /^(?:opção|opcao|alternativa)\s*\d*\s*[:\-]\s*(.+)$/i.exec(linha);

      return match?.[1]?.trim() || "";
    })
    .filter(Boolean);
}
