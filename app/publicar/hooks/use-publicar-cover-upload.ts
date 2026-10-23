"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { arquivoImagemAceito } from "../lib/publicar-file-utils";
import { TAMANHO_MAXIMO_CAPA } from "../lib/publicar-static-options";

type UsePublicarCoverUploadParams = {
  setErro: Dispatch<SetStateAction<string>>;
};

export function usePublicarCoverUpload({
  setErro,
}: UsePublicarCoverUploadParams) {
  const [capa, setCapa] = useState("");
  const [capaNome, setCapaNome] = useState("");
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null);
  const [capaErro, setCapaErro] = useState("");
  const capaInputRef = useRef<HTMLInputElement | null>(null);

  function selecionarCapa(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setCapaErro("");
    setErro("");

    if (!arquivo) {
      return;
    }

    if (!arquivoImagemAceito(arquivo)) {
      setCapaErro("Escolha um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_CAPA) {
      setCapaErro("A capa precisa ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setCapaErro("Não consegui carregar essa imagem.");
        return;
      }

      setCapa(resultado);
      setCapaNome(arquivo.name);
      setCapaArquivo(arquivo);
    };

    leitor.onerror = () => {
      setCapaErro("Não consegui carregar essa imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerCapa() {
    setCapa("");
    setCapaNome("");
    setCapaArquivo(null);
    setCapaErro("");

    if (capaInputRef.current) {
      capaInputRef.current.value = "";
    }
  }

  return {
    capa,
    capaArquivo,
    capaErro,
    capaInputRef,
    capaNome,
    removerCapa,
    selecionarCapa,
  };
}
