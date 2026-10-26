"use client";

import { useEffect } from "react";

type UseLoginPasswordChangedNoticeParams = {
  t: (key: "passwordChangedNotice") => string;
  setModo: (modo: "entrar") => void;
  setErro: (erro: string) => void;
  setAviso: (aviso: string) => void;
};

export function useLoginPasswordChangedNotice({
  t,
  setModo,
  setErro,
  setAviso,
}: UseLoginPasswordChangedNoticeParams) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("senhaRedefinida") !== "1") {
      return;
    }

    const atualizarAvisoTimer = window.setTimeout(() => {
      setModo("entrar");
      setErro("");
      setAviso(t("passwordChangedNotice"));
    }, 0);

    return () => {
      window.clearTimeout(atualizarAvisoTimer);
    };
  }, [setAviso, setErro, setModo, t]);
}
