import { obterLinhasTexto } from "./community-text-lines";

export function obterPerguntaEnquete(texto: string) {
  const linhas = obterLinhasTexto(texto);
  const primeiraLinha = linhas[0] || "Enquete da comunidade";

  return (
    primeiraLinha.replace(/^enquete\s*[:\-]\s*/i, "").trim() ||
    "Enquete da comunidade"
  );
}
