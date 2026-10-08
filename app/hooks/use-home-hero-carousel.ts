"use client";

import { useEffect, useState } from "react";

export default function useHomeHeroCarousel(
  termoBusca: string,
  totalObrasHero: number,
) {
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const redefinirHeroTimer = window.setTimeout(() => {
      setHeroIndex(0);
    }, 0);

    return () => {
      window.clearTimeout(redefinirHeroTimer);
    };
  }, [termoBusca]);

  useEffect(() => {
    if (totalObrasHero === 0) {
      return;
    }

    const ajustarHeroTimer = window.setTimeout(() => {
      setHeroIndex((indexAtual) =>
        indexAtual >= totalObrasHero ? 0 : indexAtual
      );
    }, 0);

    return () => {
      window.clearTimeout(ajustarHeroTimer);
    };
  }, [totalObrasHero]);

  useEffect(() => {
    if (totalObrasHero <= 1) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setHeroIndex((indexAtual) => (indexAtual + 1) % totalObrasHero);
    }, 9000);

    return () => window.clearInterval(intervalo);
  }, [totalObrasHero]);

  return {
    heroIndex,
    setHeroIndex,
  };
}
