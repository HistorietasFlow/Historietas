"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  cancelarSolicitacaoSeguidor,
  deixarDeSeguirUsuario as deixarDeSeguirUsuarioPrivacidade,
  solicitarOuSeguirUsuario,
} from "../../../lib/historietasPrivacy";
import { idUsuarioSupabaseValido } from "../lib/seguindo-route-utils";

type UsuarioSeguindo = {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatar: string;
  criadoEm: string;
};

type AtividadeSeguindo = {
  usuarioId: string;
};

type UseSeguindoUserFollowActionsParams = {
  usuarioLogadoId: string;
  usuarioListaAlterandoId: string | null;
  usuarioSugestaoSeguindoId: string | null;
  solicitacoesEnviadasIds: string[];
  setUsuarioListaAlterandoId: Dispatch<SetStateAction<string | null>>;
  setUsuarioSugestaoSeguindoId: Dispatch<SetStateAction<string | null>>;
  setUsuariosSeguidos: Dispatch<SetStateAction<UsuarioSeguindo[]>>;
  setAtividadesSeguindo: Dispatch<SetStateAction<AtividadeSeguindo[]>>;
  setSolicitacoesEnviadasIds: Dispatch<SetStateAction<string[]>>;
  setUsuariosSugestoesBusca: Dispatch<SetStateAction<UsuarioSeguindo[]>>;
};

export function useSeguindoUserFollowActions({
  usuarioLogadoId,
  usuarioListaAlterandoId,
  usuarioSugestaoSeguindoId,
  solicitacoesEnviadasIds,
  setUsuarioListaAlterandoId,
  setUsuarioSugestaoSeguindoId,
  setUsuariosSeguidos,
  setAtividadesSeguindo,
  setSolicitacoesEnviadasIds,
  setUsuariosSugestoesBusca,
}: UseSeguindoUserFollowActionsParams) {
  async function deixarDeSeguirUsuario(usuarioId: string) {
    const usuarioIdLimpo = usuarioId.trim();

    if (
      !idUsuarioSupabaseValido(usuarioLogadoId) ||
      !idUsuarioSupabaseValido(usuarioIdLimpo) ||
      usuarioListaAlterandoId
    ) {
      return;
    }

    setUsuarioListaAlterandoId(usuarioIdLimpo);

    try {
      const resultado = await deixarDeSeguirUsuarioPrivacidade(usuarioIdLimpo);

      if (!resultado.ok) {
        console.warn("Não consegui deixar de seguir o usuário:", resultado.erro);
        return;
      }

      setUsuariosSeguidos((usuariosAtuais) =>
        usuariosAtuais.filter(
          (usuarioSeguido) => usuarioSeguido.id !== usuarioIdLimpo,
        ),
      );
      setAtividadesSeguindo((atividadesAtuais) =>
        atividadesAtuais.filter(
          (atividade) => atividade.usuarioId !== usuarioIdLimpo,
        ),
      );
    } finally {
      setUsuarioListaAlterandoId((idAtual) =>
        idAtual === usuarioIdLimpo ? null : idAtual,
      );
    }
  }

  async function seguirUsuarioSugestao(usuarioSugestao: UsuarioSeguindo) {
    const usuarioId = usuarioSugestao.id.trim();
    const solicitacaoPendente = solicitacoesEnviadasIds.includes(usuarioId);

    if (
      !idUsuarioSupabaseValido(usuarioLogadoId) ||
      !idUsuarioSupabaseValido(usuarioId) ||
      usuarioId === usuarioLogadoId ||
      usuarioSugestaoSeguindoId
    ) {
      return;
    }

    setUsuarioSugestaoSeguindoId(usuarioId);

    try {
      if (solicitacaoPendente) {
        const resultadoCancelamento =
          await cancelarSolicitacaoSeguidor(usuarioId);

        if (!resultadoCancelamento.ok) {
          console.warn(
            "Não consegui cancelar a solicitação:",
            resultadoCancelamento.erro,
          );
          return;
        }

        setSolicitacoesEnviadasIds((idsAtuais) =>
          idsAtuais.filter((idAtual) => idAtual !== usuarioId),
        );
        return;
      }

      const resultado = await solicitarOuSeguirUsuario(usuarioId);

      if (!resultado.ok) {
        console.warn("Não consegui seguir o usuário:", resultado.erro);
        return;
      }

      if (resultado.estado === "solicitado") {
        setSolicitacoesEnviadasIds((idsAtuais) =>
          idsAtuais.includes(usuarioId)
            ? idsAtuais
            : [usuarioId, ...idsAtuais],
        );
        return;
      }

      if (resultado.estado !== "seguindo") {
        return;
      }

      const usuarioSeguido: UsuarioSeguindo = {
        ...usuarioSugestao,
        criadoEm: new Date().toISOString(),
      };

      setUsuariosSeguidos((usuariosAtuais) => {
        if (
          usuariosAtuais.some(
            (usuarioAtual) => usuarioAtual.id === usuarioId,
          )
        ) {
          return usuariosAtuais;
        }

        return [usuarioSeguido, ...usuariosAtuais];
      });

      setSolicitacoesEnviadasIds((idsAtuais) =>
        idsAtuais.filter((idAtual) => idAtual !== usuarioId),
      );
      setUsuariosSugestoesBusca((usuariosAtuais) =>
        usuariosAtuais.filter((usuarioAtual) => usuarioAtual.id !== usuarioId),
      );
    } catch (error) {
      console.warn("Não consegui seguir o usuário:", error);
    } finally {
      setUsuarioSugestaoSeguindoId((idAtual) =>
        idAtual === usuarioId ? null : idAtual,
      );
    }
  }

  return {
    deixarDeSeguirUsuario,
    seguirUsuarioSugestao,
  };
}
