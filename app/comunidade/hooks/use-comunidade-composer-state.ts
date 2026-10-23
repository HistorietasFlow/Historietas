"use client";

import { useEffect, useRef, useState } from "react";
import type { CategoriaComunidade } from "../components/community-category";
import type { TipoPublicacaoComunidade } from "../components/community-publication-type";
import type { VisibilidadePostComunidade } from "../components/community-post-visibility";

export function useComunidadeComposerState() {
  const [categoriaPost, setCategoriaPost] =
    useState<CategoriaComunidade>("Geral");
  const [tipoPublicacaoPost, setTipoPublicacaoPost] =
    useState<TipoPublicacaoComunidade>("Discussão");
  const [visibilidadePost, setVisibilidadePost] =
    useState<VisibilidadePostComunidade>("publico");
  const [temSpoilerPost, setTemSpoilerPost] = useState(false);
  const [obraRelacionadaBusca, setObraRelacionadaBusca] = useState("");
  const [capituloRelacionadoPost, setCapituloRelacionadoPost] = useState("");
  const [sugestoesObrasAbertas, setSugestoesObrasAbertas] = useState(false);
  const textoPostRef = useRef<HTMLTextAreaElement | null>(null);
  const obraRelacionadaRef = useRef<HTMLInputElement | null>(null);
  const [composerAberto, setComposerAberto] = useState(false);

  useEffect(() => {
    if (composerAberto) {
      return;
    }

    const fecharSugestoesTimer = window.setTimeout(() => {
      setSugestoesObrasAbertas(false);
      setObraRelacionadaBusca("");
      setVisibilidadePost("publico");
    }, 0);

    return () => {
      window.clearTimeout(fecharSugestoesTimer);
    };
  }, [composerAberto]);

  return {
    categoriaPost,
    setCategoriaPost,
    tipoPublicacaoPost,
    setTipoPublicacaoPost,
    visibilidadePost,
    setVisibilidadePost,
    temSpoilerPost,
    setTemSpoilerPost,
    obraRelacionadaBusca,
    setObraRelacionadaBusca,
    capituloRelacionadoPost,
    setCapituloRelacionadoPost,
    sugestoesObrasAbertas,
    setSugestoesObrasAbertas,
    textoPostRef,
    obraRelacionadaRef,
    composerAberto,
    setComposerAberto,
  };
}
