import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  carregarInteracoesAnotacoesListas,
  type InteracoesAnotacoesListasEstado,
} from "../lib/listas-diary-interactions-loader";

type ItemComAnotacaoListas = {
  anotacaoId?: string;
};

type UseListasDiaryInteractionsSyncParams = {
  listasPerfil: Record<string, ItemComAnotacaoListas[]>;
  modo: string;
  usuarioAtualId: string;
  setInteracoesAnotacoes: Dispatch<
    SetStateAction<InteracoesAnotacoesListasEstado>
  >;
};

export function useListasDiaryInteractionsSync({
  listasPerfil,
  modo,
  usuarioAtualId,
  setInteracoesAnotacoes,
}: UseListasDiaryInteractionsSyncParams) {
  useEffect(() => {
    let cancelado = false;

    if (modo !== "perfil") {
      setInteracoesAnotacoes({});
      return;
    }

    const anotacaoIds = Array.from(
      new Set(
        Object.values(listasPerfil)
          .flat()
          .map((item) => item.anotacaoId?.trim() || "")
          .filter(Boolean),
      ),
    );

    void carregarInteracoesAnotacoesListas(
      anotacaoIds,
      usuarioAtualId,
    ).then((carregadas) => {
      if (cancelado) return;

      setInteracoesAnotacoes((atuais) => {
        const proximo: InteracoesAnotacoesListasEstado = {};

        Object.entries(carregadas).forEach(([id, interacao]) => {
          proximo[id] = {
            ...interacao,
            novoComentario: atuais[id]?.novoComentario || "",
            respondendoComentarioId:
              atuais[id]?.respondendoComentarioId || "",
            respondendoAutorNome: atuais[id]?.respondendoAutorNome || "",
            ordenacaoComentarios:
              atuais[id]?.ordenacaoComentarios || "relevantes",
          };
        });

        return proximo;
      });
    });

    return () => {
      cancelado = true;
    };
  // Mantém a fronteira de dependências do efeito original da página.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listasPerfil, modo, usuarioAtualId]);
}
