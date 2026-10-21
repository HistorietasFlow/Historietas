"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PreferenciasConta } from "../lib/configuracoes-account-models";
import {
  alternarReceberAvisosConfiguracoes,
  aplicarPrivacidadeAtualizadaConfiguracoes,
  atualizarPreferenciaConfiguracoes,
} from "../lib/configuracoes-preference-actions";
import {
  alternarAprovacaoNovosSeguidoresConfiguracoes,
  alternarPerfilPrivadoConfiguracoes,
  atualizarPrivacidadeConfiguracoes,
} from "../lib/configuracoes-privacy-actions";
import type { PreferenciasPrivacidadeHistorietas } from "../lib/configuracoes-privacy-preferences";

type TraduzirTextoConfiguracoes = (
  portugues: string,
  ingles: string,
  espanhol: string,
) => string;

type MostrarMensagemAcaoConfiguracoes = (
  tipo: "sucesso" | "erro" | "aviso",
  texto: string,
) => void;

export function useConfiguracoesPreferenceActions({
  preferencias,
  privacidade,
  usuarioIdLogado,
  setPreferencias,
  setPrivacidade,
  setMensagemAcao,
  mostrarMensagemAcao,
  traduzirTexto,
}: {
  preferencias: PreferenciasConta;
  privacidade: PreferenciasPrivacidadeHistorietas;
  usuarioIdLogado: string;
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
  setPrivacidade: Dispatch<SetStateAction<PreferenciasPrivacidadeHistorietas>>;
  setMensagemAcao: (mensagem: null) => void;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
}) {
  function atualizarPreferencia<K extends keyof PreferenciasConta>(
    campo: K,
    valor: PreferenciasConta[K],
  ) {
    atualizarPreferenciaConfiguracoes({
      campo,
      valor,
      setPreferencias,
    });
  }

  function alternarReceberAvisos() {
    alternarReceberAvisosConfiguracoes({
      preferencias,
      setPreferencias,
      usuarioIdLogado,
    });
  }

  function aplicarPrivacidadeAtualizada(
    privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
  ) {
    aplicarPrivacidadeAtualizadaConfiguracoes({
      privacidadeAtualizada,
      setPrivacidade,
      setMensagemAcao,
      usuarioIdLogado,
      mostrarMensagemAcao,
      traduzirTexto,
    });
  }

  function atualizarPrivacidade<
    K extends keyof PreferenciasPrivacidadeHistorietas,
  >(campo: K, valor: PreferenciasPrivacidadeHistorietas[K]) {
    atualizarPrivacidadeConfiguracoes({
      privacidade,
      campo,
      valor,
      aplicarPrivacidadeAtualizada,
    });
  }

  function alternarPerfilPrivado() {
    alternarPerfilPrivadoConfiguracoes({
      privacidade,
      aplicarPrivacidadeAtualizada,
    });
  }

  function alternarAprovacaoNovosSeguidores() {
    alternarAprovacaoNovosSeguidoresConfiguracoes({
      privacidade,
      aplicarPrivacidadeAtualizada,
    });
  }

  return {
    atualizarPreferencia,
    alternarReceberAvisos,
    aplicarPrivacidadeAtualizada,
    atualizarPrivacidade,
    alternarPerfilPrivado,
    alternarAprovacaoNovosSeguidores,
  };
}
