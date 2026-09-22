import { obterTodasOpcoesEnquete } from "./community-all-poll-options";
import { MIN_OPCOES_ENQUETE } from "./community-poll-constants";
import { obterLinhasTexto } from "./community-text-lines";

export function postEhEnquete(post: { texto: string }) {
  const linhas = obterLinhasTexto(post.texto);
  const primeiraLinha = linhas[0] || "";
  const totalOpcoes = obterTodasOpcoesEnquete(post.texto).length;

  return (
    /^enquete\s*[:\-]/i.test(primeiraLinha) &&
    totalOpcoes >= MIN_OPCOES_ENQUETE
  );
}
