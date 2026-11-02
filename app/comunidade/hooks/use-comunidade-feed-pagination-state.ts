"use client";

import { useState } from "react";
import type { PostComunidade } from "../components/community-post-model";

export function useComunidadeFeedPaginationState() {
  const [posts, setPosts] = useState<PostComunidade[]>([]);
  const [carregandoFeed, setCarregandoFeed] = useState(true);
  const [paginaFeedComunidade, setPaginaFeedComunidade] = useState(0);
  const [temMaisPostsComunidade, setTemMaisPostsComunidade] = useState(false);
  const [carregandoMaisPostsComunidade, setCarregandoMaisPostsComunidade] =
    useState(false);

  return {
    posts,
    setPosts,
    carregandoFeed,
    setCarregandoFeed,
    paginaFeedComunidade,
    setPaginaFeedComunidade,
    temMaisPostsComunidade,
    setTemMaisPostsComunidade,
    carregandoMaisPostsComunidade,
    setCarregandoMaisPostsComunidade,
  };
}
