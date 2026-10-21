"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { UsuarioBloqueadoConfiguracoes } from "../lib/configuracoes-account-models";
import { idUsuarioSupabaseValido } from "../lib/configuracoes-account-utils";
import { listarUsuariosBloqueadosConfiguracoes } from "../lib/configuracoes-blocked-users-loader";
import type {
  MostrarMensagemAcaoConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type UseConfiguracoesBlockedUsersArgs = {
  traduzirTexto: TraduzirTextoConfiguracoes;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
};

export function useConfiguracoesBlockedUsers({
  traduzirTexto,
  mostrarMensagemAcao,
}: UseConfiguracoesBlockedUsersArgs) {
  const [mostrarUsuariosBloqueados, setMostrarUsuariosBloqueados] =
    useState(false);
  const [usuariosBloqueados, setUsuariosBloqueados] = useState<
    UsuarioBloqueadoConfiguracoes[]
  >([]);
  const [carregandoUsuariosBloqueados, setCarregandoUsuariosBloqueados] =
    useState(false);
  const [desbloqueandoUsuarioId, setDesbloqueandoUsuarioId] = useState("");
  const [erroUsuariosBloqueados, setErroUsuariosBloqueados] = useState("");

  async function carregarUsuariosBloqueados() {
    if (carregandoUsuariosBloqueados) {
      return;
    }

    setCarregandoUsuariosBloqueados(true);
    setErroUsuariosBloqueados("");

    try {
      const lista = await listarUsuariosBloqueadosConfiguracoes();
      setUsuariosBloqueados(lista);
    } catch (error) {
      setErroUsuariosBloqueados(
        error instanceof Error && error.message.trim()
          ? error.message
          : traduzirTexto(
              "Não foi possível carregar os usuários bloqueados.",
              "Blocked users could not be loaded.",
              "No se pudieron cargar los usuarios bloqueados.",
            ),
      );
    } finally {
      setCarregandoUsuariosBloqueados(false);
    }
  }

  function alternarUsuariosBloqueados() {
    setMostrarUsuariosBloqueados((mostrarAtual) => {
      const proximo = !mostrarAtual;

      if (proximo) {
        void carregarUsuariosBloqueados();
      }

      return proximo;
    });
  }

  async function desbloquearUsuarioConfiguracoes(
    usuarioBloqueado: UsuarioBloqueadoConfiguracoes,
  ) {
    if (
      desbloqueandoUsuarioId ||
      !idUsuarioSupabaseValido(usuarioBloqueado.userId)
    ) {
      return;
    }

    const confirmou = window.confirm(
      traduzirTexto(
        `Desbloquear ${usuarioBloqueado.nome}?`,
        `Unblock ${usuarioBloqueado.nome}?`,
        `¿Desbloquear a ${usuarioBloqueado.nome}?`,
      ),
    );

    if (!confirmou) {
      return;
    }

    setDesbloqueandoUsuarioId(usuarioBloqueado.userId);
    setErroUsuariosBloqueados("");

    try {
      const { data, error } = await supabase.rpc(
        "desbloquear_usuario",
        { p_bloqueado_id: usuarioBloqueado.userId },
      );

      if (error || data !== true) {
        throw error || new Error(
          traduzirTexto(
            "O desbloqueio não foi confirmado.",
            "The unblock action was not confirmed.",
            "No se confirmó el desbloqueo.",
          ),
        );
      }

      setUsuariosBloqueados((usuariosAtuais) =>
        usuariosAtuais.filter(
          (item) => item.userId !== usuarioBloqueado.userId,
        ),
      );

      mostrarMensagemAcao(
        "sucesso",
        traduzirTexto(
          `${usuarioBloqueado.nome} foi desbloqueado.`,
          `${usuarioBloqueado.nome} was unblocked.`,
          `${usuarioBloqueado.nome} fue desbloqueado.`,
        ),
      );
    } catch (error) {
      setErroUsuariosBloqueados(
        error instanceof Error && error.message.trim()
          ? error.message
          : traduzirTexto(
              "Não foi possível desbloquear este usuário.",
              "This user could not be unblocked.",
              "No se pudo desbloquear a este usuario.",
            ),
      );
    } finally {
      setDesbloqueandoUsuarioId("");
    }
  }

  return {
    mostrarUsuariosBloqueados,
    usuariosBloqueados,
    setUsuariosBloqueados,
    carregandoUsuariosBloqueados,
    desbloqueandoUsuarioId,
    erroUsuariosBloqueados,
    carregarUsuariosBloqueados,
    alternarUsuariosBloqueados,
    desbloquearUsuarioConfiguracoes,
  };
}
