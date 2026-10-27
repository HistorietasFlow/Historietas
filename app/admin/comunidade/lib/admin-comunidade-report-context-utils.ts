import type { DenunciaComunidade } from "../loaders/carregar-denuncias-base-moderacao";

export type DenunciaComContexto = DenunciaComunidade & {
  denuncianteNome: string;
  alvoResumo: string;
  alvoAutor: string;
  alvoData: string;
  alvoPostId: string;
  alvoCategoria?: string;
  alvoTipoPublicacao?: string;
  alvoTemSpoiler?: boolean;
  alvoObra?: string;
  alvoCapituloId?: string;
  alvoObraId?: string;
  alvoObraSlug?: string;
  alvoCapituloTitulo?: string;
  alvoPerfilUserId?: string;
  alvoAnotacaoId?: string;
};

type PostContextoModeracao = {
  id: string;
  autor_nome?: string | null;
  categoria?: string | null;
  tipo_publicacao?: string | null;
  tem_spoiler?: boolean | null;
  texto?: string | null;
  obra_relacionada?: string | null;
  criado_em?: string | null;
};

type ComentarioContextoModeracao = {
  id: string;
  post_id?: string | null;
  autor_nome?: string | null;
  texto?: string | null;
  criado_em?: string | null;
};

type ComentarioCapituloContextoModeracao = {
  id: string;
  capitulo_id: string;
  user_id: string;
  comentario?: string | null;
  criado_em?: string | null;
};

type ComentarioObraContextoModeracao = {
  id: string;
  obra_id: string;
  user_id: string;
  comentario?: string | null;
  criado_em?: string | null;
};

type ComentarioDiarioContextoModeracao = {
  id: string;
  anotacao_id: string;
  user_id: string;
  texto?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

type AnotacaoDiarioContextoModeracao = {
  id: string;
  obra_id: string;
  user_id: string;
  tipo?: string | null;
  texto?: string | null;
  contem_spoiler?: boolean | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

type CapituloContextoModeracao = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo?: string | null;
  texto?: string | null;
  criado_em?: string | null;
};

type ObraContextoModeracao = {
  id: string;
  user_id: string;
  titulo?: string | null;
  autor?: string | null;
  slug?: string | null;
  criada_em?: string | null;
};

type MontarDenunciasComContextoModeracaoParams = {
  denunciasMapeadas: DenunciaComunidade[];
  perfisPorId: Map<string, string>;
  postsPorId: Map<string, PostContextoModeracao>;
  comentariosPorId: Map<string, ComentarioContextoModeracao>;
  comentariosCapitulosPorId: Map<string, ComentarioCapituloContextoModeracao>;
  comentariosObrasPorId: Map<string, ComentarioObraContextoModeracao>;
  comentariosDiarioPorId: Map<string, ComentarioDiarioContextoModeracao>;
  diarioAnotacoesPorId: Map<string, AnotacaoDiarioContextoModeracao>;
  capitulosPorId: Map<string, CapituloContextoModeracao>;
  obrasPorId: Map<string, ObraContextoModeracao>;
};

export function montarDenunciasComContextoModeracao({
  denunciasMapeadas,
  perfisPorId,
  postsPorId,
  comentariosPorId,
  comentariosCapitulosPorId,
  comentariosObrasPorId,
  comentariosDiarioPorId,
  diarioAnotacoesPorId,
  capitulosPorId,
  obrasPorId,
}: MontarDenunciasComContextoModeracaoParams): DenunciaComContexto[] {
  const nomeDenunciante = (denuncia: DenunciaComunidade) =>
    perfisPorId.get(denuncia.denuncianteId) || "Usuário";

  return denunciasMapeadas.map((denuncia) => {
    if (denuncia.alvoTipo === "post") {
      const post = postsPorId.get(denuncia.alvoId);

      return {
        ...denuncia,
        denuncianteNome: nomeDenunciante(denuncia),
        alvoResumo:
          post?.texto || "Publicação não encontrada ou removida.",
        alvoAutor: post?.autor_nome || "Autor não encontrado",
        alvoData: post?.criado_em || "",
        alvoPostId: post?.id || denuncia.alvoId,
        alvoCategoria: post?.categoria || "",
        alvoTipoPublicacao: post?.tipo_publicacao || "Discussão",
        alvoTemSpoiler: Boolean(post?.tem_spoiler),
        alvoObra: post?.obra_relacionada || "",
      };
    }

    if (denuncia.alvoTipo === "comentario") {
      const comentario = comentariosPorId.get(denuncia.alvoId);

      return {
        ...denuncia,
        denuncianteNome: nomeDenunciante(denuncia),
        alvoResumo:
          comentario?.texto ||
          "Comentário não encontrado ou removido.",
        alvoAutor: comentario?.autor_nome || "Autor não encontrado",
        alvoData: comentario?.criado_em || "",
        alvoPostId: comentario?.post_id || "",
      };
    }

    if (denuncia.alvoTipo === "comentario_capitulo") {
      const comentario = comentariosCapitulosPorId.get(denuncia.alvoId);
      const capitulo = comentario
        ? capitulosPorId.get(comentario.capitulo_id)
        : undefined;
      const obra = capitulo
        ? obrasPorId.get(capitulo.obra_id)
        : undefined;

      return {
        ...denuncia,
        denuncianteNome: nomeDenunciante(denuncia),
        alvoResumo:
          comentario?.comentario ||
          "Comentário de capítulo não encontrado ou removido.",
        alvoAutor: comentario
          ? perfisPorId.get(comentario.user_id) ||
            "Autor não encontrado"
          : "Autor não encontrado",
        alvoData: comentario?.criado_em || "",
        alvoPostId: "",
        alvoObra: obra?.titulo?.trim() || "",
        alvoObraId: obra?.id || capitulo?.obra_id || "",
        alvoObraSlug: obra?.slug?.trim() || "",
        alvoCapituloId: comentario?.capitulo_id || "",
        alvoCapituloTitulo: capitulo?.titulo?.trim() || "",
      };
    }

    if (denuncia.alvoTipo === "obra") {
      const obra = obrasPorId.get(denuncia.alvoId);

      return {
        ...denuncia,
        denuncianteNome: nomeDenunciante(denuncia),
        alvoResumo:
          obra?.titulo?.trim() || "Obra não encontrada ou removida.",
        alvoAutor:
          obra?.autor?.trim() ||
          (obra
            ? perfisPorId.get(obra.user_id) || "Autor não encontrado"
            : "Autor não encontrado"),
        alvoData: obra?.criada_em || "",
        alvoPostId: "",
        alvoObraId: obra?.id || denuncia.alvoId,
        alvoObraSlug: obra?.slug?.trim() || "",
      };
    }

    if (denuncia.alvoTipo === "capitulo") {
      const capitulo = capitulosPorId.get(denuncia.alvoId);
      const obra = capitulo
        ? obrasPorId.get(capitulo.obra_id)
        : undefined;
      const textoCapitulo = capitulo?.texto?.trim() || "";

      return {
        ...denuncia,
        denuncianteNome: nomeDenunciante(denuncia),
        alvoResumo:
          textoCapitulo.slice(0, 5000) ||
          capitulo?.titulo?.trim() ||
          "Capítulo não encontrado ou removido.",
        alvoAutor: capitulo
          ? perfisPorId.get(capitulo.user_id) ||
            obra?.autor?.trim() ||
            "Autor não encontrado"
          : "Autor não encontrado",
        alvoData: capitulo?.criado_em || "",
        alvoPostId: "",
        alvoObra: obra?.titulo?.trim() || "",
        alvoObraId: obra?.id || capitulo?.obra_id || "",
        alvoObraSlug: obra?.slug?.trim() || "",
        alvoCapituloId: capitulo?.id || denuncia.alvoId,
        alvoCapituloTitulo: capitulo?.titulo?.trim() || "",
      };
    }

    if (denuncia.alvoTipo === "diario_anotacao") {
      const anotacao = diarioAnotacoesPorId.get(denuncia.alvoId);
      const obra = anotacao
        ? obrasPorId.get(anotacao.obra_id)
        : undefined;

      return {
        ...denuncia,
        denuncianteNome: nomeDenunciante(denuncia),
        alvoResumo:
          anotacao?.texto ||
          "Anotação do Diário não encontrada ou removida.",
        alvoAutor: anotacao
          ? perfisPorId.get(anotacao.user_id) ||
            "Autor não encontrado"
          : "Autor não encontrado",
        alvoData:
          anotacao?.atualizado_em ||
          anotacao?.criado_em ||
          "",
        alvoPostId: "",
        alvoCategoria: "Diário",
        alvoTipoPublicacao: anotacao?.tipo?.trim() || "",
        alvoTemSpoiler: Boolean(anotacao?.contem_spoiler),
        alvoObra: obra?.titulo?.trim() || "",
        alvoObraId: obra?.id || anotacao?.obra_id || "",
        alvoObraSlug: obra?.slug?.trim() || "",
        alvoPerfilUserId: anotacao?.user_id || "",
        alvoAnotacaoId: anotacao?.id || denuncia.alvoId,
      };
    }

    if (denuncia.alvoTipo === "comentario_diario") {
      const comentarioDiario = comentariosDiarioPorId.get(
        denuncia.alvoId
      );
      const anotacao = comentarioDiario
        ? diarioAnotacoesPorId.get(comentarioDiario.anotacao_id)
        : undefined;
      const obra = anotacao
        ? obrasPorId.get(anotacao.obra_id)
        : undefined;

      return {
        ...denuncia,
        denuncianteNome: nomeDenunciante(denuncia),
        alvoResumo:
          comentarioDiario?.texto ||
          "Comentário do Diário não encontrado ou removido.",
        alvoAutor: comentarioDiario
          ? perfisPorId.get(comentarioDiario.user_id) ||
            "Autor não encontrado"
          : "Autor não encontrado",
        alvoData:
          comentarioDiario?.atualizado_em ||
          comentarioDiario?.criado_em ||
          "",
        alvoPostId: "",
        alvoCategoria: "Diário",
        alvoTemSpoiler: Boolean(anotacao?.contem_spoiler),
        alvoObra: obra?.titulo?.trim() || "",
        alvoObraId: obra?.id || anotacao?.obra_id || "",
        alvoObraSlug: obra?.slug?.trim() || "",
        alvoPerfilUserId: anotacao?.user_id || "",
        alvoAnotacaoId:
          comentarioDiario?.anotacao_id ||
          anotacao?.id ||
          "",
      };
    }

    const comentarioObra = comentariosObrasPorId.get(
      denuncia.alvoId
    );
    const obra = comentarioObra
      ? obrasPorId.get(comentarioObra.obra_id)
      : undefined;

    return {
      ...denuncia,
      denuncianteNome: nomeDenunciante(denuncia),
      alvoResumo:
        comentarioObra?.comentario ||
        "Comentário da obra não encontrado ou removido.",
      alvoAutor: comentarioObra
        ? perfisPorId.get(comentarioObra.user_id) ||
          "Autor não encontrado"
        : "Autor não encontrado",
      alvoData: comentarioObra?.criado_em || "",
      alvoPostId: "",
      alvoObra: obra?.titulo?.trim() || "",
      alvoObraId: obra?.id || comentarioObra?.obra_id || "",
      alvoObraSlug: obra?.slug?.trim() || "",
    };
  });
}
