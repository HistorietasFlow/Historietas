"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  criarInteracaoAnotacaoListasVazia,
  type ComentarioAnotacaoListas,
  type InteracaoAnotacaoListas,
} from "../lib/listas-diary-comment-utils";
import {
  adicionarCurtidaAnotacaoListas,
  adicionarCurtidaComentarioAnotacaoListas,
  inserirComentarioAnotacaoListas,
  removerComentarioAnotacaoListas as removerComentarioAnotacaoListasPersistida,
  removerCurtidaAnotacaoListas,
  removerCurtidaComentarioAnotacaoListas,
} from "../lib/listas-diary-interaction-persistence";
import { obterPermissoesAnotacaoListas } from "../lib/listas-diary-annotation-permissions-utils";
import { criarLoginHrefListas } from "../lib/listas-storage-utils";
import { obterMensagemErroListas, pegarTexto } from "../lib/listas-value-utils";

type ItemAnotacaoListas = {
  anotacaoId?: string;
  anotacaoVisibilidadeComentarios?: string;
  anotacaoQuemPodeComentar?: string;
  anotacaoPermitirCurtidas?: boolean;
};

type PerfilAtualListas = {
  nome: string;
  username: string;
  avatar: string;
};

type UseListasDiaryInteractionActionsProps = {
  comentarioCurtindoId: string;
  diarioComentarioMaxLength: number;
  interacoesAnotacoes: Record<string, InteracaoAnotacaoListas>;
  perfilEhProprio: boolean;
  preferenciasPerfil: { quemPodeComentarDiario: string };
  relacionamentoPerfil: string;
  router: { push: (href: string) => void };
  setComentarioCurtindoId: Dispatch<SetStateAction<string>>;
  setComentarioRemovendoId: Dispatch<SetStateAction<string>>;
  setInteracoesAnotacoes: Dispatch<
    SetStateAction<Record<string, InteracaoAnotacaoListas>>
  >;
  setMensagemAcao: (mensagem: string) => void;
  setRespostasVisiveisComentariosDiario: Dispatch<
    SetStateAction<Record<string, number>>
  >;
  usuarioAtualId: string;
  usuarioAtualPerfil: PerfilAtualListas | null;
};

export function useListasDiaryInteractionActions({
  comentarioCurtindoId,
  diarioComentarioMaxLength,
  interacoesAnotacoes,
  perfilEhProprio,
  preferenciasPerfil,
  relacionamentoPerfil,
  router,
  setComentarioCurtindoId,
  setComentarioRemovendoId,
  setInteracoesAnotacoes,
  setMensagemAcao,
  setRespostasVisiveisComentariosDiario,
  usuarioAtualId,
  usuarioAtualPerfil,
}: UseListasDiaryInteractionActionsProps) {
  function atualizarInteracaoAnotacaoListas(
    anotacaoId: string,
    atualizar: (estado: InteracaoAnotacaoListas) => InteracaoAnotacaoListas,
  ) {
    setInteracoesAnotacoes((estadoAtual) => ({
      ...estadoAtual,
      [anotacaoId]: atualizar(
        estadoAtual[anotacaoId] || criarInteracaoAnotacaoListasVazia(),
      ),
    }));
  }

  async function alternarCurtidaAnotacaoListas(item: ItemAnotacaoListas) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioAtualId.trim();

    if (!anotacaoId) return;

    const permissoes = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });

    if (!permissoes.podeCurtirAnotacao) {
      setMensagemAcao("As curtidas estão desativadas nesta anotação.");
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();

    if (interacao.salvandoCurtida) return;

    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      salvandoCurtida: true,
      erro: "",
    }));

    try {
      if (interacao.curtiu) {
        await removerCurtidaAnotacaoListas(anotacaoId, userId);

        atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
          ...atual,
          curtiu: false,
          totalCurtidas: Math.max(0, atual.totalCurtidas - 1),
          salvandoCurtida: false,
        }));
      } else {
        await adicionarCurtidaAnotacaoListas(anotacaoId, userId);

        atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
          ...atual,
          curtiu: true,
          totalCurtidas: atual.totalCurtidas + 1,
          salvandoCurtida: false,
        }));
      }
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        salvandoCurtida: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a curtida.",
      }));
    }
  }

  function atualizarComentarioAnotacaoListas(anotacaoId: string, texto: string) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      novoComentario: texto.slice(0, diarioComentarioMaxLength),
      erro: "",
    }));
  }

  function iniciarRespostaComentarioAnotacaoListas(
    anotacaoId: string,
    comentario: ComentarioAnotacaoListas,
  ) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      respondendoComentarioId: comentario.parentId || comentario.id,
      respondendoAutorNome: comentario.autorNome,
      erro: "",
    }));
  }

  function cancelarRespostaComentarioAnotacaoListas(anotacaoId: string) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      respondendoComentarioId: "",
      respondendoAutorNome: "",
    }));
  }

  function alterarOrdenacaoComentariosAnotacaoListas(
    anotacaoId: string,
    ordenacao: "relevantes" | "recentes",
  ) {
    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      ordenacaoComentarios: ordenacao,
    }));
  }

  async function alternarCurtidaComentarioAnotacaoListas(
    anotacaoId: string,
    comentario: ComentarioAnotacaoListas,
  ) {
    const userId = usuarioAtualId.trim();

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    if (!comentario.id || comentarioCurtindoId) return;
    const curtiu = comentario.curtidas.includes(userId);
    setComentarioCurtindoId(comentario.id);

    try {
      if (curtiu) {
        await removerCurtidaComentarioAnotacaoListas(comentario.id, userId);
      } else {
        await adicionarCurtidaComentarioAnotacaoListas(comentario.id, userId);
      }

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: atual.comentarios.map((itemComentario) =>
          itemComentario.id === comentario.id
            ? {
                ...itemComentario,
                curtidas: curtiu
                  ? itemComentario.curtidas.filter((id) => id !== userId)
                  : Array.from(new Set([...itemComentario.curtidas, userId])),
              }
            : itemComentario,
        ),
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível atualizar a curtida do comentário.",
        ),
      }));
    } finally {
      setComentarioCurtindoId("");
    }
  }

  async function enviarComentarioAnotacaoListas(item: ItemAnotacaoListas) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioAtualId.trim();

    if (!anotacaoId) return;

    const permissoes = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });

    if (!permissoes.podeComentar) {
      setMensagemAcao("Você não tem permissão para comentar nesta anotação.");
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefListas());
      return;
    }

    const interacao =
      interacoesAnotacoes[anotacaoId] || criarInteracaoAnotacaoListasVazia();
    const textoComentario = interacao.novoComentario.trim();

    if (!textoComentario) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: "Escreva um comentário antes de enviar.",
      }));
      return;
    }

    if (interacao.enviandoComentario) return;

    atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
      ...atual,
      enviandoComentario: true,
      erro: "",
    }));

    try {
      const registro = await inserirComentarioAnotacaoListas({
        anotacaoId,
        userId,
        texto: textoComentario.slice(0, diarioComentarioMaxLength),
        parentId: interacao.respondendoComentarioId,
      });
      const comentario: ComentarioAnotacaoListas = {
        id: pegarTexto(registro?.id),
        anotacaoId,
        userId,
        autorNome: usuarioAtualPerfil?.nome || "Você",
        autorUsername: usuarioAtualPerfil?.username || "",
        autorAvatar: usuarioAtualPerfil?.avatar || "",
        texto: pegarTexto(registro?.texto, textoComentario),
        criadoEm: pegarTexto(registro?.criado_em, new Date().toISOString()),
        atualizadoEm: pegarTexto(
          registro?.atualizado_em ?? registro?.criado_em,
          new Date().toISOString(),
        ),
        parentId: pegarTexto(registro?.parent_id, interacao.respondendoComentarioId),
        curtidas: [],
      };

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: comentario.id
          ? [...atual.comentarios, comentario]
          : atual.comentarios,
        novoComentario: "",
        respondendoComentarioId: "",
        respondendoAutorNome: "",
        enviandoComentario: false,
      }));

      if (comentario.parentId) {
        setRespostasVisiveisComentariosDiario((atuais) => ({
          ...atuais,
          [comentario.parentId]: Math.max(
            5,
            atuais[comentario.parentId] || 0,
          ),
        }));
      }
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        enviandoComentario: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o comentário.",
      }));
    }
  }

  async function removerComentarioAnotacaoListas(
    item: ItemAnotacaoListas,
    comentario: ComentarioAnotacaoListas,
  ) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (
      !anotacaoId ||
      !comentario.id ||
      comentario.userId !== usuarioAtualId ||
      !window.confirm("Remover este comentário?")
    ) {
      return;
    }

    setComentarioRemovendoId(comentario.id);

    try {
      await removerComentarioAnotacaoListasPersistida(
        comentario.id,
        usuarioAtualId,
      );

      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        comentarios: atual.comentarios.filter(
          (itemComentario) =>
            itemComentario.id !== comentario.id &&
            itemComentario.parentId !== comentario.id,
        ),
        respondendoComentarioId:
          atual.respondendoComentarioId === comentario.id
            ? ""
            : atual.respondendoComentarioId,
        respondendoAutorNome:
          atual.respondendoComentarioId === comentario.id
            ? ""
            : atual.respondendoAutorNome,
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoListas(anotacaoId, (atual) => ({
        ...atual,
        erro: obterMensagemErroListas(
          error,
          "Não foi possível remover o comentário.",
        ),
      }));
    } finally {
      setComentarioRemovendoId("");
    }
  }

  return {
    atualizarInteracaoAnotacaoListas,
    alternarCurtidaAnotacaoListas,
    atualizarComentarioAnotacaoListas,
    iniciarRespostaComentarioAnotacaoListas,
    cancelarRespostaComentarioAnotacaoListas,
    alterarOrdenacaoComentariosAnotacaoListas,
    alternarCurtidaComentarioAnotacaoListas,
    enviarComentarioAnotacaoListas,
    removerComentarioAnotacaoListas,
  };
}
