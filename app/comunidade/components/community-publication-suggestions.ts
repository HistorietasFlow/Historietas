import type { SugestaoPublicacaoComunidade } from "./community-publication-suggestion";

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
