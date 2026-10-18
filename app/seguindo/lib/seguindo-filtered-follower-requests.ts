import { normalizarTexto } from "../../../lib/utils";
import type { AbaConteudoSeguindo, SolicitacaoSeguidor } from "./seguindo-page-types";

export function filtrarSolicitacoesSeguidores(
  abaConteudo: AbaConteudoSeguindo,
  listaSocialEhDoUsuarioLogado: boolean,
  solicitacoesSeguidores: SolicitacaoSeguidor[],
  termoBusca: string,
): SolicitacaoSeguidor[] {
    if (!listaSocialEhDoUsuarioLogado || abaConteudo !== "seguidores") {
      return [] as SolicitacaoSeguidor[];
    }

    const filtradas = solicitacoesSeguidores.filter((solicitacao) => {
      if (!termoBusca) {
        return true;
      }

      const textoSolicitacao = normalizarTexto(
        [
          solicitacao.usuario.nome,
          solicitacao.usuario.handle,
          solicitacao.usuario.bio,
        ].join(" "),
      );

      return textoSolicitacao.includes(termoBusca);
    });

    return [...filtradas].sort(
      (solicitacaoA, solicitacaoB) =>
        new Date(solicitacaoB.criadoEm).getTime() -
        new Date(solicitacaoA.criadoEm).getTime(),
    );

}
