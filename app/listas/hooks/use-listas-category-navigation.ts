"use client";

export function useListasCategoryNavigation<TCategoria extends string>({
  queryAtual,
  router,
  setCategoria,
}: {
  queryAtual: string;
  router: { replace: (href: string, options: { scroll: false }) => void };
  setCategoria: (categoria: TCategoria) => void;
}) {
  function trocarCategoria(novaCategoria: TCategoria) {
    setCategoria(novaCategoria);

    const params = new URLSearchParams(queryAtual);
    params.set("categoria", novaCategoria);

    router.replace(`/listas?${params.toString()}`, { scroll: false });
  }

  return { trocarCategoria };
}
