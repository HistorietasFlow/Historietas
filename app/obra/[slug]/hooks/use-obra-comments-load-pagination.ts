import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { idObraSupabaseValido } from "../../../../lib/utils";
import {
  execucaoIdentidadeObraEstaAtual,
  type IdentidadeAutenticadaObra,
} from "../lib/obra-auth-identity";
import {
  carregarComentariosObraLocais,
  salvarComentariosObraLocais,
} from "../lib/obra-local-comment-storage-utils";
import {
  mesclarComentariosObraPorId,
  type ComentarioObraPublico,
} from "../lib/obra-comment-utils";
import { carregarPaginaComentariosObraSupabase } from "../lib/obra-supabase-comments-page-loader";

type UseObraCommentsLoadPaginationParams = {
  comentariosAbertos: boolean;
  obraIdComentarios: string;
  usuarioIdLogado: string;
  identidadeAutenticadaObraRef: {
    current: IdentidadeAutenticadaObra;
  };
  comentariosCarregando: boolean;
  comentariosCarregandoMais: boolean;
  comentariosTemMais: boolean;
  comentariosProximoOffset: number;
  setComentariosObra: Dispatch<SetStateAction<ComentarioObraPublico[]>>;
  setTotalComentariosObra: Dispatch<SetStateAction<number>>;
  setComentariosCarregando: Dispatch<SetStateAction<boolean>>;
  setComentariosCarregandoMais: Dispatch<SetStateAction<boolean>>;
  setComentariosTemMais: Dispatch<SetStateAction<boolean>>;
  setComentariosProximoOffset: Dispatch<SetStateAction<number>>;
  setComentarioStatus: Dispatch<SetStateAction<string>>;
};

export function useObraCommentsLoadPagination({
  comentariosAbertos,
  obraIdComentarios,
  usuarioIdLogado,
  identidadeAutenticadaObraRef,
  comentariosCarregando,
  comentariosCarregandoMais,
  comentariosTemMais,
  comentariosProximoOffset,
  setComentariosObra,
  setTotalComentariosObra,
  setComentariosCarregando,
  setComentariosCarregandoMais,
  setComentariosTemMais,
  setComentariosProximoOffset,
  setComentarioStatus,
}: UseObraCommentsLoadPaginationParams) {
  const comentariosConsultaVersaoRef = useRef(0);

  useEffect(() => {
    const versaoConsulta = comentariosConsultaVersaoRef.current + 1;
    comentariosConsultaVersaoRef.current = versaoConsulta;

    if (!comentariosAbertos) {
      return;
    }

    let cancelado = false;
    const execucaoAtual = () =>
      !cancelado && comentariosConsultaVersaoRef.current === versaoConsulta;

    async function carregarComentariosObra() {
      setComentarioStatus("");
      setComentariosCarregandoMais(false);
      setComentariosTemMais(false);
      setComentariosProximoOffset(0);

      if (!obraIdComentarios) {
        setComentariosObra([]);
        setTotalComentariosObra(0);
        setComentariosCarregando(false);
        return;
      }

      const comentariosLocais = usuarioIdLogado
        ? carregarComentariosObraLocais(usuarioIdLogado, obraIdComentarios)
        : [];

      if (!idObraSupabaseValido(obraIdComentarios)) {
        setComentariosObra(comentariosLocais);
        setTotalComentariosObra(comentariosLocais.length);
        setComentariosCarregando(false);
        return;
      }

      setComentariosCarregando(true);
      setComentariosObra([]);

      try {
        const pagina = await carregarPaginaComentariosObraSupabase(
          obraIdComentarios,
          0,
        );

        if (!execucaoAtual()) {
          return;
        }

        setComentariosObra(pagina.comentarios);
        setComentariosTemMais(pagina.temMais);
        setComentariosProximoOffset(pagina.proximoOffset);
        setTotalComentariosObra((totalAtual) =>
          Math.max(totalAtual, pagina.comentarios.length),
        );

        if (usuarioIdLogado) {
          salvarComentariosObraLocais(
            usuarioIdLogado,
            obraIdComentarios,
            pagina.comentarios,
          );
        }
      } catch {
        if (execucaoAtual()) {
          setComentariosObra(comentariosLocais);
          setTotalComentariosObra((totalAtual) =>
            Math.max(totalAtual, comentariosLocais.length),
          );
          setComentarioStatus(
            "Não foi possível carregar os comentários agora.",
          );
        }
      } finally {
        if (execucaoAtual()) {
          setComentariosCarregando(false);
        }
      }
    }

    void carregarComentariosObra();

    return () => {
      cancelado = true;
    };
  }, [
    comentariosAbertos,
    obraIdComentarios,
    setComentarioStatus,
    setComentariosCarregando,
    setComentariosCarregandoMais,
    setComentariosObra,
    setComentariosProximoOffset,
    setComentariosTemMais,
    setTotalComentariosObra,
    usuarioIdLogado,
  ]);

  async function carregarMaisComentariosObra() {
    if (
      !comentariosAbertos ||
      comentariosCarregando ||
      comentariosCarregandoMais ||
      !comentariosTemMais ||
      !obraIdComentarios ||
      !idObraSupabaseValido(obraIdComentarios)
    ) {
      return;
    }

    const versaoConsulta = comentariosConsultaVersaoRef.current;
    const identidadeEsperada = identidadeAutenticadaObraRef.current;
    const execucaoAtual = () =>
      comentariosConsultaVersaoRef.current === versaoConsulta &&
      execucaoIdentidadeObraEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaObraRef.current,
      });

    setComentariosCarregandoMais(true);
    setComentarioStatus("");

    try {
      const pagina = await carregarPaginaComentariosObraSupabase(
        obraIdComentarios,
        comentariosProximoOffset,
      );

      if (!execucaoAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        if (!execucaoAtual()) {
          return comentariosAtuais;
        }

        return mesclarComentariosObraPorId(
          comentariosAtuais,
          pagina.comentarios,
        );
      });
      setComentariosTemMais(pagina.temMais);
      setComentariosProximoOffset(pagina.proximoOffset);
      setTotalComentariosObra((totalAtual) => {
        if (!execucaoAtual()) {
          return totalAtual;
        }

        return Math.max(totalAtual, pagina.proximoOffset);
      });
    } catch {
      if (execucaoAtual()) {
        setComentarioStatus(
          "Não foi possível carregar mais comentários agora.",
        );
      }
    } finally {
      if (execucaoAtual()) {
        setComentariosCarregandoMais(false);
      }
    }
  }

  return {
    carregarMaisComentariosObra,
  };
}
