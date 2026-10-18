"use client";

import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { idUsuarioSupabaseValido } from "../lib/seguindo-route-utils";

type UsuarioSeguindo = {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatar: string;
  criadoEm: string;
};

type SolicitacaoSeguindo = {
  id: string;
  usuario: UsuarioSeguindo;
  criadoEm: string;
};

type UseSeguindoFollowerActionsParams = {
  usuarioLogadoId: string;
  usuarioListaAlterandoId: string | null;
  solicitacaoRespondendoId: string | null;
  setUsuarioListaAlterandoId: Dispatch<SetStateAction<string | null>>;
  setSolicitacaoRespondendoId: Dispatch<SetStateAction<string | null>>;
  setUsuariosSeguidores: Dispatch<SetStateAction<UsuarioSeguindo[]>>;
  setSolicitacoesSeguidores: Dispatch<SetStateAction<SolicitacaoSeguindo[]>>;
};

export function useSeguindoFollowerActions({
  usuarioLogadoId,
  usuarioListaAlterandoId,
  solicitacaoRespondendoId,
  setUsuarioListaAlterandoId,
  setSolicitacaoRespondendoId,
  setUsuariosSeguidores,
  setSolicitacoesSeguidores,
}: UseSeguindoFollowerActionsParams) {
  async function removerSeguidorUsuario(usuarioId: string) {
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
      const { data, error } = await supabase.rpc("remover_seguidor", {
        p_seguidor_id: usuarioIdLimpo,
      });

      if (error || data !== true) {
        console.warn(
          "Não consegui remover o seguidor:",
          error?.message || "A remoção não foi confirmada.",
        );
        return;
      }

      setUsuariosSeguidores((usuariosAtuais) =>
        usuariosAtuais.filter(
          (usuarioSeguidor) => usuarioSeguidor.id !== usuarioIdLimpo,
        ),
      );
    } finally {
      setUsuarioListaAlterandoId((idAtual) =>
        idAtual === usuarioIdLimpo ? null : idAtual,
      );
    }
  }

  async function responderSolicitacaoSeguidor(
    solicitacao: SolicitacaoSeguindo,
    aceitar: boolean,
  ) {
    if (
      !idUsuarioSupabaseValido(solicitacao.id) ||
      solicitacaoRespondendoId
    ) {
      return;
    }

    setSolicitacaoRespondendoId(solicitacao.id);

    try {
      const { data, error } = await supabase.rpc(
        "responder_solicitacao_seguidor",
        {
          p_solicitacao_id: solicitacao.id,
          p_aceitar: aceitar,
        },
      );

      if (error || (data !== "aceita" && data !== "recusada")) {
        console.warn(
          "Não consegui responder a solicitação:",
          error?.message || "A resposta não foi confirmada.",
        );
        return;
      }

      setSolicitacoesSeguidores((solicitacoesAtuais) =>
        solicitacoesAtuais.filter(
          (solicitacaoAtual) => solicitacaoAtual.id !== solicitacao.id,
        ),
      );

      if (data === "aceita") {
        setUsuariosSeguidores((usuariosAtuais) => {
          if (
            usuariosAtuais.some(
              (usuarioAtual) => usuarioAtual.id === solicitacao.usuario.id,
            )
          ) {
            return usuariosAtuais;
          }

          return [
            {
              ...solicitacao.usuario,
              criadoEm: new Date().toISOString(),
            },
            ...usuariosAtuais,
          ];
        });
      }
    } finally {
      setSolicitacaoRespondendoId((idAtual) =>
        idAtual === solicitacao.id ? null : idAtual,
      );
    }
  }

  return {
    removerSeguidorUsuario,
    responderSolicitacaoSeguidor,
  };
}
