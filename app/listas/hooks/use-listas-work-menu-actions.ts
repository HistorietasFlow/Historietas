"use client";

import { supabase } from "../../../lib/supabase/client";
import { colecaoTemObraListas, removerObraDaColecaoListas } from "../lib/listas-local-work-utils";
import { criarLoginHrefListas, carregarListaIdsListas, salvarListaIdsListas } from "../lib/listas-storage-utils";
import { copiarTextoComFallback } from "../lib/listas-work-menu-share-utils";
import { sincronizarQueroLerListas } from "../lib/listas-want-to-read-persistence";

type ObraMenuListas = {
  id: string;
  slug: string;
  titulo: string;
  autor: string;
  link: string;
};

type EditorAnotacaoComSalvamento = {
  salvando: boolean;
};

type RouterListas = {
  push: (href: string) => unknown;
};

type UseListasWorkMenuActionsProps<
  TObra extends ObraMenuListas,
  TItem,
  TCategoria,
  TEditor extends EditorAnotacaoComSalvamento,
> = {
  editorAnotacao: TEditor;
  editorAnotacaoVazio: TEditor;
  obraMenuAberta: TObra | null;
  obraMenuNoQueroLer: boolean;
  router: RouterListas;
  salvandoQueroLer: boolean;
  setCategoriaMenuAberta: (categoria: TCategoria) => void;
  setEditorAnotacao: (editor: TEditor) => void;
  setItemPerfilMenuAberto: (item: TItem | null) => void;
  setObraMenuAberta: (obra: TObra | null) => void;
  setObraMenuNoQueroLer: (valor: boolean) => void;
  setSalvandoQueroLer: (valor: boolean) => void;
  storageKey: string;
  usuarioAtualId: string;
};

export function useListasWorkMenuActions<
  TObra extends ObraMenuListas,
  TItem,
  TCategoria,
  TEditor extends EditorAnotacaoComSalvamento,
>({
  editorAnotacao,
  editorAnotacaoVazio,
  obraMenuAberta,
  obraMenuNoQueroLer,
  router,
  salvandoQueroLer,
  setCategoriaMenuAberta,
  setEditorAnotacao,
  setItemPerfilMenuAberto,
  setObraMenuAberta,
  setObraMenuNoQueroLer,
  setSalvandoQueroLer,
  storageKey,
  usuarioAtualId,
}: UseListasWorkMenuActionsProps<TObra, TItem, TCategoria, TEditor>) {
  async function abrirMenuObra(
    obra: TObra,
    item: TItem | null = null,
    categoriaAtual: TCategoria = "tudo" as TCategoria,
  ) {
    setObraMenuAberta(obra);
    setItemPerfilMenuAberto(item);
    setCategoriaMenuAberta(categoriaAtual);
    setObraMenuNoQueroLer(false);
    setEditorAnotacao(editorAnotacaoVazio);

    try {
      const userId =
        usuarioAtualId ||
        (await supabase.auth.getUser()).data.user?.id ||
        "";

      if (!userId) {
        return;
      }

      const listaLocal = carregarListaIdsListas(storageKey, userId);
      const salvoLocalmente = colecaoTemObraListas(listaLocal, obra);

      setObraMenuNoQueroLer(salvoLocalmente);

      const { data, error } = await supabase
        .from("seguindo_obras")
        .select("obra_id")
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .limit(1);

      if (error) {
        return;
      }

      const salvoRemotamente = Array.isArray(data) && data.length > 0;
      const salvo = salvoLocalmente || salvoRemotamente;

      setObraMenuNoQueroLer(salvo);

      if (salvoRemotamente && !salvoLocalmente) {
        salvarListaIdsListas(
          storageKey,
          userId,
          Array.from(new Set([...listaLocal, obra.id])),
        );
      }
    } catch {
      // O estado local continua disponível mesmo sem resposta do Supabase.
    }
  }

  function fecharMenuObra() {
    if (salvandoQueroLer || editorAnotacao.salvando) {
      return;
    }

    setObraMenuAberta(null);
    setItemPerfilMenuAberto(null);
    setObraMenuNoQueroLer(false);
    setEditorAnotacao(editorAnotacaoVazio);
  }

  async function alternarObraNoQueroLer() {
    if (!obraMenuAberta || salvandoQueroLer) {
      return;
    }

    const obra = obraMenuAberta;
    setSalvandoQueroLer(true);

    try {
      const userId =
        usuarioAtualId ||
        (await supabase.auth.getUser()).data.user?.id ||
        "";

      if (!userId) {
        setObraMenuAberta(null);
        router.push(criarLoginHrefListas());
        return;
      }

      const listaAtual = carregarListaIdsListas(storageKey, userId);
      const jaEstaSalva =
        obraMenuNoQueroLer || colecaoTemObraListas(listaAtual, obra);
      const proximoEstado = !jaEstaSalva;
      const listaAtualizada = proximoEstado
        ? Array.from(new Set([...listaAtual, obra.id]))
        : removerObraDaColecaoListas(listaAtual, obra);

      salvarListaIdsListas(storageKey, userId, listaAtualizada);
      setObraMenuNoQueroLer(proximoEstado);
      setObraMenuAberta(null);
      setItemPerfilMenuAberto(null);

      await sincronizarQueroLerListas(userId, obra.id, proximoEstado);
    } finally {
      setSalvandoQueroLer(false);
    }
  }

  async function compartilharObraDoMenu() {
    if (!obraMenuAberta) {
      return;
    }

    const link = new URL(obraMenuAberta.link, window.location.origin).toString();
    const dados: ShareData = {
      title: `${obraMenuAberta.titulo} no HISTORIETAS`,
      text: `Confira ${obraMenuAberta.titulo} de ${obraMenuAberta.autor} no HISTORIETAS.`,
      url: link,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(dados);
        fecharMenuObra();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      let copiado = false;

      if (
        window.isSecureContext &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        try {
          await navigator.clipboard.writeText(link);
          copiado = true;
        } catch {
          copiado = copiarTextoComFallback(link);
        }
      } else {
        copiado = copiarTextoComFallback(link);
      }

      if (!copiado) {
        throw new Error("Não foi possível copiar o link.");
      }

      fecharMenuObra();
    } catch {
      // Mantém a ação silenciosa quando o compartilhamento não estiver disponível.
    }
  }

  return {
    abrirMenuObra,
    fecharMenuObra,
    alternarObraNoQueroLer,
    compartilharObraDoMenu,
  };
}
