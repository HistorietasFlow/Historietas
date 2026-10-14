import type { HistorietasLanguage } from "../../lib/i18n";
import { normalizarTexto } from "../../lib/utils";

export function formatarGeneroHome(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (
    generoNormalizado === "sci-fi" ||
    generoNormalizado === "sci fi" ||
    generoNormalizado === "scifi" ||
    generoNormalizado === "cyberpunk"
  ) {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}

export type HomeMetadataTranslation = {
  en: string;
  es: string;
};

export const HOME_GENRE_TRANSLATIONS: Record<
  string,
  HomeMetadataTranslation
> = {
  fantasia: { en: "Fantasy", es: "Fantasía" },
  terror: { en: "Horror", es: "Terror" },
  ficcao: { en: "Fiction", es: "Ficción" },
  romance: { en: "Romance", es: "Romance" },
  drama: { en: "Drama", es: "Drama" },
  acao: { en: "Action", es: "Acción" },
  misterio: { en: "Mystery", es: "Misterio" },
  suspense: { en: "Thriller", es: "Suspenso" },
  aventura: { en: "Adventure", es: "Aventura" },
  comedia: { en: "Comedy", es: "Comedia" },
};

export const HOME_FORMAT_TRANSLATIONS: Record<
  string,
  HomeMetadataTranslation
> = {
  webnovel: { en: "Web novel", es: "Novela web" },
  "light novel": { en: "Light novel", es: "Novela ligera" },
  romance: { en: "Novel", es: "Novela" },
  conto: { en: "Short story", es: "Cuento" },
  poesia: { en: "Poetry", es: "Poesía" },
  hq: { en: "Comics", es: "Cómic" },
  manga: { en: "Manga", es: "Manga" },
  fanfic: { en: "Fanfiction", es: "Fanfic" },
  historia: { en: "Story", es: "Historia" },
  "leitura online": { en: "Online reading", es: "Lectura en línea" },
};

export function traduzirGeneroHome(
  genero: string,
  idioma: HistorietasLanguage
) {
  const generoFormatado = formatarGeneroHome(genero);

  if (idioma === "pt-BR") {
    return generoFormatado;
  }

  const traducao = HOME_GENRE_TRANSLATIONS[normalizarTexto(generoFormatado)];

  return traducao?.[idioma] || generoFormatado;
}

export function traduzirFormatoHome(
  formato: string,
  idioma: HistorietasLanguage
) {
  const formatoLimpo = formato.trim() || "História";

  if (idioma === "pt-BR") {
    return formatoLimpo;
  }

  const traducao = HOME_FORMAT_TRANSLATIONS[normalizarTexto(formatoLimpo)];

  return traducao?.[idioma] || formatoLimpo;
}

export function traduzirClassificacaoHome(
  classificacao: string,
  idioma: HistorietasLanguage
) {
  const classificacaoLimpa = classificacao.trim() || "Não informada";

  if (idioma === "pt-BR") {
    return classificacaoLimpa;
  }

  const classificacaoNormalizada = normalizarTexto(classificacaoLimpa);

  if (classificacaoNormalizada === "livre") {
    return idioma === "en" ? "All ages" : "Todo público";
  }

  if (classificacaoNormalizada === "leitores") {
    return idioma === "en" ? "Readers" : "Lectores";
  }

  if (
    classificacaoNormalizada === "nao informada" ||
    classificacaoNormalizada === "nao informado"
  ) {
    return idioma === "en" ? "Not provided" : "No informada";
  }

  const faixaEtaria = classificacaoLimpa.match(/^(10|12|14|16|18)(?:\s*anos|\+)?$/i);

  if (faixaEtaria) {
    return `${faixaEtaria[1]}+`;
  }

  return classificacaoLimpa;
}

export function traduzirBioAutorHome(
  bio: string,
  idioma: HistorietasLanguage
) {
  if (idioma === "pt-BR") {
    return bio;
  }

  const correspondencia = bio.match(/^Autor de (.+) na Historietas\.$/i);

  if (!correspondencia) {
    return bio;
  }

  const generoTraduzido = traduzirGeneroHome(correspondencia[1], idioma)
    .toLocaleLowerCase(idioma === "en" ? "en" : "es");

  return idioma === "en"
    ? `Author of ${generoTraduzido} on Historietas.`
    : `Autor de ${generoTraduzido} en Historietas.`;
}
