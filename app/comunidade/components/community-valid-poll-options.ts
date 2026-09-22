import { obterTodasOpcoesEnquete } from "./community-all-poll-options";
import {
  MAX_OPCOES_ENQUETE,
  MIN_OPCOES_ENQUETE,
} from "./community-poll-constants";

export function obterOpcoesEnquete(texto: string) {
  const opcoes = obterTodasOpcoesEnquete(texto).slice(0, MAX_OPCOES_ENQUETE);

  return opcoes.length >= MIN_OPCOES_ENQUETE ? opcoes : [];
}
