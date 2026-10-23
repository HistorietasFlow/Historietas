"use client";

import { useState } from "react";
import {
  ehClassificacao18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import { limparTextoPersonalizado } from "../lib/publicar-text-utils";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
} from "../lib/publicar-static-options";

type UsePublicarPublicationOptionsParams = {
  setErro: (erro: string) => void;
};

export function usePublicarPublicationOptions({
  setErro,
}: UsePublicarPublicationOptionsParams) {
  const [genero, setGenero] = useState("");
  const [generoPersonalizado, setGeneroPersonalizado] = useState("");
  const [formato, setFormato] = useState("");
  const [formatoPersonalizado, setFormatoPersonalizado] = useState("");
  const [classificacaoIndicativa, setClassificacaoIndicativa] = useState("");
  const [avisosConteudo18, setAvisosConteudo18] = useState<AvisoConteudo18[]>([]);

  function alternarAvisoConteudo18(aviso: AvisoConteudo18) {
    setAvisosConteudo18((avisosAtuais) =>
      avisosAtuais.includes(aviso)
        ? avisosAtuais.filter((item) => item !== aviso)
        : [...avisosAtuais, aviso],
    );
    setErro("");
  }

  function atualizarFormato(valor: string) {
    setFormato(valor);

    if (valor !== OUTRO_FORMATO_VALUE) {
      setFormatoPersonalizado("");
    }

    setErro("");
  }

  function atualizarFormatoPersonalizado(valor: string) {
    setFormatoPersonalizado(
      limparTextoPersonalizado(
        valor,
        LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
      ),
    );
    setErro("");
  }

  function atualizarGenero(valor: string) {
    setGenero(valor);

    if (valor !== OUTRO_GENERO_VALUE) {
      setGeneroPersonalizado("");
    }

    setErro("");
  }

  function atualizarGeneroPersonalizado(valor: string) {
    setGeneroPersonalizado(
      limparTextoPersonalizado(
        valor,
        LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
      ),
    );
    setErro("");
  }

  function atualizarClassificacaoIndicativa(valor: string) {
    setClassificacaoIndicativa(valor);

    if (!ehClassificacao18(valor)) {
      setAvisosConteudo18([]);
    }

    setErro("");
  }

  return {
    alternarAvisoConteudo18,
    atualizarClassificacaoIndicativa,
    atualizarFormato,
    atualizarFormatoPersonalizado,
    atualizarGenero,
    atualizarGeneroPersonalizado,
    avisosConteudo18,
    classificacaoIndicativa,
    formato,
    formatoPersonalizado,
    genero,
    generoPersonalizado,
  };
}
