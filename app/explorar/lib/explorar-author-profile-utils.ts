import { supabase } from "../../../lib/supabase/client";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import type { HistorietasLanguage } from "../../../lib/i18n";
import {
  obterLocaleExplorar,
  traduzirGeneroExplorar,
  traduzirTextoExplorar,
} from "./explorar-translations";
import type { ObraLocal } from "./explorar-work-normalizers";

export type PerfilExplorarRow = {
  id?: string | null;
  user_id?: string | null;
  nome?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  sobre_bio?: string | null;
};


export type PerfilAutorExplorar = {
  nome: string;
  avatar: string;
  bio: string;
};

export type PerfisAutoresExplorar = Record<string, PerfilAutorExplorar>;

export type AvaliacaoAutorExplorar = {
  media: number;
  total: number;
};

export type AvaliacoesAutoresExplorar = Record<string, AvaliacaoAutorExplorar>;


export function obterNomeProfileExplorar(profile: PerfilExplorarRow) {
  return typeof profile.nome === "string" && profile.nome.trim()
    ? profile.nome.trim()
    : "";
}

export async function carregarNomesProfilesExplorar(userIds: string[]) {
  const idsUnicos = Array.from(
    new Set(userIds.map((id) => id.trim()).filter(Boolean))
  );
  const nomesPorUsuario = new Map<string, string>();

  if (idsUnicos.length === 0) {
    return nomesPorUsuario;
  }

  try {
    const filtroIds = idsUnicos.join(",");
    const { data, error } = await supabase
      .from("profiles_publicos")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .or(`user_id.in.(${filtroIds}),id.in.(${filtroIds})`)
      .limit(Math.max(idsUnicos.length * 2, 1));

    if (error) {
      console.warn("Não consegui carregar profiles no Explorar:", error.message);
      return nomesPorUsuario;
    }

    ((data || []) as PerfilExplorarRow[]).forEach((profile) => {
      const nome = obterNomeProfileExplorar(profile);

      if (!nome) {
        return;
      }

      [profile.user_id, profile.id].forEach((id) => {
        if (typeof id === "string" && id.trim()) {
          nomesPorUsuario.set(id.trim(), nome);
        }
      });
    });
  } catch (error) {
    console.warn("Não consegui acessar profiles no Explorar:", error);
  }

  return nomesPorUsuario;
}

export function aplicarNomesProfilesEmObrasExplorar(
  obrasParaAtualizar: ObraLocal[],
  nomesPorUsuario: Map<string, string>
) {
  if (nomesPorUsuario.size === 0) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    const autorId = obra.autorId?.trim() || "";
    const nomeProfile = autorId ? nomesPorUsuario.get(autorId) || "" : "";

    if (!nomeProfile) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeProfile,
    };
  });
}

export function criarIniciaisAutorExplorar(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "H";
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export function criarBioAutorExplorar(
  nome: string,
  generos: string[],
  idioma: HistorietasLanguage = "pt-BR"
) {
  const generosValidos = generos
    .filter(Boolean)
    .slice(0, 2)
    .map((genero) => traduzirGeneroExplorar(genero, idioma));
  const nomeExibicao =
    nome === "Autor não informado"
      ? traduzirTextoExplorar(nome, idioma)
      : nome;

  if (generosValidos.length === 0) {
    if (idioma === "en") {
      return `${nomeExibicao} publishes stories on Historietas.`;
    }

    if (idioma === "es") {
      return `${nomeExibicao} publica historias en Historietas.`;
    }

    return `${nomeExibicao} publica histórias na Historietas.`;
  }

  const conector = idioma === "en" ? " and " : idioma === "es" ? " y " : " e ";
  const generosTexto = generosValidos.join(conector).toLowerCase();

  if (idioma === "en") {
    return `Author of ${generosTexto} on Historietas.`;
  }

  if (idioma === "es") {
    return `Autor de ${generosTexto} en Historietas.`;
  }

  return `Autor de ${generosTexto} na Historietas.`;
}

export function formatarMediaAvaliacaoAutorExplorar(
  avaliacao: AvaliacaoAutorExplorar | undefined,
  idioma: HistorietasLanguage = "pt-BR"
) {
  if (
    !avaliacao ||
    avaliacao.total <= 0 ||
    !Number.isFinite(avaliacao.media) ||
    avaliacao.media <= 0
  ) {
    return "—";
  }

  return avaliacao.media.toLocaleString(obterLocaleExplorar(idioma), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

export async function carregarPerfisAutoresExplorar(
  userIds: string[]
): Promise<PerfisAutoresExplorar> {
  const idsUnicos = Array.from(
    new Set(userIds.map((id) => id.trim()).filter(Boolean))
  );
  const perfis: PerfisAutoresExplorar = {};

  if (idsUnicos.length === 0) {
    return perfis;
  }

  const linhas: PerfilExplorarRow[] = [];

  try {
    const { data } = await supabase
      .from("profiles_publicos")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .in("user_id", idsUnicos)
      .limit(1000);

    if (Array.isArray(data)) {
      linhas.push(...(data as PerfilExplorarRow[]));
    }
  } catch {
    // Tenta também pela coluna id abaixo.
  }

  try {
    const { data } = await supabase
      .from("profiles_publicos")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .in("id", idsUnicos)
      .limit(1000);

    if (Array.isArray(data)) {
      linhas.push(...(data as PerfilExplorarRow[]));
    }
  } catch {
    // Avatar e bio são complementares; os cards usam fallback.
  }

  linhas.forEach((perfil) => {
    const nome = typeof perfil.nome === "string" ? perfil.nome.trim() : "";
    const avatar =
      typeof perfil.avatar_url === "string" ? perfil.avatar_url.trim() : "";
    const bioBase =
      (typeof perfil.bio === "string" && perfil.bio.trim()) ||
      (typeof perfil.sobre_bio === "string" && perfil.sobre_bio.trim()) ||
      "";
    const perfilNormalizado: PerfilAutorExplorar = {
      nome,
      avatar,
      bio: bioBase.slice(0, 140),
    };

    [perfil.user_id, perfil.id].forEach((id) => {
      const idLimpo = typeof id === "string" ? id.trim() : "";

      if (idLimpo) {
        perfis[idLimpo] = perfilNormalizado;
      }
    });
  });

  return perfis;
}

export async function carregarAvaliacoesAutoresExplorar(
  autorIds: string[]
): Promise<AvaliacoesAutoresExplorar> {
  const idsUnicos = Array.from(
    new Set(autorIds.map((id) => id.trim()).filter(Boolean))
  );
  const resultado: AvaliacoesAutoresExplorar = {};

  if (idsUnicos.length === 0) {
    return resultado;
  }

  try {
    const contrato = await carregarMetricasConteudos({ autorIds: idsUnicos });

    if (!contrato.carregado) {
      return resultado;
    }

    idsUnicos.forEach((autorId) => {
      const avaliacao = contrato.autores.get(autorId)?.avaliacao;

      if (avaliacao && avaliacao.total > 0) {
        resultado[autorId] = {
          media: avaliacao.media,
          total: avaliacao.total,
        };
      }
    });
  } catch {
    // Avaliação é complementar; o card continua com traço.
  }

  return resultado;
}
