"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export type IdentidadeEmAlta = { usuarioId: string; versao: number; carregada: boolean };

export function useEmAltaAuthSession({ setUsuarioLogado, setUsuarioLogadoId }: {
  setUsuarioLogado: (valor: boolean) => void;
  setUsuarioLogadoId: (valor: string) => void;
}) {
  const consultasRef = useRef(0);
  const identidadeSessaoRef = useRef<IdentidadeEmAlta>({ usuarioId: "", versao: 0, carregada: false });
  const [identidadeAplicada, setIdentidadeAplicada] = useState<IdentidadeEmAlta>({ usuarioId: "", versao: 0, carregada: false });
  function aplicarIdentidade(usuarioId: string) {
    const anterior = identidadeSessaoRef.current;
    if (anterior.carregada && anterior.usuarioId === usuarioId) return;
    const identidade = { usuarioId, versao: anterior.versao + 1, carregada: true };
    identidadeSessaoRef.current = identidade;
    setUsuarioLogado(Boolean(usuarioId));
    setUsuarioLogadoId(usuarioId);
    setIdentidadeAplicada(identidade);
  }
  useEffect(() => {
    let ativo = true;
    const consulta = ++consultasRef.current;
    const versao = identidadeSessaoRef.current.versao;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (_evento === "SIGNED_OUT") consultasRef.current += 1;
      if (ativo) aplicarIdentidade(sessao?.user?.id || "");
    });
    async function verificarUsuarioLogado() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (ativo && consultasRef.current === consulta && identidadeSessaoRef.current.versao === versao) aplicarIdentidade(error ? "" : data.user?.id || "");
      } catch {
        if (ativo && consultasRef.current === consulta && identidadeSessaoRef.current.versao === versao) aplicarIdentidade("");
      }
    }
    void verificarUsuarioLogado();
    return () => {
      ativo = false;
      consultasRef.current += 1;
      identidadeSessaoRef.current = { usuarioId: "", versao: identidadeSessaoRef.current.versao + 1, carregada: false };
      subscription.unsubscribe();
    };
    // Setters recebidos são estáveis; o callback observa a ref da sessão atual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUsuarioLogado, setUsuarioLogadoId]);

  async function usuarioTemSessaoAtiva() {
    const esperada = identidadeSessaoRef.current;
    const consulta = consultasRef.current;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (identidadeSessaoRef.current !== esperada || consultasRef.current !== consulta) return false;
      const usuarioId = error ? "" : data.user?.id || "";
      aplicarIdentidade(usuarioId);
      return Boolean(usuarioId && usuarioId === esperada.usuarioId);
    } catch {
      if (identidadeSessaoRef.current === esperada && consultasRef.current === consulta) aplicarIdentidade("");
      return false;
    }
  }
  return { usuarioTemSessaoAtiva, identidadeSessaoRef,
    autenticacaoCarregada: identidadeAplicada.carregada, versaoIdentidade: identidadeAplicada.versao };
}
