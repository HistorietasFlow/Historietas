import type { AbaConteudoSeguindo, OrdenacaoSeguindo } from "./seguindo-page-types";

export function obterOpcoesOrdenacaoSeguindo(
  abaConteudo: AbaConteudoSeguindo,
): Array<{ valor: OrdenacaoSeguindo; rotulo: string }> {
  return abaConteudo === "obras"
    ? [
        { valor: "padrao", rotulo: "Padrão" },
        { valor: "recentes", rotulo: "Mais recentes" },
        { valor: "antigos", rotulo: "Mais antigos" },
        { valor: "titulo", rotulo: "A-Z" },
        { valor: "progresso", rotulo: "Maior progresso" },
        { valor: "capitulos", rotulo: "Mais capítulos" },
      ]
    : [
        { valor: "padrao", rotulo: "Padrão" },
        { valor: "recentes", rotulo: "Mais recentes" },
        { valor: "antigos", rotulo: "Mais antigos" },
        { valor: "titulo", rotulo: "A-Z" },
      ];
}
