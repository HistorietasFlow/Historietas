import type { HistorietasLanguage } from "./i18n";

export const AVISOS_CONTEUDO_18 = [
  "violencia_intensa",
  "drogas",
  "linguagem_forte",
  "terror",
  "tema_sexual_nao_explicito",
  "outro_tema_adulto",
] as const;

export type AvisoConteudo18 = (typeof AVISOS_CONTEUDO_18)[number];

const AVISOS_VALIDOS = new Set<string>(AVISOS_CONTEUDO_18);

export type ChaveTextoConteudo18 =
  | "avisosObrigatorios"
  | "descricaoPublicacao"
  | "avisosConteudo"
  | "selecionado"
  | "selecionados";

const TEXTOS_CONTEUDO_18: Record<
  ChaveTextoConteudo18,
  Record<HistorietasLanguage, string>
> = {
  avisosObrigatorios: {
    "pt-BR": "Avisos obrigatórios para 18+",
    en: "Required warnings for 18+",
    es: "Advertencias obligatorias para 18+",
  },
  descricaoPublicacao: {
    "pt-BR":
      "Selecione todos os temas presentes. Pornografia, imagens sexuais explícitas e conteúdo sexual envolvendo menores não são permitidos.",
    en:
      "Select every theme that applies. Pornography, sexually explicit images, and sexual content involving minors are not allowed.",
    es:
      "Selecciona todos los temas presentes. No se permiten pornografía, imágenes sexuales explícitas ni contenido sexual que involucre a menores.",
  },
  avisosConteudo: {
    "pt-BR": "Avisos de conteúdo",
    en: "Content warnings",
    es: "Advertencias de contenido",
  },
  selecionado: {
    "pt-BR": "selecionado",
    en: "selected",
    es: "seleccionado",
  },
  selecionados: {
    "pt-BR": "selecionados",
    en: "selected",
    es: "seleccionados",
  },
};

const CHAVE_CONFIRMACAO_18 = "historietas-acesso-conteudo-18";
const VALIDADE_CONFIRMACAO_MS = 30 * 24 * 60 * 60 * 1000;

const ROTULOS_AVISOS: Record<
  AvisoConteudo18,
  Record<HistorietasLanguage, string>
> = {
  violencia_intensa: {
    "pt-BR": "Violência intensa",
    en: "Intense violence",
    es: "Violencia intensa",
  },
  drogas: {
    "pt-BR": "Drogas ou abuso de substâncias",
    en: "Drugs or substance abuse",
    es: "Drogas o abuso de sustancias",
  },
  linguagem_forte: {
    "pt-BR": "Linguagem forte",
    en: "Strong language",
    es: "Lenguaje fuerte",
  },
  terror: {
    "pt-BR": "Terror ou conteúdo perturbador",
    en: "Horror or disturbing content",
    es: "Terror o contenido perturbador",
  },
  tema_sexual_nao_explicito: {
    "pt-BR": "Tema sexual não explícito entre adultos",
    en: "Non-explicit sexual themes between adults",
    es: "Temas sexuales no explícitos entre adultos",
  },
  outro_tema_adulto: {
    "pt-BR": "Outro tema adulto",
    en: "Other adult theme",
    es: "Otro tema adulto",
  },
};

export function ehClassificacao18(valor: unknown) {
  return typeof valor === "string" && valor.trim() === "18+";
}

export function normalizarAvisosConteudo18(
  valor: unknown,
  classificacaoIndicativa: unknown,
): AvisoConteudo18[] {
  if (!ehClassificacao18(classificacaoIndicativa)) {
    return [];
  }

  const itens = Array.isArray(valor) ? valor : [];
  const avisos = Array.from(
    new Set(
      itens
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item): item is AvisoConteudo18 => AVISOS_VALIDOS.has(item)),
    ),
  );

  return avisos.length > 0 ? avisos : ["outro_tema_adulto"];
}

export function traduzirAvisoConteudo18(
  aviso: AvisoConteudo18,
  language: HistorietasLanguage,
) {
  return ROTULOS_AVISOS[aviso][language] || ROTULOS_AVISOS[aviso]["pt-BR"];
}

export function traduzirTextoConteudo18(
  chave: ChaveTextoConteudo18,
  language: HistorietasLanguage,
) {
  return TEXTOS_CONTEUDO_18[chave][language] || TEXTOS_CONTEUDO_18[chave]["pt-BR"];
}

export function acessoConteudo18Confirmado() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const valor = window.localStorage.getItem(CHAVE_CONFIRMACAO_18);

    if (!valor) {
      return false;
    }

    const registro = JSON.parse(valor) as { confirmadoEm?: unknown };
    const confirmadoEm =
      typeof registro.confirmadoEm === "string"
        ? Date.parse(registro.confirmadoEm)
        : Number.NaN;

    if (!Number.isFinite(confirmadoEm)) {
      window.localStorage.removeItem(CHAVE_CONFIRMACAO_18);
      return false;
    }

    const aindaValido = Date.now() - confirmadoEm <= VALIDADE_CONFIRMACAO_MS;

    if (!aindaValido) {
      window.localStorage.removeItem(CHAVE_CONFIRMACAO_18);
    }

    return aindaValido;
  } catch {
    return false;
  }
}

export function confirmarAcessoConteudo18() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CHAVE_CONFIRMACAO_18,
      JSON.stringify({ confirmadoEm: new Date().toISOString() }),
    );
  } catch {
    // A confirmação continua válida para a sessão atual mesmo sem armazenamento.
  }
}
