import { useCallback, useState } from "react";
import type { OrdenacaoComentariosObra } from "../lib/obra-comment-utils";

export function useObraCommentsOrdering() {
  const [ordenacaoComentarios, setOrdenacaoComentarios] =
    useState<OrdenacaoComentariosObra>("relevantes");
  const [menuOrdenacaoComentariosAberto, setMenuOrdenacaoComentariosAberto] =
    useState(false);

  const fecharMenuOrdenacaoComentarios = useCallback(() => {
    setMenuOrdenacaoComentariosAberto(false);
  }, []);

  const alternarMenuOrdenacaoComentarios = useCallback(() => {
    setMenuOrdenacaoComentariosAberto((aberto) => !aberto);
  }, []);

  const selecionarComentariosRelevantes = useCallback(() => {
    setOrdenacaoComentarios("relevantes");
    setMenuOrdenacaoComentariosAberto(false);
  }, []);

  const selecionarComentariosRecentes = useCallback(() => {
    setOrdenacaoComentarios("recentes");
    setMenuOrdenacaoComentariosAberto(false);
  }, []);

  return {
    ordenacaoComentarios,
    menuOrdenacaoComentariosAberto,
    alternarMenuOrdenacaoComentarios,
    selecionarComentariosRelevantes,
    selecionarComentariosRecentes,
    fecharMenuOrdenacaoComentarios,
  };
}
