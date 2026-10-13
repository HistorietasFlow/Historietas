import type { PublicacaoComunidadePerfil } from "../types";
import { pegarTexto } from "./data-normalizers";

export function comunidadeSemPublicacoesRecentesPerfilAutor(
  publicacoesRecentes: PublicacaoComunidadePerfil[],
) {
  return publicacoesRecentes.length === 0;
}


export function obterValoresEstatisticasComunidadePerfilAutor({
  totalPublicacoes,
  totalTeorias,
  totalReviews,
  formatarNumero,
}: {
  totalPublicacoes: number;
  totalTeorias: number;
  totalReviews: number;
  formatarNumero: (valor: number) => string;
}) {
  return {
    publicacoes: formatarNumero(totalPublicacoes),
    teorias: formatarNumero(totalTeorias),
    reviews: formatarNumero(totalReviews),
  };
}


export function obterAriaLabelsEstatisticasComunidadePerfilAutor(
  nomePerfil: string,
) {
  return {
    publicacoes: `Abrir publicações de ${nomePerfil} na comunidade`,
    teorias: `Abrir teorias de ${nomePerfil} na comunidade`,
    reviews: `Abrir reviews de ${nomePerfil} na comunidade`,
  };
}


export function obterTituloComunidadePerfilAutor({
  language,
  nomePerfil,
}: {
  language: string;
  nomePerfil: string;
}) {
  if (language === "en") {
    return `${nomePerfil}'s Community`;
  }

  if (language === "es") {
    return `Comunidad de ${nomePerfil}`;
  }

  return `Comunidade de ${nomePerfil}`;
}


export function obterPaddingInferiorPublicacaoComunidadePerfilAutor(
  podeEditarPerfil: boolean,
) {
  return podeEditarPerfil ? "10px" : "42px";
}


export function obterAvisoComunidadeVaziaPerfilAutor({
  podeEditarPerfil,
  nomePerfil,
}: {
  podeEditarPerfil: boolean;
  nomePerfil: string;
}) {
  return podeEditarPerfil
    ? {
        title: "Sua comunidade ainda está vazia",
        description:
          "Publique avisos, bastidores, teorias e chamadas para aproximar leitores das suas obras.",
      }
    : {
        title: "Nenhuma publicação por aqui ainda",
        description: `Quando ${nomePerfil} publicar posts, teorias ou reviews, eles aparecerão nesta área.`,
      };
}


export function normalizarPublicacaoComunidadePerfil(
  registro: Record<string, unknown>,
): PublicacaoComunidadePerfil | null {
  const id = pegarTexto(registro.id);

  if (!id) {
    return null;
  }

  return {
    id,
    categoria: pegarTexto(registro.categoria, "Geral"),
    tipoPublicacao: pegarTexto(registro.tipo_publicacao, "Discussão"),
    temSpoiler: registro.tem_spoiler === true,
    texto: pegarTexto(registro.texto).slice(0, 700),
    obraRelacionada: pegarTexto(registro.obra_relacionada).slice(0, 120),
    criadoEm: pegarTexto(registro.criado_em),
  };
}

export function criarHrefPublicacaoComunidadePerfil(postId: string) {
  return `/comunidade?post=${encodeURIComponent(postId.trim())}`;
}

export function analisarEnquetePublicacaoComunidadePerfil(
  publicacao: PublicacaoComunidadePerfil,
) {
  const textoOriginal = publicacao.texto
    .replace(/\r\n?/g, "\n")
    .trim();
  const marcadoresOpcoes =
    textoOriginal.match(/op(?:ç|c)[aã]o\s+\d+\s*:/gi) || [];
  const ehEnquete =
    marcadoresOpcoes.length >= 2 ||
    /enquete/i.test(publicacao.tipoPublicacao) ||
    /enquete/i.test(publicacao.categoria) ||
    /^enquete\s*:/i.test(textoOriginal);
  const indicePrimeiraOpcao = textoOriginal.search(
    /op(?:ç|c)[aã]o\s+\d+\s*:/i,
  );
  const perguntaBase =
    indicePrimeiraOpcao >= 0
      ? textoOriginal.slice(0, indicePrimeiraOpcao)
      : textoOriginal.split("\n")[0] || "";
  const pergunta = perguntaBase
    .replace(/^enquete\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    ehEnquete,
    pergunta: pergunta || "Enquete da comunidade",
    totalOpcoes: ehEnquete ? marcadoresOpcoes.length : 0,
  };
}

export function criarResumoPublicacaoComunidadePerfil(
  publicacao: PublicacaoComunidadePerfil,
) {
  if (publicacao.temSpoiler) {
    return "Este post contém spoiler";
  }

  const enquete = analisarEnquetePublicacaoComunidadePerfil(publicacao);

  if (enquete.ehEnquete) {
    return enquete.pergunta;
  }

  const textoLimpo = publicacao.texto.replace(/\s+/g, " ").trim();

  if (!textoLimpo) {
    return "Publicação sem texto.";
  }

  return `${textoLimpo.slice(0, 150)}${textoLimpo.length > 150 ? "..." : ""}`;
}

export function obterDadosPublicacaoRecenteComunidadePerfilAutor(
  publicacao: PublicacaoComunidadePerfil,
) {
  const enquete = analisarEnquetePublicacaoComunidadePerfil(publicacao);

  return {
    href: criarHrefPublicacaoComunidadePerfil(publicacao.id),
    ariaLabel: `Abrir ${publicacao.tipoPublicacao} na Comunidade`,
    resumo: criarResumoPublicacaoComunidadePerfil(publicacao),
    totalOpcoesEnquete: enquete.totalOpcoes,
  };
}


