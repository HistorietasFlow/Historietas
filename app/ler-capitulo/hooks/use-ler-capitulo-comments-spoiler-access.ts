"use client";

import { useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";
import { carregarAcessoComentariosCapitulo } from "../lib/ler-capitulo-comments-spoiler-access";
import { execucaoIdentidadeLeitorEstaAtual, type IdentidadeAutenticadaLeitor } from "../lib/ler-capitulo-auth-identity";

type Parametros = {
  obraId: string;
  capituloId: string;
  aberto: boolean;
  lidoCapituloSalvando: boolean;
  dadosDaIdentidadeAtual: boolean;
  versaoConta: number;
  identidadeDadosAplicada: IdentidadeAutenticadaLeitor | null;
  identidadeAutenticadaLeitorRef: RefObject<IdentidadeAutenticadaLeitor>;
};

export function useLerCapituloCommentsSpoilerAccess({
  obraId, capituloId, aberto, lidoCapituloSalvando,
  dadosDaIdentidadeAtual, versaoConta,
  identidadeDadosAplicada, identidadeAutenticadaLeitorRef,
}: Parametros) {
  // A referência muda também ao voltar para um capítulo/conta anterior.
  const contexto = useMemo(() => ({ obraId, capituloId, aberto, identidadeDadosAplicada, versaoConta, dadosDaIdentidadeAtual }),
    [obraId, capituloId, aberto, identidadeDadosAplicada, versaoConta, dadosDaIdentidadeAtual]);
  const [revelacao, setRevelacao] = useState<object | null>(null);
  const [versao, setVersao] = useState(0);
  const verificacao = useMemo(() => ({ contexto, versao, lidoCapituloSalvando }),
    [contexto, versao, lidoCapituloSalvando]);
  const [confirmacao, setConfirmacao] = useState<{ verificacao: object; permitido: boolean } | null>(null);
  const identidadeValida = dadosDaIdentidadeAtual;

  useEffect(() => {
    if (!aberto || !identidadeValida || !identidadeDadosAplicada || lidoCapituloSalvando) return;
    let cancelada = false;
    const identidadeEsperada = identidadeDadosAplicada;
    void carregarAcessoComentariosCapitulo(obraId, capituloId, identidadeEsperada.usuarioId)
      .catch(() => false)
      .then((permitido) => {
        if (execucaoIdentidadeLeitorEstaAtual({
          cancelada, identidadeEsperada, identidadeAtual: identidadeAutenticadaLeitorRef.current,
        })) setConfirmacao({ verificacao, permitido });
      });
    return () => { cancelada = true; };
  }, [aberto, identidadeValida, identidadeDadosAplicada, identidadeAutenticadaLeitorRef,
    lidoCapituloSalvando, obraId, capituloId, verificacao]);

  useEffect(() => {
    if (!aberto) return;
    const revalidar = () => {
      if (document.visibilityState === "visible") setVersao((atual) => atual + 1);
    };
    window.addEventListener("focus", revalidar);
    document.addEventListener("visibilitychange", revalidar);
    return () => {
      window.removeEventListener("focus", revalidar);
      document.removeEventListener("visibilitychange", revalidar);
    };
  }, [aberto]);

  return {
    comentariosLiberados: aberto && identidadeValida && (
      revelacao === contexto || (confirmacao?.verificacao === verificacao && confirmacao.permitido)
    ),
    revelarComentarios: () => setRevelacao(contexto),
  };
}
