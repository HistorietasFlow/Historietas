import type { Dispatch, SetStateAction } from "react";
import { usuarioPodeGerenciarComentario } from "../../../lib/historietasCommentModeration";
import type { ComentarioCapituloPublico } from "../components/ler-capitulo-comments-sheet";
import type { PerfilComentarioLeitor } from "./ler-capitulo-comments-read-loader";
import type { CapituloLocal, ObraLocal } from "./ler-capitulo-work-normalization";

type MetricasComentarios = {
  totalComentarios: number;
  carregado: boolean;
};

type DependenciasAcoesComentarios<T extends MetricasComentarios> = {
  supabase: typeof import("../../../lib/supabase/client").supabase;
  obraId: string;
  capituloId: string;
  obraAtual: ObraLocal | null;
  capituloAtual: CapituloLocal | null;
  comentariosCapitulo: ComentarioCapituloPublico[];
  router: { push: (href: string) => void };
  iniciarAcaoComentariosCapitulo: (chave: string) => boolean;
  finalizarAcaoComentariosCapitulo: (chave: string) => void;
  obterUsuarioLogadoIdAtual: () => Promise<string>;
  execucaoIdentidadeAcaoEstaAtual: () => boolean;
  criarLoginHrefLeitor: (obraId?: string, capituloId?: string) => string;
  criarHrefLeituraCapituloLeitor: (obra: ObraLocal, capituloId: string) => string;
  carregarPerfilComentarioLeitor: (userId: string) => Promise<PerfilComentarioLeitor>;
  salvarComentarioCapituloSupabase: (
    capituloId: string,
    comentario: string,
    comentarioPaiId?: string,
    userIdEsperado?: string,
  ) => Promise<Record<string, unknown> | null>;
  obterTextoRegistroLeitor: (registro: Record<string, unknown> | null | undefined, chave: string) => string;
  registrarNotificacaoInteracaoCapituloSupabase: (args: {
    tipo: "comentario-capitulo" | "curtida-comentario-capitulo";
    obra: ObraLocal | null;
    capitulo: CapituloLocal | null;
    comentarioId?: string;
    titulo: string;
    mensagem: string;
    link: string;
    usuarioIdEsperado?: string;
  }) => Promise<boolean>;
  salvarCurtidaComentarioCapituloLocal: (userId: string, comentarioId: string, curtiu: boolean) => void;
  TABELA_COMENTARIOS_CAPITULOS_CURTIDAS: "comentarios_capitulos_curtidas";
  atualizarCapitulo: (dados: Partial<CapituloLocal>) => void;
  setComentarioStatus: Dispatch<SetStateAction<string>>;
  setMensagemAcao: Dispatch<SetStateAction<string>>;
  setPerfilComentarioLeitor: Dispatch<SetStateAction<PerfilComentarioLeitor>>;
  setComentarioDigitado: Dispatch<SetStateAction<string>>;
  setComentariosCapitulo: Dispatch<SetStateAction<ComentarioCapituloPublico[]>>;
  setMetricasCapitulo: Dispatch<SetStateAction<T>>;
  setMostrarComentario: Dispatch<SetStateAction<boolean>>;
};

function obterIdsComentarioCapituloComRespostas(
  comentarios: ComentarioCapituloPublico[],
  comentarioId: string
) {
  const ids = new Set<string>([comentarioId]);
  let encontrouNovos = true;

  while (encontrouNovos) {
    encontrouNovos = false;

    comentarios.forEach((comentario) => {
      if (
        comentario.comentarioPaiId &&
        ids.has(comentario.comentarioPaiId) &&
        !ids.has(comentario.id)
      ) {
        ids.add(comentario.id);
        encontrouNovos = true;
      }
    });
  }

  return ids;
}

export function criarAcoesComentariosCapitulo<T extends MetricasComentarios>({
  supabase,
  obraId,
  capituloId,
  obraAtual,
  capituloAtual,
  comentariosCapitulo,
  router,
  iniciarAcaoComentariosCapitulo,
  finalizarAcaoComentariosCapitulo,
  obterUsuarioLogadoIdAtual,
  execucaoIdentidadeAcaoEstaAtual,
  criarLoginHrefLeitor,
  criarHrefLeituraCapituloLeitor,
  carregarPerfilComentarioLeitor,
  salvarComentarioCapituloSupabase,
  obterTextoRegistroLeitor,
  registrarNotificacaoInteracaoCapituloSupabase,
  salvarCurtidaComentarioCapituloLocal,
  TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
  atualizarCapitulo,
  setComentarioStatus,
  setMensagemAcao,
  setPerfilComentarioLeitor,
  setComentarioDigitado,
  setComentariosCapitulo,
  setMetricasCapitulo,
  setMostrarComentario,
}: DependenciasAcoesComentarios<T>) {
  async function enviarComentarioCapitulo(
    postId: string,
    textoRecebido: string,
    comentarioPaiId = ""
  ) {
    const chaveAcao = `enviar-comentario-capitulo:${postId}`;

    if (
      !execucaoIdentidadeAcaoEstaAtual() ||
      !iniciarAcaoComentariosCapitulo(chaveAcao)
    ) {
      return false;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!execucaoIdentidadeAcaoEstaAtual()) {
        return false;
      }

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para comentar este capítulo.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return false;
      }

      const textoLimpo = textoRecebido.trim();

      if (!textoLimpo) {
        setComentarioStatus("Escreva um comentário antes de enviar.");
        return false;
      }

      const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);

      if (!execucaoIdentidadeAcaoEstaAtual()) {
        return false;
      }

      setPerfilComentarioLeitor(perfilAtual);

      const comentarioPaiIdLimpo = comentarioPaiId.trim();
      const comentarioSalvo = await salvarComentarioCapituloSupabase(
        postId,
        textoLimpo,
        comentarioPaiIdLimpo,
        userIdAtual,
      );

      if (!execucaoIdentidadeAcaoEstaAtual()) {
        return false;
      }

      const agora = new Date().toISOString();
      const comentarioId = obterTextoRegistroLeitor(comentarioSalvo, "id");

      if (!comentarioId) {
        setComentarioStatus(
          comentarioPaiIdLimpo
            ? "Não foi possível enviar a resposta agora."
            : "Não foi possível enviar o comentário agora."
        );
        return false;
      }

      const criadoEm =
        obterTextoRegistroLeitor(comentarioSalvo, "atualizado_em") ||
        obterTextoRegistroLeitor(comentarioSalvo, "criado_em") ||
        agora;
      const novoComentario: ComentarioCapituloPublico = {
        id: comentarioId,
        userId: userIdAtual,
        nome: perfilAtual.nome || "Usuário",
        avatar: perfilAtual.avatar,
        texto: textoLimpo.slice(0, 420),
        criadoEm,
        comentarioPaiId:
          obterTextoRegistroLeitor(comentarioSalvo, "comentario_pai_id") ||
          comentarioPaiIdLimpo,
        meuComentario: true,
        curtidas: [],
      };

      atualizarCapitulo({
        comentario: textoLimpo,
      });
      setComentarioDigitado(textoLimpo);
      setComentariosCapitulo((comentariosAtuais) => [
        novoComentario,
        ...comentariosAtuais,
      ]);
      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalComentarios: metricasAtuais.totalComentarios + 1,
        carregado: true,
      }));
      setMostrarComentario(true);

      if (obraAtual && capituloAtual) {
        void registrarNotificacaoInteracaoCapituloSupabase({
          tipo: "comentario-capitulo",
          obra: obraAtual,
          capitulo: capituloAtual,
          comentarioId,
          titulo: "Novo comentário no capítulo",
          mensagem: `${perfilAtual.nome || "Um leitor"} comentou em um capítulo.`,
          link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
          usuarioIdEsperado: userIdAtual,
        });
      }

      return true;
    } finally {
      if (execucaoIdentidadeAcaoEstaAtual()) {
        finalizarAcaoComentariosCapitulo(chaveAcao);
      }
    }
  }


  async function removerComentarioCapitulo(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario-capitulo:${comentarioId}`;

    if (
      !execucaoIdentidadeAcaoEstaAtual() ||
      !iniciarAcaoComentariosCapitulo(chaveAcao)
    ) {
      return;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!execucaoIdentidadeAcaoEstaAtual()) {
        return;
      }

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para apagar seu comentário.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return;
      }

      const comentarioAtual = comentariosCapitulo.find(
        (comentario) => comentario.id === comentarioId
      );

      if (
        !comentarioAtual ||
        !usuarioPodeGerenciarComentario(
          userIdAtual,
          comentarioAtual.userId,
          obraAtual?.autorId || "",
        )
      ) {
        setComentarioStatus("Você não pode remover este comentário.");
        return;
      }

      const idsParaRemover = obterIdsComentarioCapituloComRespostas(
        comentariosCapitulo,
        comentarioId
      );
      const { error } = await supabase
        .from("comentarios_capitulos")
        .delete()
        .eq("id", comentarioId)
        .eq("capitulo_id", capituloId);

      if (!execucaoIdentidadeAcaoEstaAtual()) {
        return;
      }

      if (error) {
        setComentarioStatus("Não foi possível remover o comentário agora.");
        return;
      }

      if (!comentarioAtual.comentarioPaiId) {
        atualizarCapitulo({
          comentario: "",
        });
        setComentarioDigitado("");
      }

      setComentariosCapitulo((comentariosAtuais) =>
        comentariosAtuais.filter(
          (comentario) => !idsParaRemover.has(comentario.id)
        )
      );
      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalComentarios: Math.max(
          0,
          metricasAtuais.totalComentarios - idsParaRemover.size
        ),
        carregado: true,
      }));
      void postId;
    } finally {
      if (execucaoIdentidadeAcaoEstaAtual()) {
        finalizarAcaoComentariosCapitulo(chaveAcao);
      }
    }
  }

  async function alternarCurtidaComentarioCapitulo(
    postId: string,
    comentarioId: string
  ) {
    const chaveAcao = `curtir-comentario-capitulo:${comentarioId}`;

    if (
      !execucaoIdentidadeAcaoEstaAtual() ||
      !iniciarAcaoComentariosCapitulo(chaveAcao)
    ) {
      return;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!execucaoIdentidadeAcaoEstaAtual()) {
        return;
      }

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para curtir comentários.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return;
      }

      const comentarioAtual = comentariosCapitulo.find(
        (comentario) => comentario.id === comentarioId
      );
      const jaCurtiu = Boolean(comentarioAtual?.curtidas.includes(userIdAtual));

      setComentariosCapitulo((comentariosAtuais) =>
        comentariosAtuais.map((comentario) => {
          if (comentario.id !== comentarioId) {
            return comentario;
          }

          return {
            ...comentario,
            curtidas: jaCurtiu
              ? comentario.curtidas.filter((curtidaId) => curtidaId !== userIdAtual)
              : Array.from(new Set([...comentario.curtidas, userIdAtual])),
          };
        })
      );
      salvarCurtidaComentarioCapituloLocal(userIdAtual, comentarioId, !jaCurtiu);

      try {
        const { error: erroLimparCurtida } = await supabase
          .from(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS)
          .delete()
          .eq("comentario_id", comentarioId)
          .eq("usuario_id", userIdAtual);

        if (!execucaoIdentidadeAcaoEstaAtual()) {
          return;
        }

        if (erroLimparCurtida) {
          throw erroLimparCurtida;
        }

        if (!jaCurtiu) {
          const { error: erroInserirCurtida } = await supabase
            .from(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS)
            .insert({
              comentario_id: comentarioId,
              usuario_id: userIdAtual,
            });

          if (!execucaoIdentidadeAcaoEstaAtual()) {
            return;
          }

          if (erroInserirCurtida) {
            throw erroInserirCurtida;
          }

          if (obraAtual && capituloAtual && comentarioAtual) {
            const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);

            if (!execucaoIdentidadeAcaoEstaAtual()) {
              return;
            }

            void registrarNotificacaoInteracaoCapituloSupabase({
              tipo: "curtida-comentario-capitulo",
              obra: obraAtual,
              capitulo: capituloAtual,
              comentarioId,
              titulo: "Nova curtida no comentário",
              mensagem: `${perfilAtual.nome || "Um leitor"} curtiu seu comentário em ${capituloAtual.titulo}.`,
              link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
              usuarioIdEsperado: userIdAtual,
            });
          }
        }
      } catch (error) {
        if (!execucaoIdentidadeAcaoEstaAtual()) {
          return;
        }

        setComentariosCapitulo((comentariosAtuais) =>
          comentariosAtuais.map((comentario) => {
            if (comentario.id !== comentarioId) {
              return comentario;
            }

            return {
              ...comentario,
              curtidas: jaCurtiu
                ? Array.from(new Set([...comentario.curtidas, userIdAtual]))
                : comentario.curtidas.filter(
                    (curtidaId) => curtidaId !== userIdAtual
                  ),
            };
          })
        );
        salvarCurtidaComentarioCapituloLocal(
          userIdAtual,
          comentarioId,
          jaCurtiu
        );
        setComentarioStatus(
          "Não foi possível atualizar a curtida do comentário agora."
        );
        console.warn("Não consegui sincronizar a curtida do comentário:", error);
      }

      void postId;
    } finally {
      if (execucaoIdentidadeAcaoEstaAtual()) {
        finalizarAcaoComentariosCapitulo(chaveAcao);
      }
    }
  }

  return {
    enviarComentarioCapitulo,
    removerComentarioCapitulo,
    alternarCurtidaComentarioCapitulo,
  };
}
