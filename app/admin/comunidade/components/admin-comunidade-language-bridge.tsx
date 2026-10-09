"use client";

import { useEffect } from "react";
import { useHistorietasLanguage } from "../../../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../../../lib/i18n";
import { normalizarTexto } from "../../../../lib/utils";

type TraducaoAdminComunidade = {
  en: string;
  es: string;
};

const ADMIN_COMUNIDADE_UI_TRANSLATIONS: Record<
  string,
  TraducaoAdminComunidade
> = {
  "Pendente": { en: "Pending", es: "Pendiente" },
  "Em análise": { en: "Under review", es: "En revisión" },
  "Resolvida": { en: "Resolved", es: "Resuelta" },
  "Rejeitada": { en: "Rejected", es: "Rechazada" },
  "Analisada": { en: "Reviewed", es: "Revisada" },
  "Ignorada": { en: "Ignored", es: "Ignorada" },
  "Spam": { en: "Spam", es: "Spam" },
  "Conteúdo ofensivo": { en: "Offensive content", es: "Contenido ofensivo" },
  "Perfil falso": { en: "Fake profile", es: "Perfil falso" },
  "Assédio": { en: "Harassment", es: "Acoso" },
  "Conteúdo impróprio": { en: "Inappropriate content", es: "Contenido inapropiado" },
  "Outro": { en: "Other", es: "Otro" },
  "Denúncia de perfil": { en: "Profile report", es: "Denuncia de perfil" },
  "Usuário sem nome": { en: "Unnamed user", es: "Usuario sin nombre" },
  "Usuário": { en: "User", es: "Usuario" },
  "Usuário denunciado": { en: "Reported user", es: "Usuario denunciado" },
  "Conteúdo inadequado": { en: "Inappropriate content", es: "Contenido inapropiado" },
  "Ódio ou discriminação": { en: "Hate or discrimination", es: "Odio o discriminación" },
  "Ameaça ou violência": { en: "Threats or violence", es: "Amenazas o violencia" },
  "Conteúdo sexual impróprio": { en: "Improper sexual content", es: "Contenido sexual inapropiado" },
  "Risco envolvendo menor": { en: "Risk involving a minor", es: "Riesgo relacionado con un menor" },
  "Plágio ou direitos autorais": { en: "Plagiarism or copyright", es: "Plagio o derechos de autor" },
  "Informações pessoais expostas": { en: "Exposed personal information", es: "Información personal expuesta" },
  "Fraude ou golpe": { en: "Fraud or scam", es: "Fraude o estafa" },
  "Publicação não encontrada ou removida.": {
    en: "Post not found or removed.",
    es: "Publicación no encontrada o eliminada.",
  },
  "Comentário não encontrado ou removido.": {
    en: "Comment not found or removed.",
    es: "Comentario no encontrado o eliminado.",
  },
  "Comentário de capítulo não encontrado ou removido.": {
    en: "Chapter comment not found or removed.",
    es: "Comentario del capítulo no encontrado o eliminado.",
  },
  "Obra não encontrada ou removida.": {
    en: "Work not found or removed.",
    es: "Obra no encontrada o eliminada.",
  },
  "Capítulo não encontrado ou removido.": {
    en: "Chapter not found or removed.",
    es: "Capítulo no encontrado o eliminado.",
  },
  "Comentário da obra não encontrado ou removido.": {
    en: "Work comment not found or removed.",
    es: "Comentario de la obra no encontrado o eliminado.",
  },
  "Anotação do Diário não encontrada ou removida.": {
    en: "Journal entry not found or removed.",
    es: "Anotación del Diario no encontrada o eliminada.",
  },
  "Comentário do Diário não encontrado ou removido.": {
    en: "Journal comment not found or removed.",
    es: "Comentario del Diario no encontrado o eliminado.",
  },
  "Autor não encontrado": { en: "Author not found", es: "Autor no encontrado" },
  "Discussão": { en: "Discussion", es: "Discusión" },
  "Área restrita": { en: "Restricted area", es: "Área restringida" },
  "Acesso negado": { en: "Access denied", es: "Acceso denegado" },
  "Moderação": { en: "Moderation", es: "Moderación" },
  "Fechar busca": { en: "Close search", es: "Cerrar búsqueda" },
  "Abrir busca": { en: "Open search", es: "Abrir búsqueda" },
  "Notificações": { en: "Notifications", es: "Notificaciones" },
  "Problemas técnicos": {
    en: "Technical issues",
    es: "Problemas técnicos",
  },
  "Abrir problemas técnicos": {
    en: "Open technical issues",
    es: "Abrir problemas técnicos",
  },
  "Buscar denúncias...": { en: "Search reports...", es: "Buscar denuncias..." },
  "total": { en: "total", es: "total" },
  "pendentes": { en: "pending", es: "pendientes" },
  "em análise": { en: "under review", es: "en revisión" },
  "resolvidas": { en: "resolved", es: "resueltas" },
  "rejeitadas": { en: "rejected", es: "rechazadas" },
  "perfis": { en: "profiles", es: "perfiles" },
  "perfis pend.": { en: "pending profiles", es: "perfiles pend." },
  "Todas": { en: "All", es: "Todas" },
  "Arquivadas": { en: "Archived", es: "Archivadas" },
  "Limpar filtros": { en: "Clear filters", es: "Limpiar filtros" },
  "Filtrar denúncias": { en: "Filter reports", es: "Filtrar denuncias" },
  "Fechar filtros": { en: "Close filters", es: "Cerrar filtros" },
  "Status": { en: "Status", es: "Estado" },
  "Perfil": { en: "Profile", es: "Perfil" },
  "Ações da denúncia": { en: "Report actions", es: "Acciones de la denuncia" },
  "Abrir perfil denunciado": {
    en: "Open reported profile",
    es: "Abrir perfil denunciado",
  },
  "Removendo...": { en: "Removing...", es: "Eliminando..." },
  "Remover do painel": { en: "Remove from dashboard", es: "Eliminar del panel" },
  "Assumindo...": { en: "Starting review...", es: "Asumiendo revisión..." },
  "Assumir análise": { en: "Start review", es: "Asumir revisión" },
  "Salvando...": { en: "Saving...", es: "Guardando..." },
  "Perfil denunciado": { en: "Reported profile", es: "Perfil denunciado" },
  "Denunciante:": { en: "Reporter:", es: "Denunciante:" },
  "Denúncia": { en: "Report", es: "Denuncia" },
  "Registro interno": { en: "Internal record", es: "Registro interno" },
  "Sem descrição adicional.": {
    en: "No additional description.",
    es: "Sin descripción adicional.",
  },
  "Publicação": { en: "Post", es: "Publicación" },
  "Comentário": { en: "Comment", es: "Comentario" },
  "Comentário de capítulo": {
    en: "Chapter comment",
    es: "Comentario del capítulo",
  },
  "Obra": { en: "Work", es: "Obra" },
  "Capítulo": { en: "Chapter", es: "Capítulo" },
  "Comentário da obra": {
    en: "Work comment",
    es: "Comentario de la obra",
  },
  "Anotação do Diário": {
    en: "Journal entry",
    es: "Anotación del Diario",
  },
  "Comentário do Diário": {
    en: "Journal comment",
    es: "Comentario del Diario",
  },
  "Diário": { en: "Journal", es: "Diario" },
  "Arquivada": { en: "Archived", es: "Archivada" },
  "Abrir publicação na Comunidade": {
    en: "Open post in Community",
    es: "Abrir publicación en la Comunidad",
  },
  "Abrir capítulo denunciado": {
    en: "Open reported chapter",
    es: "Abrir capítulo denunciado",
  },
  "Abrir obra denunciada": {
    en: "Open reported work",
    es: "Abrir obra denunciada",
  },
  "Abrir conteúdo no Diário": {
    en: "Open content in Journal",
    es: "Abrir contenido en el Diario",
  },
  "Restaurar para o painel": {
    en: "Restore to dashboard",
    es: "Restaurar al panel",
  },
  "Arquivar denúncia": { en: "Archive report", es: "Archivar denuncia" },
  "Remover publicação": { en: "Remove post", es: "Eliminar publicación" },
  "Remover comentário": { en: "Remove comment", es: "Eliminar comentario" },
  "Remover comentário do capítulo": {
    en: "Remove chapter comment",
    es: "Eliminar comentario del capítulo",
  },
  "Remover obra": { en: "Remove work", es: "Eliminar obra" },
  "Remover capítulo": { en: "Remove chapter", es: "Eliminar capítulo" },
  "Remover comentário da obra": {
    en: "Remove work comment",
    es: "Eliminar comentario de la obra",
  },
  "Remover anotação do Diário": {
    en: "Remove Journal entry",
    es: "Eliminar anotación del Diario",
  },
  "Remover comentário do Diário": {
    en: "Remove Journal comment",
    es: "Eliminar comentario del Diario",
  },
  "Conteúdo denunciado": { en: "Reported content", es: "Contenido denunciado" },
  "Indisponível": { en: "Unavailable", es: "No disponible" },
  "Conteúdo removido ou indisponível.": {
    en: "Content removed or unavailable.",
    es: "Contenido eliminado o no disponible.",
  },
  "Autor:": { en: "Author:", es: "Autor:" },
  "Reincidências:": { en: "Repeat reports:", es: "Reincidencias:" },
  "Data:": { en: "Date:", es: "Fecha:" },
  "Categoria:": { en: "Category:", es: "Categoría:" },
  "Tipo:": { en: "Type:", es: "Tipo:" },
  "Spoiler:": { en: "Spoiler:", es: "Spoiler:" },
  "Sim": { en: "Yes", es: "Sí" },
  "Não": { en: "No", es: "No" },
  "Obra:": { en: "Work:", es: "Obra:" },
  "Capítulo:": { en: "Chapter:", es: "Capítulo:" },
  "Sem detalhe adicional.": {
    en: "No additional details.",
    es: "Sin detalles adicionales.",
  },
  "Observação interna": { en: "Internal note", es: "Observación interna" },
  "Até 800 caracteres": { en: "Up to 800 characters", es: "Hasta 800 caracteres" },
  "Ex.: conteúdo analisado, ação tomada, manter observação interna...": {
    en: "E.g.: content reviewed, action taken, keep an internal note...",
    es: "Ej.: contenido revisado, acción tomada, mantener una observación interna...",
  },
  "Nenhuma denúncia encontrada": { en: "No reports found", es: "No se encontraron denuncias" },
  "Fechar ações da denúncia de perfil": {
    en: "Close profile report actions",
    es: "Cerrar acciones de la denuncia de perfil",
  },
  "Abrir ações da denúncia de perfil": {
    en: "Open profile report actions",
    es: "Abrir acciones de la denuncia de perfil",
  },
  "Ações da denúncia de perfil": {
    en: "Profile report actions",
    es: "Acciones de la denuncia de perfil",
  },
  "Fechar ações da denúncia": {
    en: "Close report actions",
    es: "Cerrar acciones de la denuncia",
  },
  "Abrir ações da denúncia": {
    en: "Open report actions",
    es: "Abrir acciones de la denuncia",
  },
  "O conteúdo denunciado não possui um identificador válido.": {
    en: "The reported content does not have a valid identifier.",
    es: "El contenido denunciado no tiene un identificador válido.",
  },
  "O conteúdo não foi encontrado ou o banco recusou a remoção.": {
    en: "The content was not found or the database rejected the removal.",
    es: "El contenido no fue encontrado o la base de datos rechazó la eliminación.",
  },
  "Apenas moderadores podem atualizar denúncias de perfis.": {
    en: "Only moderators can update profile reports.",
    es: "Solo los moderadores pueden actualizar denuncias de perfiles.",
  },
  "A denúncia de perfil não foi encontrada ou não pôde ser atualizada.": {
    en: "The profile report was not found or could not be updated.",
    es: "La denuncia de perfil no fue encontrada o no pudo actualizarse.",
  },
  "Apenas moderadores podem atualizar denúncias.": {
    en: "Only moderators can update reports.",
    es: "Solo los moderadores pueden actualizar denuncias.",
  },
  "A denúncia não foi encontrada ou não pôde ser atualizada.": {
    en: "The report was not found or could not be updated.",
    es: "La denuncia no fue encontrada o no pudo actualizarse.",
  },
  "Apenas moderadores podem remover conteúdo denunciado.": {
    en: "Only moderators can remove reported content.",
    es: "Solo los moderadores pueden eliminar contenido denunciado.",
  },
  "O conteúdo foi removido, mas nenhuma denúncia correspondente pôde ser atualizada.": {
    en: "The content was removed, but no matching report could be updated.",
    es: "El contenido fue eliminado, pero no se pudo actualizar ninguna denuncia correspondiente.",
  },
  "Apenas moderadores podem arquivar denúncias.": {
    en: "Only moderators can archive reports.",
    es: "Solo los moderadores pueden archivar denuncias.",
  },
  "A denúncia não foi encontrada ou não pôde ser arquivada.": {
    en: "The report was not found or could not be archived.",
    es: "La denuncia no fue encontrada o no pudo archivarse.",
  },
  "Denúncia arquivada e ocultada do painel principal.": {
    en: "Report archived and hidden from the main dashboard.",
    es: "Denuncia archivada y ocultada del panel principal.",
  },
  "Apenas moderadores podem restaurar denúncias.": {
    en: "Only moderators can restore reports.",
    es: "Solo los moderadores pueden restaurar denuncias.",
  },
  "A denúncia não foi encontrada ou não pôde ser restaurada.": {
    en: "The report was not found or could not be restored.",
    es: "La denuncia no fue encontrada o no pudo restaurarse.",
  },
  "Denúncia restaurada para o painel principal.": {
    en: "Report restored to the main dashboard.",
    es: "Denuncia restaurada al panel principal.",
  },
  "Apenas moderadores podem remover denúncias resolvidas.": {
    en: "Only moderators can remove resolved reports.",
    es: "Solo los moderadores pueden eliminar denuncias resueltas.",
  },
  "Somente denúncias resolvidas podem ser removidas do painel.": {
    en: "Only resolved reports can be removed from the dashboard.",
    es: "Solo las denuncias resueltas pueden eliminarse del panel.",
  },
  "A denúncia resolvida não foi encontrada ou não pôde ser removida.": {
    en: "The resolved report was not found or could not be removed.",
    es: "La denuncia resuelta no fue encontrada o no pudo eliminarse.",
  },
  "Denúncia resolvida removida do painel.": {
    en: "Resolved report removed from the dashboard.",
    es: "Denuncia resuelta eliminada del panel.",
  },
  "Apenas moderadores podem remover denúncias de perfis resolvidas.": {
    en: "Only moderators can remove resolved profile reports.",
    es: "Solo los moderadores pueden eliminar denuncias de perfiles resueltas.",
  },
  "Somente denúncias de perfis resolvidas podem ser removidas do painel.": {
    en: "Only resolved profile reports can be removed from the dashboard.",
    es: "Solo las denuncias de perfiles resueltas pueden eliminarse del panel.",
  },
  "A denúncia de perfil resolvida não foi encontrada ou não pôde ser removida.": {
    en: "The resolved profile report was not found or could not be removed.",
    es: "La denuncia de perfil resuelta no fue encontrada o no pudo eliminarse.",
  },
  "Denúncia de perfil resolvida removida do painel.": {
    en: "Resolved profile report removed from the dashboard.",
    es: "Denuncia de perfil resuelta eliminada del panel.",
  },
  "Erro ao carregar moderação": {
    en: "Error loading moderation",
    es: "Error al cargar la moderación",
  },
  "Erro ao atualizar denúncia de perfil": {
    en: "Error updating profile report",
    es: "Error al actualizar la denuncia de perfil",
  },
  "Erro ao atualizar denúncia": {
    en: "Error updating report",
    es: "Error al actualizar la denuncia",
  },
  "Erro ao remover conteúdo denunciado": {
    en: "Error removing reported content",
    es: "Error al eliminar el contenido denunciado",
  },
  "Erro ao arquivar denúncia": {
    en: "Error archiving report",
    es: "Error al archivar la denuncia",
  },
  "Erro ao restaurar denúncia": {
    en: "Error restoring report",
    es: "Error al restaurar la denuncia",
  },
  "Erro ao remover denúncia resolvida": {
    en: "Error removing resolved report",
    es: "Error al eliminar la denuncia resuelta",
  },
  "Erro ao remover denúncia de perfil resolvida": {
    en: "Error removing resolved profile report",
    es: "Error al eliminar la denuncia de perfil resuelta",
  },
  "erro desconhecido.": { en: "unknown error.", es: "error desconocido." },
};

function traduzirStatusAdminComunidade(
  status: string,
  language: HistorietasLanguage
) {
  const statusNormalizado = normalizarTexto(status);

  if (language === "en") {
    if (statusNormalizado === "pendente") return "pending";
    if (statusNormalizado === "em analise") return "under review";
    if (statusNormalizado === "resolvida") return "resolved";
    if (statusNormalizado === "rejeitada") return "rejected";
    if (statusNormalizado === "analisada") return "reviewed";
    if (statusNormalizado === "ignorada") return "ignored";
  }

  if (statusNormalizado === "pendente") return "pendiente";
  if (statusNormalizado === "em analise") return "en revisión";
  if (statusNormalizado === "resolvida") return "resuelta";
  if (statusNormalizado === "rejeitada") return "rechazada";
  if (statusNormalizado === "analisada") return "revisada";
  if (statusNormalizado === "ignorada") return "ignorada";

  return status;
}

function traduzirTextoAdminComunidade(
  texto: string,
  language: HistorietasLanguage
) {
  if (language === "pt-BR" || !texto) {
    return texto;
  }

  const partes = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);
  const inicio = partes?.[1] || "";
  const conteudo = partes?.[2] || texto;
  const fim = partes?.[3] || "";
  const traducaoExata = ADMIN_COMUNIDADE_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[language]}${fim}`;
  }

  let correspondencia = /^Notificações:\s*(\d+)\s*não lidas$/i.exec(conteudo);

  if (correspondencia) {
    return language === "en"
      ? `${inicio}Notifications: ${correspondencia[1]} unread${fim}`
      : `${inicio}Notificaciones: ${correspondencia[1]} sin leer${fim}`;
  }

  correspondencia = /^(\d+)\s+denúncia de perfil encontrada$/i.exec(conteudo);

  if (correspondencia) {
    return language === "en"
      ? `${inicio}${correspondencia[1]} profile report found${fim}`
      : `${inicio}${correspondencia[1]} denuncia de perfil encontrada${fim}`;
  }

  correspondencia = /^(\d+)\s+denúncias de perfis encontradas$/i.exec(conteudo);

  if (correspondencia) {
    return language === "en"
      ? `${inicio}${correspondencia[1]} profile reports found${fim}`
      : `${inicio}${correspondencia[1]} denuncias de perfiles encontradas${fim}`;
  }

  correspondencia = /^(\d+)\s+denúncia de conteúdo encontrada$/i.exec(conteudo);

  if (correspondencia) {
    return language === "en"
      ? `${inicio}${correspondencia[1]} content report found${fim}`
      : `${inicio}${correspondencia[1]} denuncia de contenido encontrada${fim}`;
  }

  correspondencia = /^(\d+)\s+denúncias da Comunidade encontradas$/i.exec(
    conteudo
  );

  if (correspondencia) {
    return language === "en"
      ? `${inicio}${correspondencia[1]} content reports found${fim}`
      : `${inicio}${correspondencia[1]} denuncias de contenido encontradas${fim}`;
  }

  correspondencia = /^Denunciado em\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return language === "en"
      ? `${inicio}Reported on ${correspondencia[1]}${fim}`
      : `${inicio}Denunciado el ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Última atualização em\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return language === "en"
      ? `${inicio}Last updated on ${correspondencia[1]}${fim}`
      : `${inicio}Última actualización el ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Última análise em\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    return language === "en"
      ? `${inicio}Last reviewed on ${correspondencia[1]}${fim}`
      : `${inicio}Última revisión el ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Marcar como\s+(.+)$/i.exec(conteudo);

  if (correspondencia) {
    const status = traduzirStatusAdminComunidade(
      correspondencia[1],
      language
    );

    return language === "en"
      ? `${inicio}Mark as ${status}${fim}`
      : `${inicio}Marcar como ${status}${fim}`;
  }

  correspondencia =
    /^Denúncia de perfil marcada como\s+(.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    const status = traduzirStatusAdminComunidade(
      correspondencia[1],
      language
    );

    return language === "en"
      ? `${inicio}Profile report marked as ${status}.${fim}`
      : `${inicio}Denuncia de perfil marcada como ${status}.${fim}`;
  }

  correspondencia = /^Denúncia marcada como\s+(.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    const status = traduzirStatusAdminComunidade(
      correspondencia[1],
      language
    );

    return language === "en"
      ? `${inicio}Report marked as ${status}.${fim}`
      : `${inicio}Denuncia marcada como ${status}.${fim}`;
  }

  correspondencia =
    /^Conteúdo removido pela moderação em\s+(.+)\.$/i.exec(conteudo);

  if (correspondencia) {
    return language === "en"
      ? `${inicio}Content removed by moderation on ${correspondencia[1]}.${fim}`
      : `${inicio}Contenido eliminado por moderación el ${correspondencia[1]}.${fim}`;
  }

  correspondencia =
    /^Conteúdo removido pela moderação\. Registro anterior:\s*([\s\S]+)$/i.exec(
      conteudo
    );

  if (correspondencia) {
    return language === "en"
      ? `${inicio}Content removed by moderation. Previous record: ${correspondencia[1]}${fim}`
      : `${inicio}Contenido eliminado por moderación. Registro anterior: ${correspondencia[1]}${fim}`;
  }

  correspondencia =
    /^(Anotação do Diário removida|Comentário do Diário removido) e denúncia marcada como resolvida\.$/i.exec(
      conteudo
    );

  if (correspondencia) {
    const alvoNormalizado = normalizarTexto(correspondencia[1]);
    const alvo = alvoNormalizado.startsWith("anotacao")
      ? language === "en"
        ? "Journal entry"
        : "Anotación del Diario"
      : language === "en"
        ? "Journal comment"
        : "Comentario del Diario";

    return language === "en"
      ? `${inicio}${alvo} removed and report marked as resolved.${fim}`
      : `${inicio}${alvo} eliminado y denuncia marcada como resuelta.${fim}`;
  }

  correspondencia =
    /^(Publicação removida|Comentário removido|Comentário do capítulo removido|Obra removida|Capítulo removido|Comentário da obra removido) e denúncia marcada como resolvida\.$/i.exec(
      conteudo
    );

  if (correspondencia) {
    const alvoNormalizado = normalizarTexto(correspondencia[1]);
    const alvo = alvoNormalizado.startsWith("publicacao")
      ? language === "en"
        ? "Post"
        : "Publicación"
      : alvoNormalizado === "obra removida"
        ? language === "en"
          ? "Work"
          : "Obra"
        : alvoNormalizado === "capitulo removido"
          ? language === "en"
            ? "Chapter"
            : "Capítulo"
          : alvoNormalizado.includes("comentario da obra")
            ? language === "en"
              ? "Work comment"
              : "Comentario de la obra"
            : alvoNormalizado.includes("capitulo")
              ? language === "en"
                ? "Chapter comment"
                : "Comentario del capítulo"
              : language === "en"
                ? "Comment"
                : "Comentario";

    return language === "en"
      ? `${inicio}${alvo} removed and report marked as resolved.${fim}`
      : `${inicio}${alvo} eliminado y denuncia marcada como resuelta.${fim}`;
  }

  correspondencia = /^(Erro ao [^:]+):\s*([\s\S]+)$/i.exec(conteudo);

  if (correspondencia) {
    const prefixo =
      ADMIN_COMUNIDADE_UI_TRANSLATIONS[correspondencia[1]]?.[language] ||
      correspondencia[1];
    const detalhe =
      ADMIN_COMUNIDADE_UI_TRANSLATIONS[correspondencia[2]]?.[language] ||
      correspondencia[2];

    return `${inicio}${prefixo}: ${detalhe}${fim}`;
  }

  return texto;
}

export function AdminComunidadeLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const seletorRaiz = "[data-historietas-admin-comunidade-root='true']";

    type EstadoTraducaoAdminComunidade = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoAdminComunidade> =
      new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoAdminComunidade>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados: Array<{ elemento: Element; atributo: string }> = [];
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function elementoEstaNaPagina(elemento: Element | null) {
      return Boolean(
        elemento?.matches(seletorRaiz) || elemento?.closest(seletorRaiz)
      );
    }

    function deveIgnorarElemento(elemento: Element | null) {
      if (!elemento || !elementoEstaNaPagina(elemento)) {
        return true;
      }

      if (elemento.closest("[data-historietas-i18n-ignore='true']")) {
        return true;
      }

      const tag = elemento.tagName.toLowerCase();

      return tag === "script" || tag === "style";
    }

    function aplicarTexto(no: Text) {
      const elementoPai = no.parentElement;

      if (
        deveIgnorarElemento(elementoPai) ||
        elementoPai?.tagName.toLowerCase() === "textarea"
      ) {
        return;
      }

      const atual = no.data;
      let estado = estadosTexto.get(no);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        estadosTexto.set(no, estado);
        textosAlterados.add(no);
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoAdminComunidade(
        estado.original,
        language
      );
      estado.traduzido = proximo;

      if (no.data !== proximo) {
        no.data = proximo;
      }
    }

    function aplicarAtributo(elemento: Element, atributo: string) {
      if (deveIgnorarElemento(elemento) || !elemento.hasAttribute(atributo)) {
        return;
      }

      const atual = elemento.getAttribute(atributo) || "";
      let mapaElemento = estadosAtributos.get(elemento);

      if (!mapaElemento) {
        mapaElemento = new Map();
        estadosAtributos.set(elemento, mapaElemento);
      }

      let estado = mapaElemento.get(atributo);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        mapaElemento.set(atributo, estado);
        atributosAlterados.push({ elemento, atributo });
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoAdminComunidade(
        estado.original,
        language
      );
      estado.traduzido = proximo;

      if (atual !== proximo) {
        elemento.setAttribute(atributo, proximo);
      }
    }

    function aplicarNo(no: Node) {
      if (no.nodeType === Node.TEXT_NODE) {
        aplicarTexto(no as Text);
        return;
      }

      if (!(no instanceof Element)) {
        return;
      }

      const raizes: Element[] = [];

      if (no.matches(seletorRaiz)) {
        raizes.push(no);
      } else if (no.closest(seletorRaiz)) {
        raizes.push(no);
      } else {
        no.querySelectorAll(seletorRaiz).forEach((raiz) => raizes.push(raiz));
      }

      raizes.forEach((raiz) => {
        if (deveIgnorarElemento(raiz)) {
          return;
        }

        atributosTraduziveis.forEach((atributo) =>
          aplicarAtributo(raiz, atributo)
        );

        const walker = document.createTreeWalker(
          raiz,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let atual: Node | null = walker.nextNode();

        while (atual) {
          if (atual.nodeType === Node.TEXT_NODE) {
            aplicarTexto(atual as Text);
          } else if (atual instanceof Element && !deveIgnorarElemento(atual)) {
            atributosTraduziveis.forEach((atributo) =>
              aplicarAtributo(atual as Element, atributo)
            );
          }

          atual = walker.nextNode();
        }
      });
    }

    function aplicarTudo() {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        document
          .querySelectorAll(seletorRaiz)
          .forEach((raiz) => aplicarNo(raiz));
      } finally {
        aplicando = false;
      }
    }

    aplicarTudo();

    const observador = new MutationObserver((mutacoes) => {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        mutacoes.forEach((mutacao) => {
          if (mutacao.type === "characterData") {
            aplicarTexto(mutacao.target as Text);
            return;
          }

          if (
            mutacao.type === "attributes" &&
            mutacao.target instanceof Element
          ) {
            if (
              mutacao.attributeName &&
              atributosTraduziveis.includes(mutacao.attributeName)
            ) {
              aplicarAtributo(mutacao.target, mutacao.attributeName);
            }

            return;
          }

          mutacao.addedNodes.forEach((no) => aplicarNo(no));
        });
      } finally {
        aplicando = false;
      }
    });

    observador.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: atributosTraduziveis,
    });

    return () => {
      observador.disconnect();

      textosAlterados.forEach((no) => {
        const estado = estadosTexto.get(no);

        if (estado && no.data === estado.traduzido) {
          no.data = estado.original;
        }
      });

      atributosAlterados.forEach(({ elemento, atributo }) => {
        const estado = estadosAtributos.get(elemento)?.get(atributo);

        if (estado && elemento.getAttribute(atributo) === estado.traduzido) {
          elemento.setAttribute(atributo, estado.original);
        }
      });
    };
  }, [language]);

  return null;
}
