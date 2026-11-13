"use client";

import { useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { LimparMensagemAcaoConfiguracoes, MostrarMensagemAcaoConfiguracoes, TraduzirTextoConfiguracoes } from "../lib/configuracoes-callback-types";
import type { PreferenciasConta } from "../lib/configuracoes-account-models";
import { atualizarPreferenciaConfiguracoes, alternarReceberAvisosConfiguracoes } from "../lib/configuracoes-preference-actions";
import { alternarAprovacaoNovosSeguidoresConfiguracoes, alternarPerfilPrivadoConfiguracoes, atualizarPrivacidadeConfiguracoes } from "../lib/configuracoes-privacy-actions";
import { salvarPreferenciasPrivacidade, type PreferenciasPrivacidadeHistorietas } from "../lib/configuracoes-privacy-preferences";
import { preferenciasDaContaEstaoAtuais, type ReferenciaIdentidadePreferenciasConfiguracoes } from "../lib/configuracoes-preference-identity";

type Estado = {
  usuarioId: string;
  versao: number;
  ativo: boolean;
  preferencias: PreferenciasConta;
  desejada: PreferenciasPrivacidadeHistorietas;
  confirmada: PreferenciasPrivacidadeHistorietas;
  revisao: number;
  revisaoConfirmada: number;
  pendente: boolean;
  erro: boolean;
};

export function useConfiguracoesPreferenceActions({
  preferencias, privacidade, usuarioIdLogado, identidadeContaRef,
  setPreferencias, setPrivacidade, setMensagemAcao, mostrarMensagemAcao, traduzirTexto,
}: {
  preferencias: PreferenciasConta;
  privacidade: PreferenciasPrivacidadeHistorietas;
  usuarioIdLogado: string;
  identidadeContaRef: ReferenciaIdentidadePreferenciasConfiguracoes;
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
  setPrivacidade: Dispatch<SetStateAction<PreferenciasPrivacidadeHistorietas>>;
  setMensagemAcao: LimparMensagemAcaoConfiguracoes;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
}) {
  const estadoRef = useRef<Estado | null>(null);
  const [statusPrivacidade, setStatusPrivacidade] = useState<"" | "salvando" | "erro">("");

  function limparFeedback() {
    setStatusPrivacidade("");
    setMensagemAcao(null);
  }

  useLayoutEffect(() => {
    const anterior = estadoRef.current;
    if (!anterior?.ativo || anterior.usuarioId !== usuarioIdLogado ||
        anterior.versao !== identidadeContaRef.current.versao) {
      estadoRef.current = {
        usuarioId: usuarioIdLogado, versao: identidadeContaRef.current.versao, ativo: true,
        preferencias, desejada: privacidade, confirmada: privacidade,
        revisao: 0, revisaoConfirmada: 0, pendente: false, erro: false,
      };
      // A troca da conta também invalida feedback da conta anterior.
      limparFeedback();
    } else {
      anterior.preferencias = preferencias;
      if (!anterior.pendente && !anterior.erro) {
        anterior.desejada = privacidade;
        anterior.confirmada = privacidade;
      }
    }
  });
  useLayoutEffect(() => () => {
    if (estadoRef.current) estadoRef.current.ativo = false;
  }, []);

  function estaAtual(estado: Estado | null): estado is Estado {
    return Boolean(estado?.ativo && estado === estadoRef.current && estado.usuarioId &&
      estado.usuarioId === usuarioIdLogado && preferenciasDaContaEstaoAtuais(identidadeContaRef, estado));
  }
  function atualizarPreferencia<K extends keyof PreferenciasConta>(campo: K, valor: PreferenciasConta[K]) {
    const estado = estadoRef.current;
    if (!estaAtual(estado)) return;
    estado.preferencias = { ...estado.preferencias, [campo]: valor };
    atualizarPreferenciaConfiguracoes({ campo, valor, setPreferencias });
  }
  function alternarReceberAvisos() {
    const estado = estadoRef.current;
    if (!estaAtual(estado)) return;
    const atualizadas = alternarReceberAvisosConfiguracoes({
      preferencias: estado.preferencias, setPreferencias, usuarioIdLogado,
    });
    if (atualizadas) estado.preferencias = atualizadas;
    else mostrarMensagemAcao("erro", traduzirTexto(
      "Não foi possível salvar a preferência neste aparelho. Tente novamente.",
      "Could not save the preference on this device. Try again.",
      "No se pudo guardar la preferencia en este dispositivo. Inténtalo de nuevo.",
    ));
  }
  function persistirPrivacidade(desejada: PreferenciasPrivacidadeHistorietas) {
    const estado = estadoRef.current;
    if (!estaAtual(estado)) return;
    const revisao = ++estado.revisao;
    estado.desejada = desejada;
    estado.pendente = true;
    estado.erro = false;
    setPrivacidade(desejada);
    setMensagemAcao(null);
    setStatusPrivacidade("salvando");
    void salvarPreferenciasPrivacidade(desejada, estado.usuarioId, {
      execucaoEstaAtual: () => estaAtual(estado),
    }).then(resultado => {
      if (!estaAtual(estado)) return;
      if ("preferencias" in resultado && revisao > estado.revisaoConfirmada) {
        estado.confirmada = resultado.preferencias;
        estado.revisaoConfirmada = revisao;
      }
      if (revisao !== estado.revisao) return;
      estado.pendente = false;
      estado.erro = !resultado.ok;
      setPrivacidade(estado.confirmada);
      setStatusPrivacidade(resultado.ok ? "" : "erro");
    }).catch(() => {
      if (!estaAtual(estado) || revisao !== estado.revisao) return;
      estado.pendente = false;
      estado.erro = true;
      setPrivacidade(estado.confirmada);
      setStatusPrivacidade("erro");
    });
  }
  function aplicarPrivacidadeAtualizada(atualizada: PreferenciasPrivacidadeHistorietas) {
    const estado = estadoRef.current;
    if (!estaAtual(estado)) return;
    // Composições de selects partem do render do componente: aplique somente
    // os campos alterados para preservar outra escolha feita antes do render.
    const alteracoes = Object.fromEntries(Object.entries(atualizada).filter(
      ([campo, valor]) => valor !== privacidade[campo as keyof PreferenciasPrivacidadeHistorietas],
    ));
    persistirPrivacidade({ ...estado.desejada, ...alteracoes });
  }
  function atualizarPrivacidade<K extends keyof PreferenciasPrivacidadeHistorietas>(campo: K, valor: PreferenciasPrivacidadeHistorietas[K]) {
    const estado = estadoRef.current;
    if (!estaAtual(estado)) return;
    atualizarPrivacidadeConfiguracoes({ privacidade: estado.desejada, campo, valor, aplicarPrivacidadeAtualizada: persistirPrivacidade });
  }
  function alternarPerfilPrivado() {
    const estado = estadoRef.current;
    if (!estaAtual(estado)) return;
    alternarPerfilPrivadoConfiguracoes({ privacidade: estado.desejada, aplicarPrivacidadeAtualizada: persistirPrivacidade });
  }
  function alternarAprovacaoNovosSeguidores() {
    const estado = estadoRef.current;
    if (!estaAtual(estado)) return;
    alternarAprovacaoNovosSeguidoresConfiguracoes({ privacidade: estado.desejada, aplicarPrivacidadeAtualizada: persistirPrivacidade });
  }
  function tentarSalvarPrivacidadeNovamente() {
    const estado = estadoRef.current;
    if (estaAtual(estado)) persistirPrivacidade(estado.desejada);
  }
  return {
    atualizarPreferencia, alternarReceberAvisos, aplicarPrivacidadeAtualizada,
    atualizarPrivacidade, alternarPerfilPrivado, alternarAprovacaoNovosSeguidores,
    statusPrivacidade, tentarSalvarPrivacidadeNovamente,
  };
}
