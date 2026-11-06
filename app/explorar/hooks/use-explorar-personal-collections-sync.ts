"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ObraLocal } from "../lib/explorar-work-normalizers";
import { obraTemAtividadeLeitura } from "../lib/explorar-work-normalizers";
import {
  carregarListaIdsUsuarioExplorar,
  salvarListaIdsUsuarioExplorar,
} from "../lib/explorar-local-storage";
import { carregarColecoesUsuarioExplorar } from "../lib/explorar-remote-loader";

type OpcoesSincronizacaoColecoesExplorar = {
  usuarioIdExplorar: string;
  versaoRetryColecoes: number;
  obrasCacheLocalRef: RefObject<ObraLocal[]>;
  setObrasFavoritas: Dispatch<SetStateAction<string[]>>;
  setObrasConcluidas: Dispatch<SetStateAction<string[]>>;
  setObrasComLeitura: Dispatch<SetStateAction<string[]>>;
  setColecoesCarregadas: Dispatch<SetStateAction<boolean>>;
  setErroColecoesExplorar: Dispatch<SetStateAction<boolean>>;
  FAVORITES_STORAGE_KEY: string;
  COMPLETED_STORAGE_KEY: string;
};

function normalizarIds(ids: readonly string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

export function useExplorarPersonalCollectionsSync({
  usuarioIdExplorar,
  versaoRetryColecoes,
  obrasCacheLocalRef,
  setObrasFavoritas,
  setObrasConcluidas,
  setObrasComLeitura,
  setColecoesCarregadas,
  setErroColecoesExplorar,
  FAVORITES_STORAGE_KEY,
  COMPLETED_STORAGE_KEY,
}: OpcoesSincronizacaoColecoesExplorar) {
  const versaoIdentidadeRef = useRef(0);

  useEffect(() => {
    const numeroVersao = versaoIdentidadeRef.current + 1;
    versaoIdentidadeRef.current = numeroVersao;
    let cancelado = false;
    const userId = usuarioIdExplorar.trim();

    if (!userId) {
      setObrasFavoritas([]);
      setObrasConcluidas([]);
      setObrasComLeitura([]);
      setErroColecoesExplorar(false);
      setColecoesCarregadas(true);
      return;
    }

    setColecoesCarregadas(false);

    const favoritasLocais = carregarListaIdsUsuarioExplorar(
      FAVORITES_STORAGE_KEY,
      userId,
    );
    const concluidasLocais = carregarListaIdsUsuarioExplorar(
      COMPLETED_STORAGE_KEY,
      userId,
    );
    const comLeituraLocal = obrasCacheLocalRef.current
      .filter(obraTemAtividadeLeitura)
      .map((obra) => obra.id);

    setObrasFavoritas(favoritasLocais);
    setObrasConcluidas(concluidasLocais);
    setObrasComLeitura(normalizarIds(comLeituraLocal));

    void carregarColecoesUsuarioExplorar(userId).then((colecoes) => {
      if (
        cancelado ||
        versaoIdentidadeRef.current !== numeroVersao
      ) {
        return;
      }

      const favoritas = normalizarIds([
        ...favoritasLocais,
        ...colecoes.favoritas,
      ]);
      const concluidas = normalizarIds([
        ...concluidasLocais,
        ...colecoes.concluidas,
      ]);
      const comLeitura = normalizarIds([
        ...comLeituraLocal,
        ...colecoes.comLeitura,
      ]);

      salvarListaIdsUsuarioExplorar(
        FAVORITES_STORAGE_KEY,
        userId,
        favoritas,
      );
      salvarListaIdsUsuarioExplorar(
        COMPLETED_STORAGE_KEY,
        userId,
        concluidas,
      );
      setObrasFavoritas(favoritas);
      setObrasConcluidas(concluidas);
      setObrasComLeitura(comLeitura);
      setErroColecoesExplorar(colecoes.falhaTemporaria);
      setColecoesCarregadas(true);
    });

    return () => {
      cancelado = true;
    };
  }, [
    usuarioIdExplorar,
    versaoRetryColecoes,
    obrasCacheLocalRef,
    setObrasFavoritas,
    setObrasConcluidas,
    setObrasComLeitura,
    setColecoesCarregadas,
    setErroColecoesExplorar,
    FAVORITES_STORAGE_KEY,
    COMPLETED_STORAGE_KEY,
  ]);
}
