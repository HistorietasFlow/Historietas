import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  cancelarSolicitacaoSeguidor,
  deixarDeSeguirUsuario,
  solicitarOuSeguirUsuario,
  type EstadoRelacionamentoPerfil,
} from "../../../lib/historietasPrivacy";
import type { AutorPerfil } from "../types";
import { AUTHOR_FOLLOW_STORAGE_KEY } from "../constants";
import {
  criarChaveAutorPerfil,
  criarPerfilAutorHref,
  idAutorSupabaseValido,
  normalizarNomeAutor,
} from "../lib/profile-formatters";
import { salvarJsonUsuarioPerfilAutor } from "../lib/profile-local-storage-utils";
import { sincronizarAutorSeguidoSupabase } from "../lib/profile-user-collections-sync";
import {
  criarNotificacaoSocialPerfilAutor,
  removerNotificacoesSociaisPerfilAutor,
} from "../lib/profile-social-notifications-utils";

export function usePerfilAutorFollowActions({
  perfilParaMostrar,
  seguirUsuarioSalvando,
  usuarioIdLogado,
  estadoRelacionamentoPerfil,
  seguindoUsuarioPerfil,
  perfilDoUsuarioLogado,
  seguindoAutor,
  autoresSeguidos,
  avisarLoginNecessario,
  setMensagemAcao,
  setSeguirUsuarioSalvando,
  setEstadoRelacionamentoPerfil,
  setSeguindoUsuarioPerfil,
  setSeguidoresUsuarioPerfilTotal,
  setAutoresSeguidos,
}: {
  perfilParaMostrar: AutorPerfil | null;
  seguirUsuarioSalvando: boolean;
  usuarioIdLogado: string;
  estadoRelacionamentoPerfil: EstadoRelacionamentoPerfil;
  seguindoUsuarioPerfil: boolean;
  perfilDoUsuarioLogado: AutorPerfil | null;
  seguindoAutor: boolean;
  autoresSeguidos: string[];
  avisarLoginNecessario: (mensagem: string) => void;
  setMensagemAcao: (mensagem: string) => void;
  setSeguirUsuarioSalvando: Dispatch<SetStateAction<boolean>>;
  setEstadoRelacionamentoPerfil: Dispatch<SetStateAction<EstadoRelacionamentoPerfil>>;
  setSeguindoUsuarioPerfil: Dispatch<SetStateAction<boolean>>;
  setSeguidoresUsuarioPerfilTotal: Dispatch<SetStateAction<number>>;
  setAutoresSeguidos: Dispatch<SetStateAction<string[]>>;
}) {
  async function alternarSeguirAutor() {
    if (!perfilParaMostrar || seguirUsuarioSalvando) {
      return;
    }

    setMensagemAcao("");

    let userIdAtual = usuarioIdLogado;

    try {
      const { data } = await supabase.auth.getUser();
      userIdAtual = data.user?.id || "";
    } catch {
      userIdAtual = usuarioIdLogado;
    }

    if (!userIdAtual) {
      avisarLoginNecessario("Entre na sua conta para seguir perfis.");
      return;
    }

    const userIdPerfil = perfilParaMostrar.autorId.trim();

    if (
      userIdPerfil &&
      idAutorSupabaseValido(userIdPerfil) &&
      idAutorSupabaseValido(userIdAtual)
    ) {
      if (userIdPerfil === userIdAtual) {
        setMensagemAcao("Este é o seu perfil.");
        return;
      }

      const estadoAnterior = estadoRelacionamentoPerfil;
      const seguindoAntes =
        estadoAnterior === "seguindo" || seguindoUsuarioPerfil;
      const notificacaoSolicitacaoId =
        `solicitacao-seguidor:${userIdAtual}:${userIdPerfil}`;
      const notificacaoSeguidorId =
        `seguir-usuario:${userIdAtual}:${userIdPerfil}`;

      setSeguirUsuarioSalvando(true);

      try {
        const resultado =
          estadoAnterior === "solicitado"
            ? await cancelarSolicitacaoSeguidor(userIdPerfil)
            : seguindoAntes
              ? await deixarDeSeguirUsuario(userIdPerfil)
              : await solicitarOuSeguirUsuario(userIdPerfil);

        if (!resultado.ok) {
          setMensagemAcao(
            resultado.erro || "Não consegui atualizar este seguimento agora.",
          );
          return;
        }

        const novoEstado = resultado.estado;
        const seguindoDepois = novoEstado === "seguindo";

        setEstadoRelacionamentoPerfil(novoEstado);
        setSeguindoUsuarioPerfil(seguindoDepois);

        if (seguindoAntes !== seguindoDepois) {
          setSeguidoresUsuarioPerfilTotal((totalAtual) => {
            const proximoTotal = seguindoDepois
              ? totalAtual + 1
              : Math.max(0, totalAtual - 1);

            return proximoTotal;
          });
        }

        if (novoEstado === "seguindo" && !seguindoAntes) {
          const nomeSeguidor =
            perfilDoUsuarioLogado?.nome.trim() || "Um leitor";
          const linkSeguidor = criarPerfilAutorHref(nomeSeguidor, userIdAtual);

          await removerNotificacoesSociaisPerfilAutor(
            userIdPerfil,
            [notificacaoSolicitacaoId],
          );
          await criarNotificacaoSocialPerfilAutor({
            receptorId: userIdPerfil,
            tipo: "novo-seguidor",
            titulo: "Novo seguidor",
            mensagem: `${nomeSeguidor} começou a seguir você.`,
            link: linkSeguidor,
            notificacaoId: notificacaoSeguidorId,
          });
        } else if (novoEstado === "solicitado") {
          const nomeSolicitante =
            perfilDoUsuarioLogado?.nome.trim() || "Um leitor";
          const linkSolicitante = criarPerfilAutorHref(
            nomeSolicitante,
            userIdAtual,
          );

          await removerNotificacoesSociaisPerfilAutor(
            userIdPerfil,
            [notificacaoSeguidorId],
          );
          await criarNotificacaoSocialPerfilAutor({
            receptorId: userIdPerfil,
            tipo: "solicitacao-seguidor",
            titulo: "Nova solicitação de seguidor",
            mensagem: `${nomeSolicitante} pediu para seguir você.`,
            link: linkSolicitante,
            notificacaoId: notificacaoSolicitacaoId,
          });
        } else if (estadoAnterior === "solicitado") {
          await removerNotificacoesSociaisPerfilAutor(
            userIdPerfil,
            [notificacaoSolicitacaoId],
          );
        } else if (seguindoAntes && !seguindoDepois) {
          await removerNotificacoesSociaisPerfilAutor(
            userIdPerfil,
            [notificacaoSeguidorId, notificacaoSolicitacaoId],
          );
        }

        setMensagemAcao(
          novoEstado === "seguindo"
            ? "Perfil adicionado aos seus seguindo."
            : novoEstado === "solicitado"
              ? "Sua solicitação foi enviada."
              : estadoAnterior === "solicitado"
                ? "Solicitação cancelada."
                : "Perfil removido dos seus seguindo.",
        );
        return;
      } catch (error) {
        setMensagemAcao(
          error instanceof Error
            ? error.message
            : "Não consegui atualizar este seguimento agora.",
        );
        return;
      } finally {
        setSeguirUsuarioSalvando(false);
      }
    }

    const autorNormalizado = normalizarNomeAutor(perfilParaMostrar.nome);
    const autorChaveSeguir = criarChaveAutorPerfil(
      perfilParaMostrar.autorId,
      perfilParaMostrar.nome,
    );
    const proximoEstadoSeguindo = !seguindoAutor;
    const autoresSeguidosSemAutorAtual = autoresSeguidos.filter((autor) => {
      return autor !== autorChaveSeguir && autor !== autorNormalizado;
    });

    const novosAutoresSeguidos = proximoEstadoSeguindo
      ? Array.from(new Set([...autoresSeguidosSemAutorAtual, autorChaveSeguir]))
      : autoresSeguidosSemAutorAtual;

    salvarJsonUsuarioPerfilAutor(
      AUTHOR_FOLLOW_STORAGE_KEY,
      usuarioIdLogado,
      novosAutoresSeguidos,
    );

    setAutoresSeguidos(novosAutoresSeguidos);
    void sincronizarAutorSeguidoSupabase(
      autorNormalizado,
      proximoEstadoSeguindo,
    );
  }

  return { alternarSeguirAutor };
}
