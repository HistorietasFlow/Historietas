"use client";

import { useState } from "react";

type UsePublicarBasicFieldsParams = {
  setErro: (erro: string) => void;
};

export function usePublicarBasicFields({
  setErro,
}: UsePublicarBasicFieldsParams) {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [sinopse, setSinopse] = useState("");

  function atualizarSinopse(valor: string) {
    setSinopse(valor);
    setErro("");
  }

  function atualizarTitulo(valor: string) {
    setTitulo(valor);
    setErro("");
  }

  function atualizarAutor(valor: string) {
    setAutor(valor);
    setErro("");
  }

  return {
    atualizarAutor,
    atualizarSinopse,
    atualizarTitulo,
    autor,
    setAutor,
    sinopse,
    titulo,
  };
}
