import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { sincronizarSelecaoInicialTop5 } from "../lib/top5-initial-selection-sync";
import { carregarDadosIniciaisTop5 } from "../lib/top5-initial-data-loader";
import { prepararConteudoInicialTop5 } from "../lib/top5-initial-content";
import { criarUsuarioTop5 } from "../lib/top5-user";
import { resolverNomeUsuarioTop5 } from "../lib/top5-user-name-resolver";
import type {
  ObraTop5,
  UsuarioTop5,
} from "../lib/top5-types";

type UseTop5InitialLoadParams = {
  setUsuario: Dispatch<SetStateAction<UsuarioTop5 | null>>;
  setCarregando: Dispatch<SetStateAction<boolean>>;
  setObras: Dispatch<SetStateAction<ObraTop5[]>>;
  setIdsSelecionados: Dispatch<SetStateAction<string[]>>;
};

export function useTop5InitialLoad({
  setUsuario,
  setCarregando,
  setObras,
  setIdsSelecionados,
}: UseTop5InitialLoadParams) {

  useEffect(() => {
    let cancelado = false;

    async function iniciarPagina() {
      setCarregando(true);

      try {
        const {
          authData,
          obrasSupabase,
        } = await carregarDadosIniciaisTop5();

        if (cancelado) {
          return;
        }

        const userId = authData.user?.id || "";
        const nomeUsuario = await resolverNomeUsuarioTop5(
          userId,
          authData.user?.user_metadata?.nome,
          authData.user?.user_metadata?.name,
          authData.user?.email,
        );

        if (cancelado) {
          return;
        }

        const {
          obrasMescladas,
          idsSalvos,
          idsNormalizados,
        } = prepararConteudoInicialTop5(
          userId,
          obrasSupabase,
        );

        setUsuario(
          criarUsuarioTop5(
            userId,
            nomeUsuario,
          ),
        );
        setObras(obrasMescladas);
        setIdsSelecionados(idsNormalizados);

        sincronizarSelecaoInicialTop5(
          userId,
          idsSalvos,
          idsNormalizados,
        );
      } catch {
        if (!cancelado) {
          setUsuario(null);
          setObras([]);
          setIdsSelecionados([]);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void iniciarPagina();

    return () => {
      cancelado = true;
    };
  }, [
    setCarregando,
    setIdsSelecionados,
    setObras,
    setUsuario,
  ]);

}
