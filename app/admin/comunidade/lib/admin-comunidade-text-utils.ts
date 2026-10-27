import type { HistorietasLanguage } from "../../../../lib/i18n";
import type { TipoAlvoDenuncia } from "./admin-comunidade-report-label-utils";

export function localeAdminComunidade(language: HistorietasLanguage) {
  return language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
}

export function textoConfirmacaoRemocaoAdminComunidade(
  alvoTipo: TipoAlvoDenuncia,
  language: HistorietasLanguage
) {
  const textos: Record<
    TipoAlvoDenuncia,
    { "pt-BR": string; en: string; es: string }
  > = {
    post: {
      "pt-BR":
        "Remover esta publicação denunciada? Essa ação apaga a publicação da Comunidade.",
      en: "Remove this reported post? This action deletes the post from the Community.",
      es: "¿Eliminar esta publicación denunciada? Esta acción elimina la publicación de la Comunidad.",
    },
    comentario: {
      "pt-BR":
        "Remover este comentário denunciado? Essa ação apaga o comentário da Comunidade.",
      en: "Remove this reported comment? This action deletes the comment from the Community.",
      es: "¿Eliminar este comentario denunciado? Esta acción elimina el comentario de la Comunidad.",
    },
    comentario_capitulo: {
      "pt-BR":
        "Remover este comentário de capítulo denunciado? Essa ação apaga o comentário do capítulo.",
      en: "Remove this reported chapter comment? This action deletes the comment from the chapter.",
      es: "¿Eliminar este comentario del capítulo denunciado? Esta acción elimina el comentario del capítulo.",
    },
    obra: {
      "pt-BR":
        "Remover esta obra denunciada? Essa ação apaga a obra e pode apagar capítulos e interações relacionadas.",
      en: "Remove this reported work? This may also delete related chapters and interactions.",
      es: "¿Eliminar esta obra denunciada? Esto también puede eliminar capítulos e interacciones relacionadas.",
    },
    capitulo: {
      "pt-BR":
        "Remover este capítulo denunciado? Essa ação apaga o capítulo e pode apagar interações relacionadas.",
      en: "Remove this reported chapter? This may also delete related interactions.",
      es: "¿Eliminar este capítulo denunciado? Esto también puede eliminar interacciones relacionadas.",
    },
    comentario_obra: {
      "pt-BR":
        "Remover este comentário de obra denunciado? Essa ação apaga o comentário da obra.",
      en: "Remove this reported work comment? This action deletes the comment from the work.",
      es: "¿Eliminar este comentario de obra denunciado? Esta acción elimina el comentario de la obra.",
    },
    diario_anotacao: {
      "pt-BR":
        "Remover esta anotação denunciada? Essa ação apaga a anotação e as interações relacionadas no Diário.",
      en: "Remove this reported Journal entry? This action deletes the entry and its related interactions.",
      es: "¿Eliminar esta anotación denunciada? Esta acción elimina la anotación y sus interacciones relacionadas.",
    },
    comentario_diario: {
      "pt-BR":
        "Remover este comentário denunciado? Essa ação apaga o comentário do Diário.",
      en: "Remove this reported Journal comment? This action deletes the comment from the Journal.",
      es: "¿Eliminar este comentario denunciado? Esta acción elimina el comentario del Diario.",
    },
  };

  return textos[alvoTipo][language];
}
