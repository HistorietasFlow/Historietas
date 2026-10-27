import { normalizarTexto } from "../../../../lib/utils";

type DenunciaComResumo = {
  alvoResumo: string;
};

export function conteudoDenunciadoIndisponivel(denuncia: DenunciaComResumo) {
  const resumo = normalizarTexto(denuncia.alvoResumo);

  return (
    resumo.includes("conteudo removido pela moderacao") ||
    resumo.includes("publicacao nao encontrada ou removida") ||
    resumo.includes("comentario nao encontrado ou removido") ||
    resumo.includes("comentario de capitulo nao encontrado ou removido") ||
    resumo.includes("obra nao encontrada ou removida") ||
    resumo.includes("capitulo nao encontrado ou removido") ||
    resumo.includes("comentario da obra nao encontrado ou removido") ||
    resumo.includes("anotacao do diario nao encontrada ou removida") ||
    resumo.includes("comentario do diario nao encontrado ou removido") ||
    resumo.includes("nao encontrada ou removida") ||
    resumo.includes("nao encontrado ou removido")
  );
}
