import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { confirmarEditorialRemoto, filtroStatusEditorial, type ConfirmacaoEditorial } from "../../../lib/statusEditorial";
import { carregarObraSupabaseEdicaoObra } from "../lib/editar-obra-work-loader";
import type { ResultadoEdicaoRemota } from "../lib/editar-obra-editorial-write";
import { obterObraIdEdicaoObra } from "../lib/editar-obra-search-params";

function rotaAtual(obraId: string) {
  return typeof window === "undefined" || obterObraIdEdicaoObra(window.location.search) === obraId;
}

export function useEditarObraEditorial() {
  const contexto = useRef({ versao: 0, conta: undefined as string | undefined, obraId: "", userId: "", ativo: true });
  const [confirmado, setConfirmado] = useState<ConfirmacaoEditorial | null>(null);
  const [escolha, setEscolha] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  const [reconciliando, setReconciliando] = useState(false);
  const [exigeDecisao, setExigeDecisao] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEdicaoRemota["estado"] | "indisponivel" | null>(null);

  useEffect(() => {
    const estadoContexto = contexto.current;
    estadoContexto.ativo = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const conta = session?.user.id || "";
      if (contexto.current.conta !== undefined && contexto.current.conta !== conta) {
        contexto.current.versao += 1;
        setConfirmado(null);
        setEscolha(""); setExigeDecisao(false); setReconciliando(false);
        setBloqueado(true);
        setResultado("indisponivel");
      }
      contexto.current.conta = conta;
    });
    return () => {
      estadoContexto.ativo = false;
      estadoContexto.versao += 1;
      subscription.unsubscribe();
    };
  }, []);

  const iniciarCarga = useCallback((obraId: string) => {
    const versao = ++contexto.current.versao;
    contexto.current.obraId = obraId;
    contexto.current.userId = "";
    setConfirmado(null); setEscolha(""); setBloqueado(false); setExigeDecisao(false); setResultado(null);
    setReconciliando(false);
    const atual = () => contexto.current.ativo && contexto.current.versao === versao && rotaAtual(obraId);
    return {
      atual,
      identificar(userId: string) {
        if (!atual() || (contexto.current.conta !== undefined && contexto.current.conta !== userId)) return false;
        contexto.current.userId = userId;
        return true;
      },
      confirmar(row: unknown) {
        if (!atual()) return;
        const confirmacao = confirmarEditorialRemoto(row, obraId, contexto.current.userId);
        setConfirmado(confirmacao);
        setEscolha(confirmacao?.status || "");
        if (!confirmacao) setResultado("indisponivel");
      },
      cancelar() { if (atual()) contexto.current.versao += 1; },
    };
  }, []);

  function capturar() {
    const versao = contexto.current.versao;
    const { obraId, userId } = contexto.current;
    return { confirmado, escolha: filtroStatusEditorial(escolha) || null,
      vigente: () => contexto.current.ativo && contexto.current.versao === versao &&
        rotaAtual(obraId) &&
        contexto.current.obraId === obraId && contexto.current.userId === userId &&
        (contexto.current.conta === undefined || contexto.current.conta === userId),
      podeSalvar: !bloqueado && !exigeDecisao && !reconciliando,
      concluir(resposta: ResultadoEdicaoRemota) {
        if (contexto.current.versao !== versao || !contexto.current.ativo) return;
        setResultado(resposta.estado);
        if (resposta.estado === "confirmada") {
          setConfirmado(resposta.confirmacao);
          setEscolha(resposta.confirmacao.status || "");
        } else {
          setBloqueado(true); setExigeDecisao(false);
        }
      },
    };
  }

  async function reconciliar() {
    if (reconciliando) return;
    const versao = contexto.current.versao;
    const { obraId, userId } = contexto.current;
    setReconciliando(true); setConfirmado(null); setBloqueado(true); setExigeDecisao(false);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || data.user?.id !== userId || contexto.current.versao !== versao) return;
      const row = await carregarObraSupabaseEdicaoObra(obraId, userId);
      if (contexto.current.versao !== versao || !contexto.current.ativo) return;
      const atual = confirmarEditorialRemoto(row, obraId, userId);
      setConfirmado(atual);
      setExigeDecisao(Boolean(atual));
      if (!atual) setResultado("indisponivel");
      // Uma leitura, mesmo coincidente, nunca confirma o PATCH anterior.
    } catch {
      if (contexto.current.versao === versao && contexto.current.ativo) setResultado("indisponivel");
    } finally {
      if (contexto.current.versao === versao && contexto.current.ativo) setReconciliando(false);
    }
  }

  return { confirmado, escolha, resultado, bloqueado, reconciliando, exigeDecisao,
    iniciarCarga, capturar, reconciliar,
    escolher(valor: string) { setEscolha(filtroStatusEditorial(valor)); },
    decidirManterEscolha() { if (confirmado && exigeDecisao) { setBloqueado(false); setExigeDecisao(false); setResultado(null); } },
    decidirUsarAtual() { if (confirmado && exigeDecisao) { setEscolha(confirmado.status || ""); setBloqueado(false); setExigeDecisao(false); setResultado(null); } },
  };
}
