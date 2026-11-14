"use client";

import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { UsuarioBuscaComunidade } from "../components/community-user";
import type { ContextoSeguimentoComunidade } from "../components/community-user-follow-context";
import { normalizarTermoBuscaUsuariosComunidade } from "../components/community-user-search-term-normalizer";

const usuariosVazios: UsuarioBuscaComunidade[] = [];
const idsVazios: string[] = [];

function useEstadoPorContexto<T>(
  chave: string,
  inicial: T,
  contexto: ContextoSeguimentoComunidade
): [T, Dispatch<SetStateAction<T>>] {
  const [estado, setEstado] = useState({ chave, contexto, valor: inicial });
  const atualizar = useCallback((proximo: SetStateAction<T>) => {
    if (!contexto.vigente()) return;
    setEstado((anterior) => {
      if (!contexto.vigente()) return anterior;
      const valor = anterior.chave === chave && anterior.contexto === contexto
        ? anterior.valor : inicial;
      return {
        chave,
        contexto,
        valor: typeof proximo === "function" ? (proximo as (valor: T) => T)(valor) : proximo,
      };
    });
  }, [chave, inicial, contexto]);
  return [estado.chave === chave && estado.contexto === contexto ? estado.valor : inicial, atualizar];
}

type Opcoes = {
  usuarioId: string | undefined;
  termoBusca: string;
  versaoAutenticacao: number;
  autenticacaoComunidadeVersaoRef: { current: number };
};

export function useComunidadeUserSearchFollowState({
  usuarioId,
  termoBusca,
  versaoAutenticacao,
  autenticacaoComunidadeVersaoRef,
}: Opcoes) {
  const [buscaComunidadeAberta, setBuscaComunidadeAberta] = useState(false);
  const versao = versaoAutenticacao;
  const chaveConta = JSON.stringify([usuarioId || "", versao]);
  const contextoSeguimento = useMemo<ContextoSeguimentoComunidade>(() => ({
    usuarioId: usuarioId || "",
    vigente: () => autenticacaoComunidadeVersaoRef.current === versao,
    alteracoes: new Map(),
    idsCarregados: null,
  }), [autenticacaoComunidadeVersaoRef, versao, usuarioId]);
  const termo = normalizarTermoBuscaUsuariosComunidade(termoBusca);
  const chaveBusca = JSON.stringify([chaveConta, buscaComunidadeAberta, termo]);
  const contextoBusca = useMemo(() => ({
    ...contextoSeguimento, chaveBusca,
  }), [contextoSeguimento, chaveBusca]);
  // Dados de outro termo/conta ficam ocultos no próprio render, antes dos efeitos.
  const [usuariosBuscaComunidade, setUsuariosBuscaComunidade] = useEstadoPorContexto(
    chaveBusca, usuariosVazios, contextoBusca
  );
  const [carregandoUsuariosBuscaComunidade, setCarregandoUsuariosBuscaComunidade] =
    useEstadoPorContexto(chaveBusca, buscaComunidadeAberta && termo.length >= 2, contextoBusca);
  const [usuariosSeguidosIds, setUsuariosSeguidosIds] = useEstadoPorContexto(
    chaveConta, idsVazios, contextoSeguimento
  );
  const [usuarioSeguindoId, setUsuarioSeguindoId] = useEstadoPorContexto<string | null>(
    chaveConta, null, contextoSeguimento
  );

  return {
    buscaComunidadeAberta,
    setBuscaComunidadeAberta,
    usuariosBuscaComunidade,
    setUsuariosBuscaComunidade,
    carregandoUsuariosBuscaComunidade,
    setCarregandoUsuariosBuscaComunidade,
    usuariosSeguidosIds,
    setUsuariosSeguidosIds,
    usuarioSeguindoId,
    setUsuarioSeguindoId,
    contextoSeguimento,
  };
}
