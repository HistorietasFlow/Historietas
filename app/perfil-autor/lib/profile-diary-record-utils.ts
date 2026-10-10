import type { DiarioPerfilEstado, VisibilidadeDiarioPerfil } from "../types";
import { pegarTexto } from "./data-normalizers";

export function obterDataRegistroDiario(registro: Record<string, unknown>) {
  return pegarTexto(
    registro.atualizado_em ??
      registro.updated_at ??
      registro.criado_em ??
      registro.created_at,
  );
}

export function obterVisibilidadeRegistroDiario(
  registro: Record<string, unknown>,
  fallback: VisibilidadeDiarioPerfil,
) {
  const visibilidade = pegarTexto(registro.visibilidade, fallback);

  if (
    visibilidade === "publico" ||
    visibilidade === "parcial" ||
    visibilidade === "privado"
  ) {
    return visibilidade;
  }

  return fallback;
}

export function registroDiarioPodeAparecer(
  registro: Record<string, unknown>,
  incluirPrivados: boolean,
  fallback: VisibilidadeDiarioPerfil,
) {
  if (incluirPrivados) {
    return true;
  }

  const visibilidade = obterVisibilidadeRegistroDiario(registro, fallback);

  return visibilidade === "publico" || visibilidade === "parcial";
}

export function criarEstadoDiarioPerfilVazio(): Omit<DiarioPerfilEstado, "carregando"> {
  return {
    lendoAgora: [],
    queroLer: [],
    favoritas: [],
    concluidas: [],
    avaliacoes: [],
    reviews: [],
    atividades: [],
  };
}
