import { obterTodasOpcoesEnquete } from "./community-all-poll-options";
import {
  MAX_OPCOES_ENQUETE,
  MIN_OPCOES_ENQUETE,
} from "./community-poll-constants";
import { obterPerguntaEnquete } from "./community-poll-question";
import type { TipoPublicacaoComunidade } from "./community-publication-type";
import { obterLinhasTexto } from "./community-text-lines";

export type ResultadoValidacaoConteudoPublicacaoComunidade =
  | { valido: false; erro: string }
  | { valido: true; publicacaoEhEnquete: boolean };

export function validarConteudoPublicacaoComunidade(
  textoLimpo: string,
  tipoPublicacaoPost: TipoPublicacaoComunidade
): ResultadoValidacaoConteudoPublicacaoComunidade {
  if (textoLimpo.length < 8) {
    return {
      valido: false,
      erro: "Escreva uma publicação com pelo menos 8 caracteres.",
    };
  }

  const linhasPost = obterLinhasTexto(textoLimpo);
  const primeiraLinhaPost = linhasPost[0] || "";
  const publicacaoEhEnquete =
    tipoPublicacaoPost === "Enquete" || /^enquete\s*[:\-]/i.test(primeiraLinhaPost);

  if (publicacaoEhEnquete) {
    const perguntaEnquete = obterPerguntaEnquete(textoLimpo);
    const opcoesEnquete = obterTodasOpcoesEnquete(textoLimpo);

    if (!/^enquete\s*[:\-]/i.test(primeiraLinhaPost) || !perguntaEnquete.trim()) {
      return {
        valido: false,
        erro: "Escreva a pergunta da enquete na primeira linha.",
      };
    }

    if (opcoesEnquete.length < MIN_OPCOES_ENQUETE) {
      return {
        valido: false,
        erro: "A enquete precisa ter pelo menos 2 opções preenchidas.",
      };
    }

    if (opcoesEnquete.length > MAX_OPCOES_ENQUETE) {
      return {
        valido: false,
        erro: "A enquete pode ter no máximo 4 opções.",
      };
    }
  }

  return {
    valido: true,
    publicacaoEhEnquete,
  };
}
