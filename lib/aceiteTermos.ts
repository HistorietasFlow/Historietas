"use client";

import { supabase } from "./supabase/client";

export const TERMOS_USO_VERSAO_ATUAL = "2026-08-05";
export const DIRETRIZES_COMUNIDADE_VERSAO_ATUAL = "2026-08-05";
export const POLITICA_PRIVACIDADE_VERSAO_ATUAL = "2026-08-05";

export type ResultadoAceiteTermos = {
  aceito: boolean;
  erro: string;
};

function normalizarRedirectTo(valor: string, fallback = "/") {
  const destino = valor.trim();

  if (
    !destino ||
    !destino.startsWith("/") ||
    destino.startsWith("//") ||
    destino.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(destino)
  ) {
    return fallback;
  }

  try {
    const origemInterna = "https://historietas.local";
    const url = new URL(destino, origemInterna);

    if (url.origin !== origemInterna || url.pathname === "/aceitar-termos") {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function criarHrefAceiteTermos(redirectTo: string) {
  const destinoSeguro = normalizarRedirectTo(redirectTo, "/");
  const params = new URLSearchParams({ redirectTo: destinoSeguro });

  return `/aceitar-termos?${params.toString()}`;
}

export function obterRedirectToAceiteTermos(valor: string | null, fallback = "/") {
  return normalizarRedirectTo(valor || "", fallback);
}

export async function verificarAceiteTermosPublicacao(): Promise<ResultadoAceiteTermos> {
  try {
    const { data, error } = await supabase.rpc(
      "status_aceite_termos_publicacao",
    );

    if (error) {
      return {
        aceito: false,
        erro: error.message || "Não foi possível verificar o aceite dos termos.",
      };
    }

    return {
      aceito: data === true,
      erro: "",
    };
  } catch (error) {
    return {
      aceito: false,
      erro:
        error instanceof Error
          ? error.message
          : "Não foi possível verificar o aceite dos termos.",
    };
  }
}

export async function registrarAceiteTermosPublicacao(): Promise<ResultadoAceiteTermos> {
  try {
    const { data, error } = await supabase.rpc(
      "aceitar_termos_publicacao",
      {
        p_termos_versao: TERMOS_USO_VERSAO_ATUAL,
        p_diretrizes_versao: DIRETRIZES_COMUNIDADE_VERSAO_ATUAL,
        p_politica_versao: POLITICA_PRIVACIDADE_VERSAO_ATUAL,
      },
    );

    if (error) {
      return {
        aceito: false,
        erro: error.message || "Não foi possível registrar o aceite.",
      };
    }

    return {
      aceito: data === true,
      erro: data === true ? "" : "O aceite não foi confirmado pelo servidor.",
    };
  } catch (error) {
    return {
      aceito: false,
      erro:
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o aceite.",
    };
  }
}

export function criarMetadataAceiteTermos(aceitoEm = new Date().toISOString()) {
  return {
    termos_uso_versao: TERMOS_USO_VERSAO_ATUAL,
    termos_uso_aceitos_em: aceitoEm,
    diretrizes_comunidade_versao: DIRETRIZES_COMUNIDADE_VERSAO_ATUAL,
    diretrizes_comunidade_aceitas_em: aceitoEm,
    politica_privacidade_versao: POLITICA_PRIVACIDADE_VERSAO_ATUAL,
    politica_privacidade_ciente_em: aceitoEm,
  };
}
