import { useEffect, type Dispatch, type SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { totaisInteracoesObrasPerfilVazio } from "../constants";
import type {
  AvaliacaoDiarioPublica,
  ObraLocal,
  PerfisAutoresSalvos,
  PerfilUsuarioRemoto,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";
import {
  atualizarIdentidadeAutenticadaPerfilAutor,
  execucaoAutenticacaoPerfilAutorEstaAtual,
  type IdentidadeAutenticadaPerfilAutor,
} from "../lib/profile-auth-identity";

type Setter<T> = Dispatch<SetStateAction<T>>;

export function usePerfilAutorAuthIdentitySync({
  avatarInputRef,
  identidadeAutenticadaPerfilRef,
  versaoConsultaAutenticacaoPerfilRef,
  setPerfilUsuarioRemoto,
  setObras,
  setTotaisInteracoesObras,
  setAutoresSeguidos,
  setObrasFavoritas,
  setObrasConcluidas,
  setObrasSeguidasBiblioteca,
  setPerfisAutoresSalvos,
  setEditorPerfilAberto,
  setNomePerfilEditor,
  setUsernamePerfilEditor,
  setBioPerfilEditor,
  setAvatarPerfilEditor,
  setAvatarNomePerfilEditor,
  setAvatarArquivoPerfilEditor,
  setAvatarErro,
  setSalvandoEditorPerfil,
  setTopFiveCurtidaSalvando,
  setAvaliacaoDiario,
  setMensagemAcao,
  setCarregando,
  setUsuarioIdLogado,
  setAutenticacaoCarregada,
}: {
  avatarInputRef: { current: HTMLInputElement | null };
  identidadeAutenticadaPerfilRef: {
    current: IdentidadeAutenticadaPerfilAutor;
  };
  versaoConsultaAutenticacaoPerfilRef: { current: number };
  setPerfilUsuarioRemoto: Setter<PerfilUsuarioRemoto | null>;
  setObras: Setter<ObraLocal[]>;
  setTotaisInteracoesObras: Setter<TotaisInteracoesObrasPerfilAutor>;
  setAutoresSeguidos: Setter<string[]>;
  setObrasFavoritas: Setter<string[]>;
  setObrasConcluidas: Setter<string[]>;
  setObrasSeguidasBiblioteca: Setter<string[]>;
  setPerfisAutoresSalvos: Setter<PerfisAutoresSalvos>;
  setEditorPerfilAberto: Setter<boolean>;
  setNomePerfilEditor: Setter<string>;
  setUsernamePerfilEditor: Setter<string>;
  setBioPerfilEditor: Setter<string>;
  setAvatarPerfilEditor: Setter<string>;
  setAvatarNomePerfilEditor: Setter<string>;
  setAvatarArquivoPerfilEditor: Setter<File | null>;
  setAvatarErro: Setter<string>;
  setSalvandoEditorPerfil: Setter<boolean>;
  setTopFiveCurtidaSalvando: Setter<boolean>;
  setAvaliacaoDiario: Setter<AvaliacaoDiarioPublica>;
  setMensagemAcao: Setter<string>;
  setCarregando: Setter<boolean>;
  setUsuarioIdLogado: Setter<string>;
  setAutenticacaoCarregada: Setter<boolean>;
}) {
  useEffect(() => {
    let componenteAtivo = true;

    function limparEstadoContaAnterior() {
      setPerfilUsuarioRemoto(null);
      setObras([]);
      setTotaisInteracoesObras(totaisInteracoesObrasPerfilVazio);
      setAutoresSeguidos([]);
      setObrasFavoritas([]);
      setObrasConcluidas([]);
      setObrasSeguidasBiblioteca([]);
      setPerfisAutoresSalvos({});
      setEditorPerfilAberto(false);
      setNomePerfilEditor("");
      setUsernamePerfilEditor("");
      setBioPerfilEditor("");
      setAvatarPerfilEditor("");
      setAvatarNomePerfilEditor("");
      setAvatarArquivoPerfilEditor(null);
      setAvatarErro("");
      setSalvandoEditorPerfil(false);
      setTopFiveCurtidaSalvando(false);
      setAvaliacaoDiario((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      setMensagemAcao("");

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }

    function aplicarIdentidadeAutenticada(usuarioId: string) {
      const resultado = atualizarIdentidadeAutenticadaPerfilAutor(
        identidadeAutenticadaPerfilRef.current,
        usuarioId,
      );

      if (resultado.mudou) {
        identidadeAutenticadaPerfilRef.current = resultado.identidade;
        setCarregando(true);
        limparEstadoContaAnterior();
        setUsuarioIdLogado(resultado.identidade.usuarioId);
      }

      setAutenticacaoCarregada(true);
    }

    async function carregarUsuarioAutenticadoPerfil() {
      const versaoConsulta = versaoConsultaAutenticacaoPerfilRef.current + 1;
      versaoConsultaAutenticacaoPerfilRef.current = versaoConsulta;

      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";

        if (
          execucaoAutenticacaoPerfilAutorEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoPerfilRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada(userId);
        }
      } catch {
        if (
          execucaoAutenticacaoPerfilAutorEstaAtual({
            cancelada: !componenteAtivo,
            versaoEsperada: versaoConsulta,
            versaoAtual: versaoConsultaAutenticacaoPerfilRef.current,
          })
        ) {
          aplicarIdentidadeAutenticada("");
        }
      }
    }

    void carregarUsuarioAutenticadoPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (componenteAtivo) {
        versaoConsultaAutenticacaoPerfilRef.current += 1;
        aplicarIdentidadeAutenticada(session?.user?.id || "");
      }
    });

    return () => {
      componenteAtivo = false;
      versaoConsultaAutenticacaoPerfilRef.current += 1;
      subscription.unsubscribe();
    };
  }, [
    avatarInputRef,
    identidadeAutenticadaPerfilRef,
    versaoConsultaAutenticacaoPerfilRef,
    setPerfilUsuarioRemoto,
    setObras,
    setTotaisInteracoesObras,
    setAutoresSeguidos,
    setObrasFavoritas,
    setObrasConcluidas,
    setObrasSeguidasBiblioteca,
    setPerfisAutoresSalvos,
    setEditorPerfilAberto,
    setNomePerfilEditor,
    setUsernamePerfilEditor,
    setBioPerfilEditor,
    setAvatarPerfilEditor,
    setAvatarNomePerfilEditor,
    setAvatarArquivoPerfilEditor,
    setAvatarErro,
    setSalvandoEditorPerfil,
    setTopFiveCurtidaSalvando,
    setAvaliacaoDiario,
    setMensagemAcao,
    setCarregando,
    setUsuarioIdLogado,
    setAutenticacaoCarregada,
  ]);
}
