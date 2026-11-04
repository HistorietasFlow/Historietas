import { useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TamanhoFonte } from "../components/ler-capitulo-reader-content";
import {
  execucaoIdentidadeLeitorEstaAtual,
  type IdentidadeAutenticadaLeitor,
} from "../lib/ler-capitulo-auth-identity";
import { carregarPerfilComentarioLeitor, type PerfilComentarioLeitor } from "../lib/ler-capitulo-comments-read-loader";
import { carregarPreferenciasLeitura, salvarPreferenciasLeitura } from "../lib/ler-capitulo-reading-preferences";

type SessaoPreferenciasLeitor = {
  usuarioIdLogado: string;
  tamanhoFonte: TamanhoFonte;
  mostrarLinhaProgresso: boolean;
  preferenciasCarregadas: boolean;
  identidadePreferenciasAplicada: IdentidadeAutenticadaLeitor | null;
  identidadeAutenticadaLeitorRef: MutableRefObject<IdentidadeAutenticadaLeitor>;
  setPerfilComentarioLeitor: Dispatch<SetStateAction<PerfilComentarioLeitor>>;
  setTamanhoFonte: Dispatch<SetStateAction<TamanhoFonte>>;
  setMostrarLinhaProgresso: Dispatch<SetStateAction<boolean>>;
  setPreferenciasCarregadas: Dispatch<SetStateAction<boolean>>;
  setIdentidadePreferenciasAplicada: Dispatch<
    SetStateAction<IdentidadeAutenticadaLeitor | null>
  >;
};

export function useLerCapituloSessionPreferences({
  usuarioIdLogado,
  tamanhoFonte,
  mostrarLinhaProgresso,
  preferenciasCarregadas,
  identidadePreferenciasAplicada,
  identidadeAutenticadaLeitorRef,
  setPerfilComentarioLeitor,
  setTamanhoFonte,
  setMostrarLinhaProgresso,
  setPreferenciasCarregadas,
  setIdentidadePreferenciasAplicada,
}: SessaoPreferenciasLeitor) {
  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilComentario() {
      if (!usuarioIdLogado) {
        window.setTimeout(() => {
          if (!cancelado) {
            setPerfilComentarioLeitor({
              userId: "",
              nome: "Usuário",
              avatar: "",
            });
          }
        }, 0);
        return;
      }

      const perfil = await carregarPerfilComentarioLeitor(usuarioIdLogado);

      if (!cancelado) {
        setPerfilComentarioLeitor(perfil);
      }
    }

    void carregarPerfilComentario();

    return () => {
      cancelado = true;
    };
    // Os setters pertencem à página e são estáveis; preservar a dependência original.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioIdLogado]);

  useEffect(() => {
    let cancelado = false;
    const identidadeEsperada = identidadeAutenticadaLeitorRef.current;

    if (identidadeEsperada.usuarioId !== usuarioIdLogado) {
      return;
    }

    setPreferenciasCarregadas(false);
    setIdentidadePreferenciasAplicada(null);

    const carregarPreferenciasTimer = window.setTimeout(() => {
      const preferencias = carregarPreferenciasLeitura(usuarioIdLogado);

      if (
        !execucaoIdentidadeLeitorEstaAtual({
          cancelada: cancelado,
          identidadeEsperada,
          identidadeAtual: identidadeAutenticadaLeitorRef.current,
        })
      ) {
        return;
      }

      setTamanhoFonte(preferencias.tamanhoFonte);
      setMostrarLinhaProgresso(preferencias.mostrarLinhaProgresso);
      setIdentidadePreferenciasAplicada(identidadeEsperada);
      setPreferenciasCarregadas(true);
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarPreferenciasTimer);
    };
    // Os setters pertencem à página e são estáveis; preservar a dependência original.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioIdLogado]);

  useEffect(() => {
    if (
      !preferenciasCarregadas ||
      !identidadePreferenciasAplicada ||
      !identidadePreferenciasAplicada.usuarioId.trim() ||
      identidadePreferenciasAplicada.usuarioId !== usuarioIdLogado ||
      !execucaoIdentidadeLeitorEstaAtual({
        cancelada: false,
        identidadeEsperada: identidadePreferenciasAplicada,
        identidadeAtual: identidadeAutenticadaLeitorRef.current,
      })
    ) {
      return;
    }

    salvarPreferenciasLeitura(
      {
        tamanhoFonte,
        mostrarLinhaProgresso,
        versaoTamanhoFonte: 2,
      },
      identidadePreferenciasAplicada.usuarioId
    );
  }, [
    identidadeAutenticadaLeitorRef,
    identidadePreferenciasAplicada,
    preferenciasCarregadas,
    tamanhoFonte,
    mostrarLinhaProgresso,
    usuarioIdLogado,
  ]);
}
