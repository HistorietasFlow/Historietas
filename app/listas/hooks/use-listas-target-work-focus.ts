import { useEffect, type Dispatch, type SetStateAction } from "react";

type ItemComObra = {
  obra: {
    id: string;
  };
};

type RouterListas = {
  replace: (href: string, options: { scroll: boolean }) => unknown;
};

type UseListasTargetWorkFocusParams<TCategoria extends string, TItem extends ItemComObra> = {
  obraAlvoId: string;
  carregando: boolean;
  categoria: TCategoria | "tudo";
  listasPerfil: Record<TCategoria | "tudo", TItem[]>;
  modo: string;
  queryAtual: string;
  router: RouterListas;
  setCategoria: Dispatch<SetStateAction<TCategoria | "tudo">>;
  setObraDestacadaId: Dispatch<SetStateAction<string>>;
};

export function useListasTargetWorkFocus<
  TCategoria extends string,
  TItem extends ItemComObra,
>({
  obraAlvoId,
  carregando,
  categoria,
  listasPerfil,
  modo,
  queryAtual,
  router,
  setCategoria,
  setObraDestacadaId,
}: UseListasTargetWorkFocusParams<TCategoria, TItem>) {
  useEffect(() => {
    if (modo !== "perfil" || carregando || !obraAlvoId) {
      return;
    }

    const obraEstaNaCategoriaAtual = listasPerfil[categoria].some(
      (item) => item.obra.id === obraAlvoId,
    );
    const obraEstaEmTudo = listasPerfil.tudo.some(
      (item) => item.obra.id === obraAlvoId,
    );

    if (!obraEstaNaCategoriaAtual && obraEstaEmTudo && categoria !== "tudo") {
      const params = new URLSearchParams(queryAtual);
      params.set("categoria", "tudo");
      setCategoria("tudo");
      router.replace(`/listas?${params.toString()}`, { scroll: false });
      return;
    }

    const timer = window.setTimeout(() => {
      const elemento = document.getElementById(`lista-obra-${obraAlvoId}`);

      if (!elemento) return;
      setObraDestacadaId(obraAlvoId);
      elemento.scrollIntoView({ behavior: "smooth", block: "center" });

      window.setTimeout(() => {
        setObraDestacadaId((atual) => (atual === obraAlvoId ? "" : atual));
      }, 2400);
    }, 180);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Preserva as dependências do efeito original.
  }, [
    obraAlvoId,
    carregando,
    categoria,
    listasPerfil,
    modo,
    queryAtual,
    router,
  ]);
}
