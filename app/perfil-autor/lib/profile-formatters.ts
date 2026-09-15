import type { HistorietasLanguage } from "../../../lib/i18n";
import {
  criarSlugBase,
  idObraSupabaseValido,
  normalizarTexto,
} from "../../../lib/utils";
import { obterLocaleDocumentoPerfilAutor } from "../translations";
import type {
  AbaPerfilAutor,
  AutorPerfil,
  AvaliacaoAutorPublica,
  CapituloLocal,
  DiarioPerfilEstado,
  ObraLocal,
} from "../types";
import type { PermissoesAbasPerfil } from "../../../lib/historietasPrivacy";

export function normalizarAbaPerfilAutor(valor: string | null): AbaPerfilAutor {
  if (
    valor === "obras" ||
    valor === "diario" ||
    valor === "comunidade" ||
    valor === "sobre" ||
    valor === "biblioteca"
  ) {
    return valor;
  }

  return "obras";
}

export function aplicarPermissoesAbasAoDiario(
  diario: Omit<DiarioPerfilEstado, "carregando">,
  permissoes: PermissoesAbasPerfil,
): Omit<DiarioPerfilEstado, "carregando"> {
  return {
    lendoAgora: permissoes.diario ? diario.lendoAgora : [],
    queroLer: permissoes.diario ? diario.queroLer : [],
    favoritas: permissoes.diario ? diario.favoritas : [],
    concluidas: permissoes.diario ? diario.concluidas : [],
    avaliacoes: permissoes.diario ? diario.avaliacoes : [],
    reviews: permissoes.diario ? diario.reviews : [],
    atividades: permissoes.atividades ? diario.atividades : [],
  };
}

export function normalizarNomeAutor(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizarUsernamePerfilAutor(valor: string) {
  return valor
    .trim()
    .replace(/^@+/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/[._]{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 30);
}

export function criarUsernameSugeridoPerfilAutor(
  nomeAutor: string,
  autorId: string,
) {
  const base = normalizarUsernamePerfilAutor(nomeAutor);
  const sufixo = autorId
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toLowerCase();

  if (base) {
    return base;
  }

  return sufixo ? `autor.${sufixo}` : "autor.historietas";
}

export function criarChaveAutorPerfil(autorId: string, nomeAutor: string) {
  return autorId.trim().toLowerCase() || normalizarNomeAutor(nomeAutor);
}

export function criarPerfilAutorHref(autor: string, autorId?: string) {
  const params = new URLSearchParams();
  const autorLimpo = autor.trim();
  const autorIdLimpo = autorId?.trim() || "";

  if (autorLimpo) {
    params.set("autor", autorLimpo);
  }

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
    params.set("userId", autorIdLimpo);
  }

  const query = params.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}

export function criarHrefListaSeguimentoPerfilAutor(
  aba: "seguidores" | "seguindo",
  perfil: Pick<AutorPerfil, "autorId" | "nome"> | null,
) {
  const params = new URLSearchParams();

  params.set("aba", aba);

  if (perfil?.autorId?.trim()) {
    params.set("userId", perfil.autorId.trim());
    params.set("autorId", perfil.autorId.trim());
  }

  if (perfil?.nome?.trim()) {
    params.set("autor", perfil.nome.trim());
  }

  return `/seguindo?${params.toString()}`;
}

export function criarHandlePerfilAutor(
  nomeAutor: string,
  autorId: string,
  username = "",
) {
  const usernameLimpo = normalizarUsernamePerfilAutor(username);

  if (usernameLimpo) {
    return `@${usernameLimpo}`;
  }

  return `@${criarUsernameSugeridoPerfilAutor(nomeAutor, autorId)}`;
}

export function criarHrefLeituraCapituloPerfilAutor(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: Pick<CapituloLocal, "id">,
  numeroCapitulo: number,
) {
  const slugSeguro = obra.slug?.trim() || criarSlugBase(obra.titulo);

  if (
    obra.publicado &&
    idObraSupabaseValido(obra.id) &&
    slugSeguro &&
    Number.isInteger(numeroCapitulo) &&
    numeroCapitulo > 0
  ) {
    return `/obra/${encodeURIComponent(slugSeguro)}/capitulo/${numeroCapitulo}`;
  }

  return `/ler-capitulo?obraId=${encodeURIComponent(
    obra.id,
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}

export function formatarGeneroPerfilAutor(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}

export function formatarFormatoPerfilAutor(formato: string) {
  const formatoLimpo = formato.trim();

  if (
    !formatoLimpo ||
    normalizarTexto(formatoLimpo) === "nao informado" ||
    normalizarTexto(formatoLimpo) === "nao informada"
  ) {
    return "";
  }

  return formatoLimpo;
}

export function obterTagPrincipalPerfilAutor(
  obra: Pick<ObraLocal, "tags" | "genero" | "formato">,
) {
  const generoNormalizado = normalizarTexto(obra.genero);
  const formatoNormalizado = normalizarTexto(obra.formato);

  return (
    (obra.tags || [])
      .map((tag) => tag.trim())
      .find((tag) => {
        const tagNormalizada = normalizarTexto(tag);

        return (
          tag &&
          tagNormalizada !== "sem tags" &&
          tagNormalizada !== generoNormalizado &&
          tagNormalizada !== formatoNormalizado
        );
      }) || ""
  );
}

export function obterTimestampData(dataIso: string) {
  const data = new Date(dataIso).getTime();

  return Number.isNaN(data) ? 0 : data;
}

export function normalizarNumeroPerfilAutor(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return fallback;
}

export function compactarNumeroPerfilAutor(valor: number) {
  const numero = Math.max(0, Math.round(valor));
  const locale = obterLocaleDocumentoPerfilAutor();
  const idiomaIngles = locale.startsWith("en");

  if (numero >= 1000000) {
    return `${(numero / 1000000).toLocaleString(locale, {
      maximumFractionDigits: 1,
    })} ${idiomaIngles ? "M" : "mi"}`;
  }

  if (numero >= 1000) {
    return `${(numero / 1000).toLocaleString(locale, {
      maximumFractionDigits: 1,
    })} ${idiomaIngles ? "K" : "mil"}`;
  }

  return String(numero);
}

export function idAutorSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export function formatarMediaAvaliacaoAutor(media: number) {
  if (!Number.isFinite(media) || media <= 0) {
    return "0";
  }

  const mediaArredondada = Math.round(media * 10) / 10;

  return Number.isInteger(mediaArredondada)
    ? String(mediaArredondada)
    : mediaArredondada.toFixed(1);
}

export function formatarTotalAvaliacoesAutor(
  total: number,
  idioma: HistorietasLanguage,
) {
  const totalSeguro = Math.max(0, Math.trunc(total));

  if (idioma === "en") {
    return totalSeguro === 1
      ? "1 rating"
      : `${totalSeguro || ""} ratings`.trim();
  }

  if (idioma === "es") {
    return totalSeguro === 1
      ? "1 valoración"
      : `${totalSeguro || ""} valoraciones`.trim();
  }

  if (totalSeguro <= 0) {
    return "avaliações";
  }

  return totalSeguro === 1 ? "1 avaliação" : `${totalSeguro} avaliações`;
}

export function formatarTotalAvaliacoesDiario(
  total: number,
  idioma: HistorietasLanguage,
) {
  const totalSeguro = Math.max(0, Math.trunc(total));

  if (idioma === "en") {
    return totalSeguro === 1
      ? "1 Journal rating"
      : `${totalSeguro} Journal ratings`;
  }

  if (idioma === "es") {
    return `${totalSeguro} Val. Diario`;
  }

  return `${totalSeguro} Av. Diário`;
}

export function formatarEntradaHistorietasPerfilAutor(criadoEm: string) {
  const criadoEmLimpo = criadoEm.trim();
  const dataCriacao = new Date(criadoEmLimpo);

  if (!criadoEmLimpo || Number.isNaN(dataCriacao.getTime())) {
    return new Intl.DateTimeFormat(obterLocaleDocumentoPerfilAutor(), {
      month: "long",
      year: "numeric",
    }).format(new Date(2026, 6, 1));
  }

  return new Intl.DateTimeFormat(obterLocaleDocumentoPerfilAutor(), {
    month: "long",
    year: "numeric",
  }).format(dataCriacao);
}

export function obterProximaNotaAvaliacaoAutor(
  estrela: number,
  notaAtual: number,
) {
  const meiaNota = estrela - 0.5;
  const notaNormalizada = Math.round(notaAtual * 2) / 2;

  if (notaNormalizada === meiaNota) {
    return estrela;
  }

  if (notaNormalizada === estrela) {
    return 0;
  }

  return meiaNota;
}

export function obterPreenchimentoEstrelaAutor(
  estrela: number,
  notaAtual: number,
) {
  const notaNormalizada = Math.max(
    0,
    Math.min(5, Math.round(notaAtual * 2) / 2),
  );

  if (notaNormalizada >= estrela) {
    return "100%";
  }

  if (notaNormalizada >= estrela - 0.5) {
    return "50%";
  }

  return "0%";
}

export function calcularProximaAvaliacaoAutor(
  avaliacaoAtual: AvaliacaoAutorPublica,
  novaNota: number,
): AvaliacaoAutorPublica {
  const notaAnterior = avaliacaoAtual.minhaNota;
  const totalAtual = avaliacaoAtual.total;
  const somaAtual = avaliacaoAtual.media * totalAtual;

  if (novaNota <= 0) {
    const totalNovo =
      notaAnterior > 0 ? Math.max(0, totalAtual - 1) : totalAtual;
    const somaNova = notaAnterior > 0 ? somaAtual - notaAnterior : somaAtual;

    return {
      ...avaliacaoAtual,
      media: totalNovo > 0 ? somaNova / totalNovo : 0,
      total: totalNovo,
      minhaNota: 0,
      carregado: true,
      salvando: false,
    };
  }

  const totalNovo = notaAnterior > 0 ? totalAtual : totalAtual + 1;
  const somaNova =
    notaAnterior > 0
      ? somaAtual - notaAnterior + novaNota
      : somaAtual + novaNota;

  return {
    ...avaliacaoAtual,
    media: totalNovo > 0 ? somaNova / totalNovo : 0,
    total: totalNovo,
    minhaNota: novaNota,
    carregado: true,
    salvando: false,
  };
}

export function obterChaveAvaliacaoAutor(
  perfil: Pick<AutorPerfil, "autorId" | "nome">,
) {
  return criarChaveAutorPerfil(perfil.autorId, perfil.nome);
}
