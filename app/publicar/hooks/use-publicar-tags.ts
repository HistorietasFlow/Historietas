"use client";

import { useMemo, useState } from "react";
import { normalizarTexto } from "../../../lib/utils";
import { limparTextoPersonalizado, textoPersonalizadoValido } from "../lib/publicar-text-utils";
import {
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  LIMITE_TAGS_OBRA,
  OUTRA_TAG_VALUE,
} from "../lib/publicar-static-options";

type UsePublicarTagsParams = {
  setErro: (erro: string) => void;
};

export function usePublicarTags({ setErro }: UsePublicarTagsParams) {
  const [tags, setTags] = useState("");
  const [tagPersonalizada, setTagPersonalizada] = useState("");
  const [usarTagPersonalizada, setUsarTagPersonalizada] = useState(false);

  const tagsDaObra = useMemo(() => {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, LIMITE_TAGS_OBRA);
  }, [tags]);

  function tagEstaSelecionada(tag: string) {
    return tagsDaObra.some((tagAtual) => {
      return normalizarTexto(tagAtual) === normalizarTexto(tag);
    });
  }

  function atualizarTagPersonalizada(valor: string) {
    const textoLimpo = limparTextoPersonalizado(
      valor,
      LIMITE_CARACTERES_TAG_PERSONALIZADA,
    );

    setTagPersonalizada(textoLimpo);
    setTags(
      textoPersonalizadoValido(
        textoLimpo,
        2,
        LIMITE_CARACTERES_TAG_PERSONALIZADA,
      )
        ? textoLimpo.trim().replace(/\s+/g, " ")
        : "",
    );
    setErro("");
  }

  function adicionarTagSelecionada(tag: string) {
    if (!tag) {
      return;
    }

    if (tag === OUTRA_TAG_VALUE) {
      setUsarTagPersonalizada(true);
      setTags(
        textoPersonalizadoValido(
          tagPersonalizada,
          2,
          LIMITE_CARACTERES_TAG_PERSONALIZADA,
        )
          ? tagPersonalizada.trim().replace(/\s+/g, " ")
          : "",
      );
      setErro("");
      return;
    }

    if (tagEstaSelecionada(tag)) {
      return;
    }

    setUsarTagPersonalizada(false);
    setTagPersonalizada("");
    setTags(tag);
    setErro("");
  }

  function atualizarTagSelecionada(tag: string) {
    if (!tag) {
      setUsarTagPersonalizada(false);
      setTagPersonalizada("");
      setTags("");
      setErro("");
      return;
    }

    adicionarTagSelecionada(tag);
  }

  return {
    atualizarTagPersonalizada,
    atualizarTagSelecionada,
    tagPersonalizada,
    tags,
    tagsDaObra,
    usarTagPersonalizada,
  };
}
