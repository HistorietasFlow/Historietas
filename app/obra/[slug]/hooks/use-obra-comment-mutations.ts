import type { Dispatch, FormEvent, SetStateAction } from "react";
import { idObraSupabaseValido } from "../../../../lib/utils";
import type { IdentidadeAutenticadaObra } from "../lib/obra-auth-identity";
import {
  criarComentarioObraId,
  obterIdsComentarioComRespostas,
  type ComentarioObraPublico,
  type RespostaComentarioObra,
} from "../lib/obra-comment-utils";
import { salvarComentariosObraLocais } from "../lib/obra-local-comment-storage-utils";
import { carregarPerfilPublicoObra } from "../lib/obra-public-profile-resolver";
import { normalizarComentariosObraSupabase } from "../lib/obra-supabase-comment-normalizer";
import {
  inserirComentarioObraSupabase,
  removerComentarioObraSupabase,
} from "../lib/obra-supabase-comment-persistence";
import {
  inserirCurtidaComentarioObraSupabase,
  removerCurtidaComentarioObraSupabase,
} from "../lib/obra-supabase-comment-like-persistence";
import type { ObraDinamica } from "../lib/obra-data-utils";

type UseObraCommentMutationsParams = {
  obra: ObraDinamica | null;
  comentarioTexto: string;
  comentarioEnviando: boolean;
  comentarioRemovendoId: string;
  comentarioCurtindoId: string;
  comentariosObra: ComentarioObraPublico[];
  respostaComentario: RespostaComentarioObra | null;
  obterIdentidadeLogadaParaAcao: (
    mensagem: string,
  ) => Promise<IdentidadeAutenticadaObra | null>;
  criarGuardIdentidadeAcao: (
    identidadeEsperada: IdentidadeAutenticadaObra,
  ) => () => boolean;
  garantirRespostaVisivel: (comentarioRaizId: string) => void;
  setComentarioTexto: Dispatch<SetStateAction<string>>;
  setComentarioStatus: Dispatch<SetStateAction<string>>;
  setComentarioEnviando: Dispatch<SetStateAction<boolean>>;
  setComentarioRemovendoId: Dispatch<SetStateAction<string>>;
  setComentarioCurtindoId: Dispatch<SetStateAction<string>>;
  setComentariosObra: Dispatch<SetStateAction<ComentarioObraPublico[]>>;
  setTotalComentariosObra: Dispatch<SetStateAction<number>>;
  setComentariosProximoOffset: Dispatch<SetStateAction<number>>;
  setRespostaComentario: Dispatch<SetStateAction<RespostaComentarioObra | null>>;
};

export function useObraCommentMutations({
  obra,
  comentarioTexto,
  comentarioEnviando,
  comentarioRemovendoId,
  comentarioCurtindoId,
  comentariosObra,
  respostaComentario,
  obterIdentidadeLogadaParaAcao,
  criarGuardIdentidadeAcao,
  garantirRespostaVisivel,
  setComentarioTexto,
  setComentarioStatus,
  setComentarioEnviando,
  setComentarioRemovendoId,
  setComentarioCurtindoId,
  setComentariosObra,
  setTotalComentariosObra,
  setComentariosProximoOffset,
  setRespostaComentario,
}: UseObraCommentMutationsParams) {
  async function enviarComentarioObra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!obra || comentarioEnviando) {
      return;
    }

    const textoDigitado = comentarioTexto.replace(/\s+/g, " ").trim();

    if (textoDigitado.length < 2) {
      setComentarioStatus("Escreva um comentário antes de enviar.");
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      respostaComentario
        ? "Entre na sua conta para responder este comentário."
        : "Entre na sua conta para comentar esta obra.",
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);
    const respostaAnterior = respostaComentario;
    const textoFinal = textoDigitado.slice(0, 600);
    const perfil = await carregarPerfilPublicoObra(userId, "Você");

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const comentarioTemporario: ComentarioObraPublico = {
      id: criarComentarioObraId(),
      obraId: obra.id,
      userId,
      nome: perfil?.nome || "Você",
      avatar: perfil?.avatar || "",
      texto: textoFinal,
      criadoEm: new Date().toISOString(),
      comentarioPaiId: respostaAnterior?.comentarioPaiId || "",
      local: true,
      curtidas: [],
    };

    setComentarioEnviando(true);
    setComentarioStatus("");
    setComentarioTexto("");
    setRespostaComentario(null);

    if (comentarioTemporario.comentarioPaiId) {
      garantirRespostaVisivel(comentarioTemporario.comentarioPaiId);
    }

    setComentariosObra((comentariosAtuais) => [
      comentarioTemporario,
      ...comentariosAtuais,
    ]);
    setTotalComentariosObra((totalAtual) => totalAtual + 1);

    if (!idObraSupabaseValido(obra.id)) {
      const comentariosLocais = [
        comentarioTemporario,
        ...comentariosObra,
      ].slice(0, 120);

      salvarComentariosObraLocais(userId, obra.id, comentariosLocais);
      setComentarioStatus(
        respostaAnterior
          ? "Resposta salva neste aparelho."
          : "Comentário salvo neste aparelho.",
      );
      setComentarioEnviando(false);
      return;
    }

    try {
      const { data, error } = await inserirComentarioObraSupabase({
        obra_id: obra.id,
        user_id: userId,
        comentario: comentarioTemporario.texto,
        comentario_pai_id: comentarioTemporario.comentarioPaiId || null,
      });

      if (error || !data) {
        throw error || new Error("Comentário não retornado pelo Supabase.");
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      const [comentarioSincronizado] = await normalizarComentariosObraSupabase([
        data,
      ]);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (!comentarioSincronizado) {
        throw new Error("Comentário inválido retornado pelo Supabase.");
      }

      setComentariosObra((comentariosAtuais) => {
        const proximosComentarios = comentariosAtuais.map((comentario) =>
          comentario.id === comentarioTemporario.id
            ? comentarioSincronizado
            : comentario,
        );

        salvarComentariosObraLocais(userId, obra.id, proximosComentarios);
        return proximosComentarios;
      });

      if (!comentarioSincronizado.comentarioPaiId) {
        setComentariosProximoOffset((offsetAtual) => offsetAtual + 1);
      }

      setComentarioStatus("");
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) =>
        comentariosAtuais.filter(
          (comentario) => comentario.id !== comentarioTemporario.id,
        ),
      );
      setTotalComentariosObra((totalAtual) => Math.max(0, totalAtual - 1));
      setComentarioTexto(textoDigitado);
      setRespostaComentario(respostaAnterior);
      setComentarioStatus(
        respostaAnterior
          ? "Não foi possível enviar a resposta agora."
          : "Não foi possível enviar o comentário agora.",
      );
    } finally {
      if (execucaoAcaoEstaAtual()) {
        setComentarioEnviando(false);
      }
    }
  }

  async function removerComentarioObra(comentario: ComentarioObraPublico) {
    if (!obra || comentarioRemovendoId) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para remover este comentário.",
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual() || comentario.userId !== userId) {
      return;
    }

    const idsParaRemover = obterIdsComentarioComRespostas(
      comentariosObra,
      comentario.id,
    );

    setComentarioRemovendoId(comentario.id);
    setComentarioStatus("");

    try {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (!comentario.local && idObraSupabaseValido(obra.id)) {
        const { error } = await removerComentarioObraSupabase(
          comentario.id,
          obra.id,
          userId,
        );

        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        if (error) {
          throw error;
        }
      }

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        if (!execucaoAcaoEstaAtual()) {
          return comentariosAtuais;
        }

        const proximosComentarios = comentariosAtuais.filter(
          (comentarioAtual) => !idsParaRemover.has(comentarioAtual.id),
        );

        if (!execucaoAcaoEstaAtual()) {
          return comentariosAtuais;
        }

        salvarComentariosObraLocais(userId, obra.id, proximosComentarios);

        return proximosComentarios;
      });

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setTotalComentariosObra((totalAtual) => {
        if (!execucaoAcaoEstaAtual()) {
          return totalAtual;
        }

        return Math.max(0, totalAtual - idsParaRemover.size);
      });

      if (!comentario.comentarioPaiId) {
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        setComentariosProximoOffset((offsetAtual) => {
          if (!execucaoAcaoEstaAtual()) {
            return offsetAtual;
          }

          return Math.max(0, offsetAtual - 1);
        });
      }

      if (
        respostaComentario &&
        (idsParaRemover.has(respostaComentario.comentarioPaiId) ||
          idsParaRemover.has(comentario.id))
      ) {
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        setRespostaComentario(null);
      }
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentarioStatus("Não foi possível remover o comentário agora.");
    } finally {
      if (execucaoAcaoEstaAtual()) {
        setComentarioRemovendoId("");
      }
    }
  }

  async function alternarCurtidaComentarioObra(
    comentario: ComentarioObraPublico,
  ) {
    if (!obra || comentarioCurtindoId) {
      return;
    }

    const identidadeAcao = await obterIdentidadeLogadaParaAcao(
      "Entre na sua conta para curtir comentários.",
    );

    if (!identidadeAcao) {
      return;
    }

    const userId = identidadeAcao.usuarioId;
    const execucaoAcaoEstaAtual = criarGuardIdentidadeAcao(identidadeAcao);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    const jaCurtiu = comentario.curtidas.includes(userId);

    if (!execucaoAcaoEstaAtual()) {
      return;
    }

    setComentarioCurtindoId(comentario.id);
    setComentarioStatus("");
    setComentariosObra((comentariosAtuais) => {
      if (!execucaoAcaoEstaAtual()) {
        return comentariosAtuais;
      }

      return comentariosAtuais.map((comentarioAtual) =>
        comentarioAtual.id === comentario.id
          ? {
              ...comentarioAtual,
              curtidas: jaCurtiu
                ? comentarioAtual.curtidas.filter(
                    (usuarioCurtidaId) => usuarioCurtidaId !== userId,
                  )
                : Array.from(new Set([...comentarioAtual.curtidas, userId])),
            }
          : comentarioAtual,
      );
    });

    if (comentario.local || !idObraSupabaseValido(obra.id)) {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        if (!execucaoAcaoEstaAtual()) {
          return comentariosAtuais;
        }

        salvarComentariosObraLocais(userId, obra.id, comentariosAtuais);
        return comentariosAtuais;
      });

      if (execucaoAcaoEstaAtual()) {
        setComentarioCurtindoId("");
      }

      return;
    }

    try {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      const { error: erroRemoverCurtida } =
        await removerCurtidaComentarioObraSupabase(comentario.id, userId);

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      if (erroRemoverCurtida) {
        throw erroRemoverCurtida;
      }

      if (!jaCurtiu) {
        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        const { error: erroInserirCurtida } =
          await inserirCurtidaComentarioObraSupabase(comentario.id, userId);

        if (!execucaoAcaoEstaAtual()) {
          return;
        }

        if (erroInserirCurtida) {
          throw erroInserirCurtida;
        }
      }
    } catch {
      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentariosObra((comentariosAtuais) => {
        if (!execucaoAcaoEstaAtual()) {
          return comentariosAtuais;
        }

        return comentariosAtuais.map((comentarioAtual) =>
          comentarioAtual.id === comentario.id
            ? {
                ...comentarioAtual,
                curtidas: jaCurtiu
                  ? Array.from(new Set([...comentarioAtual.curtidas, userId]))
                  : comentarioAtual.curtidas.filter(
                      (usuarioCurtidaId) => usuarioCurtidaId !== userId,
                    ),
              }
            : comentarioAtual,
        );
      });

      if (!execucaoAcaoEstaAtual()) {
        return;
      }

      setComentarioStatus(
        "Não foi possível atualizar a curtida do comentário agora.",
      );
    } finally {
      if (execucaoAcaoEstaAtual()) {
        setComentarioCurtindoId("");
      }
    }
  }

  return {
    enviarComentarioObra,
    removerComentarioObra,
    alternarCurtidaComentarioObra,
  };
}
