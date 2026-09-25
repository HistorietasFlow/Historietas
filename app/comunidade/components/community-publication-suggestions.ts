import type { Dispatch, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import type { SugestaoPublicacaoComunidade } from "./community-publication-suggestion";
import { traduzirTextoComunidade } from "./community-text-translator";

type AplicarSugestaoPublicacaoComunidadeParams = {
  sugestao: SugestaoPublicacaoComunidade;
  publicandoPost: boolean;
  setErro: Dispatch<SetStateAction<string>>;
  setCategoriaPost: Dispatch<
    SetStateAction<SugestaoPublicacaoComunidade["categoria"]>
  >;
  setTipoPublicacaoPost: Dispatch<
    SetStateAction<SugestaoPublicacaoComunidade["tipo"]>
  >;
  textoPostRef: { current: HTMLTextAreaElement | null };
  language: HistorietasLanguage;
};

export const SUGESTOES_PUBLICACAO_COMUNIDADE: SugestaoPublicacaoComunidade[] = [
  {
    rotulo: "O que você está lendo?",
    texto: "O que você está lendo atualmente? Eu estou lendo: ",
    categoria: "Geral",
    tipo: "Discussão",
  },
  {
    rotulo: "Compartilhe uma teoria",
    texto: "Minha teoria sobre esta obra é: ",
    categoria: "Discussão",
    tipo: "Teoria",
  },
  {
    rotulo: "Personagem com história própria",
    texto: "Qual personagem merece uma história própria? Para mim: ",
    categoria: "Discussão",
    tipo: "Discussão",
  },
  {
    rotulo: "Mostre o próximo capítulo",
    texto: "Autores: compartilhem um trecho do próximo capítulo. Aqui vai o meu: ",
    categoria: "Divulgação",
    tipo: "Aviso de capítulo",
  },
  {
    rotulo: "Pedir recomendações",
    texto: "Que tipo de história você quer encontrar no HISTORIETAS? Eu gostaria de ler: ",
    categoria: "Recomendações",
    tipo: "Pedido de indicação",
  },
];

export function aplicarSugestaoPublicacaoComunidade({
  sugestao,
  publicandoPost,
  setErro,
  setCategoriaPost,
  setTipoPublicacaoPost,
  textoPostRef,
  language,
}: AplicarSugestaoPublicacaoComunidadeParams) {
  if (publicandoPost) {
    return;
  }

  setErro("");
  setCategoriaPost(sugestao.categoria);
  setTipoPublicacaoPost(sugestao.tipo);

  window.setTimeout(() => {
    const campoTexto = textoPostRef.current;

    if (!campoTexto) {
      return;
    }

    const textoSugestao = traduzirTextoComunidade(sugestao.texto, language);
    const textoAtualSemEspacosFinais = campoTexto.value.replace(/\s+$/, "");
    const proximoTexto = textoAtualSemEspacosFinais.trim()
      ? `${textoAtualSemEspacosFinais}\n\n${textoSugestao}`
      : textoSugestao;

    // Preserva o que já foi digitado: a sugestão é acrescentada, nunca sobrescreve.
    campoTexto.value = proximoTexto.slice(0, 700);
    campoTexto.focus();
    campoTexto.setSelectionRange(
      campoTexto.value.length,
      campoTexto.value.length,
    );
  }, 0);
}
