"use client";

import { useState } from "react";

export function useComunidadeFeedActionState() {
  const [feedbackAcao, setFeedbackAcao] = useState("");
  const [publicandoPost, setPublicandoPost] = useState(false);
  const [postCurtindoId, setPostCurtindoId] = useState<string | null>(null);
  const [postSalvandoId, setPostSalvandoId] = useState<string | null>(null);
  const [postCompartilhandoId, setPostCompartilhandoId] = useState<
    string | null
  >(null);
  const [postRemovendoId, setPostRemovendoId] = useState<string | null>(null);
  const [postFixandoId, setPostFixandoId] = useState<string | null>(null);
  const [postVisibilidadeAtualizandoId, setPostVisibilidadeAtualizandoId] =
    useState<string | null>(null);

  return {
    feedbackAcao,
    setFeedbackAcao,
    publicandoPost,
    setPublicandoPost,
    postCurtindoId,
    setPostCurtindoId,
    postSalvandoId,
    setPostSalvandoId,
    postCompartilhandoId,
    setPostCompartilhandoId,
    postRemovendoId,
    setPostRemovendoId,
    postFixandoId,
    setPostFixandoId,
    postVisibilidadeAtualizandoId,
    setPostVisibilidadeAtualizandoId,
  };
}
