import type { HistorietasLanguage } from "../../../lib/i18n";
import { COMUNIDADE_UI_TRANSLATIONS } from "./community-ui-translations";

export function traduzirTextoComunidade(
  texto: string,
  idioma: HistorietasLanguage
) {
  if (idioma === "pt-BR" || !texto) {
    return texto;
  }

  const partes = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);

  if (!partes) {
    return texto;
  }

  const inicio = partes[1];
  const conteudo = partes[2];
  const fim = partes[3];
  const traducaoExata = COMUNIDADE_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Abrir perfil de (.+)$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s profile${fim}`
      : `${inicio}Abrir perfil de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^há (\d+) (segundo|segundos|minuto|minutos|hora|horas|dia|dias)$/.exec(
    conteudo
  );

  if (correspondencia) {
    const total = Number(correspondencia[1]);
    const unidade = correspondencia[2];

    if (idioma === "en") {
      const unidadeEn = unidade.startsWith("segundo")
        ? total === 1
          ? "second"
          : "seconds"
        : unidade.startsWith("minuto")
          ? total === 1
            ? "minute"
            : "minutes"
          : unidade.startsWith("hora")
            ? total === 1
              ? "hour"
              : "hours"
            : total === 1
              ? "day"
              : "days";

      return `${inicio}${total} ${unidadeEn} ago${fim}`;
    }

    const unidadeEs = unidade.startsWith("segundo")
      ? total === 1
        ? "segundo"
        : "segundos"
      : unidade.startsWith("minuto")
        ? total === 1
          ? "minuto"
          : "minutos"
        : unidade.startsWith("hora")
          ? total === 1
            ? "hora"
            : "horas"
          : total === 1
            ? "día"
            : "días";

    return `${inicio}hace ${total} ${unidadeEs}${fim}`;
  }

  correspondencia = /^(\d+) comentários$/.exec(conteudo);

  if (correspondencia) {
    const total = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}${total} ${total === 1 ? "comment" : "comments"}${fim}`
      : `${inicio}${total} ${total === 1 ? "comentario" : "comentarios"}${fim}`;
  }

  correspondencia = /^Ver (\d+) (resposta|respostas)$/.exec(conteudo);

  if (correspondencia) {
    const total = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}View ${total} ${total === 1 ? "reply" : "replies"}${fim}`
      : `${inicio}Ver ${total} ${total === 1 ? "respuesta" : "respuestas"}${fim}`;
  }

  correspondencia = /^Ver mais (\d+) (resposta|respostas)$/.exec(conteudo);

  if (correspondencia) {
    const total = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}View ${total} more ${total === 1 ? "reply" : "replies"}${fim}`
      : `${inicio}Ver ${total} ${total === 1 ? "respuesta" : "respuestas"} más${fim}`;
  }

  correspondencia = /^Adicionar (.+) ao comentário$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Add ${correspondencia[1]} to comment${fim}`
      : `${inicio}Añadir ${correspondencia[1]} al comentario${fim}`;
  }

  correspondencia = /^(\d+) encontrad(?:o|a)(?:s)?$/.exec(conteudo);

  if (correspondencia) {
    const total = Number(correspondencia[1]);

    return idioma === "en"
      ? `${inicio}${total} found${fim}`
      : `${inicio}${total} ${total === 1 ? "encontrado" : "encontrados"}${fim}`;
  }

  correspondencia = /^Confira a publicação de (.+) no HISTORIETAS\.$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Check out ${correspondencia[1]}'s post on HISTORIETAS.${fim}`
      : `${inicio}Mira la publicación de ${correspondencia[1]} en HISTORIETAS.${fim}`;
  }

  correspondencia = /^(.+) na Comunidade HISTORIETAS$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} in the HISTORIETAS Community${fim}`
      : `${inicio}${correspondencia[1]} en la Comunidad HISTORIETAS${fim}`;
  }

  correspondencia = /^Você começou a seguir (.+)\.$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}You started following ${correspondencia[1]}.${fim}`
      : `${inicio}Empezaste a seguir a ${correspondencia[1]}.${fim}`;
  }

  correspondencia = /^Você deixou de seguir (.+)\.$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}You unfollowed ${correspondencia[1]}.${fim}`
      : `${inicio}Dejaste de seguir a ${correspondencia[1]}.${fim}`;
  }

  correspondencia = /^(.+) curtiu sua publicação\.$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} liked your post.${fim}`
      : `${inicio}A ${correspondencia[1]} le gustó tu publicación.${fim}`;
  }

  correspondencia = /^(.+) comentou na sua publicação\.$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} commented on your post.${fim}`
      : `${inicio}${correspondencia[1]} comentó en tu publicación.${fim}`;
  }

  correspondencia = /^(.+) curtiu seu comentário na Comunidade\.$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} liked your comment in the Community.${fim}`
      : `${inicio}A ${correspondencia[1]} le gustó tu comentario en la Comunidad.${fim}`;
  }

  return texto;
}
