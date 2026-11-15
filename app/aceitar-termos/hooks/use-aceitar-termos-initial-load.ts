"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  obterRedirectToAceiteTermos,
  verificarAceiteTermosPublicacao,
} from "../../../lib/aceiteTermos";
import { supabase } from "../../../lib/supabase/client";

import { criarExecucaoAceite, execucaoAceiteEstaAtual, type ExecucaoAceite } from "../lib/aceitar-termos-execution";
import type { ChaveTexto } from "../lib/aceitar-termos-translations";

type AceitarTermosRouter = {
  replace: (href: string) => void;
};

type UseAceitarTermosInitialLoadParams = {
  router: AceitarTermosRouter;
  t: (chave: ChaveTexto) => string;
  setSalvando: Dispatch<SetStateAction<boolean>>;
  setConfirmouTermos: Dispatch<SetStateAction<boolean>>;
  setConfirmouPrivacidade: Dispatch<SetStateAction<boolean>>;
  setRedirectTo: Dispatch<SetStateAction<string>>;
  setJaAceito: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setCarregando: Dispatch<SetStateAction<boolean>>;
};

export function useAceitarTermosInitialLoad({
  router,
  t,
  setSalvando,
  setConfirmouTermos,
  setConfirmouPrivacidade,
  setRedirectTo,
  setJaAceito,
  setErro,
  setCarregando,
}: UseAceitarTermosInitialLoadParams) {
  const textoRef = useRef(t);
  useLayoutEffect(() => { textoRef.current = t; }, [t]);
  const contextoRef = useRef(criarExecucaoAceite());
  const [tentativa, setTentativa] = useState(0);
  useLayoutEffect(() => {
    let ativo = true;
    const params = new URLSearchParams(window.location.search);
    const destino = obterRedirectToAceiteTermos(params.get("redirectTo"), "/");
    setRedirectTo(destino);

    function invalidar() {
      contextoRef.current.ativo = false;
      const execucao = criarExecucaoAceite();
      contextoRef.current = execucao;
      setJaAceito(false);
      setConfirmouTermos(false);
      setConfirmouPrivacidade(false);
      setSalvando(false);
      setErro("");
      setCarregando(true);
      return execucao;
    }
    async function carregar(execucao: ExecucaoAceite, identidadeEsperada?: string) {
      const atual = () => ativo && execucaoAceiteEstaAtual(contextoRef, execucao);
      try {
        if (!atual()) return;
        const { data, error } = await supabase.auth.getUser();
        if (!atual()) return;
        if (error || !data.user) {
          setErro(textoRef.current("erroLogin"));
          const paramsLogin = new URLSearchParams({
            redirectTo: `/aceitar-termos?${new URLSearchParams({ redirectTo: destino }).toString()}`,
          });
          router.replace(`/login?${paramsLogin.toString()}`);
          return;
        }
        if (identidadeEsperada !== undefined && data.user.id !== identidadeEsperada) {
          setErro(textoRef.current("erroLogin"));
          return;
        }
        execucao.usuarioId = data.user.id;
        const status = await verificarAceiteTermosPublicacao();
        if (!atual()) return;
        const confirmacao = await supabase.auth.getUser();
        if (!atual()) return;
        if (confirmacao.error || confirmacao.data.user?.id !== execucao.usuarioId) {
          setErro(textoRef.current("erroLogin"));
          return;
        }
        execucao.pronto = true;
        execucao.aceito = status.aceito;
        setJaAceito(status.aceito);
        setErro(status.erro && !status.aceito ? status.erro : "");
      } catch (error) {
        if (atual()) setErro(error instanceof Error ? error.message : textoRef.current("erroCarregar"));
      } finally {
        if (atual()) setCarregando(false);
      }
    }
    const inicial = invalidar();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (!ativo) return;
      const id = sessao?.user.id || "";
      if (evento !== "SIGNED_OUT" && id && id === contextoRef.current.usuarioId) return;
      const execucao = invalidar();
      // Consultas ficam fora do callback síncrono de Auth.
      queueMicrotask(() => { void carregar(execucao, id); });
    });
    void carregar(inicial);
    return () => {
      ativo = false;
      contextoRef.current.ativo = false;
      subscription.unsubscribe();
    };
  }, [router, tentativa, setRedirectTo, setJaAceito, setErro, setCarregando,
    setSalvando, setConfirmouTermos, setConfirmouPrivacidade]);

  return { contextoRef, recarregar: () => setTentativa(valor => valor + 1) };
}
