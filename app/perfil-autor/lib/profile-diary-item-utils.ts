import { criarSlugBase } from "../../../lib/utils";
import type { DiarioPerfilItem, ObraLocal } from "../types";
import { pegarTexto } from "./data-normalizers";
import { formatarMediaAvaliacaoAutor } from "./profile-formatters";
import {
  obterDataRegistroDiario,
  obterVisibilidadeRegistroDiario,
} from "./profile-diary-record-utils";

export function criarItemDiarioPerfil(
  tipo: DiarioPerfilItem["tipo"],
  obra: ObraLocal,
  data: string,
  descricao: string,
  complemento: Partial<
    Pick<DiarioPerfilItem, "nota" | "progresso" | "visibilidade">
  > = {},
): DiarioPerfilItem {
  return {
    chave: `${tipo}-${obra.id}-${data || obra.id}`,
    tipo,
    titulo: obra.titulo,
    descricao,
    data,
    obra,
    href: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
    ...complemento,
  };
}

export function obterMetadataDiarioPerfil(registro: Record<string, unknown>) {
  const metadata = registro.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {} as Record<string, unknown>;
  }

  return metadata as Record<string, unknown>;
}

export function obterHrefItemDiarioPerfil(item: DiarioPerfilItem) {
  if (item.href?.trim()) {
    return item.href;
  }

  if (item.obra) {
    return item.obra.link || `/obra/${item.obra.slug || criarSlugBase(item.obra.titulo)}`;
  }

  return "/comunidade";
}

export function criarItemAtividadeDiarioPerfil(
  registro: Record<string, unknown>,
  obrasPorId: Map<string, ObraLocal>,
  obrasPorCapituloId: Map<string, ObraLocal>,
): DiarioPerfilItem | null {
  const tipoAtividade = pegarTexto(registro.tipo);
  const data = obterDataRegistroDiario(registro);
  const metadata = obterMetadataDiarioPerfil(registro);
  const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);
  const postId = pegarTexto(metadata.post_id);
  const texto = pegarTexto(registro.texto);
  const nota = Number(registro.nota);

  const tituloBase =
    obra?.titulo ||
    (tipoAtividade === "publicou_review" ? "Review publicada" : "Atividade do Diário");

  let tipoItem: DiarioPerfilItem["tipo"] = "atividade";
  let descricao = "Atualizou o Diário.";
  const href = obra
    ? obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`
    : postId
      ? `/comunidade?post=${encodeURIComponent(postId)}`
      : "/comunidade";

  if (tipoAtividade === "leu_capitulo") {
    tipoItem = "lendo";
    descricao = "Leu um capítulo.";
  } else if (tipoAtividade === "comecou_ler") {
    tipoItem = "lendo";
    descricao = "Começou a ler esta obra.";
  } else if (tipoAtividade === "concluiu_obra") {
    tipoItem = "concluida";
    descricao = "Concluiu esta obra.";
  } else if (tipoAtividade === "avaliou_obra") {
    tipoItem = "avaliacao";
    descricao = Number.isFinite(nota) && nota > 0
      ? `Avaliou com ${formatarMediaAvaliacaoAutor(nota).replace(".", ",")} estrelas.`
      : "Avaliou esta obra.";
  } else if (tipoAtividade === "favoritou_obra") {
    tipoItem = "favorita";
    descricao = "Favoritou esta obra.";
  } else if (tipoAtividade === "salvou_obra") {
    tipoItem = "quero_ler";
    descricao = "Salvou para acompanhar depois.";
  } else if (tipoAtividade === "publicou_review") {
    tipoItem = "review";
    descricao = texto
      ? `Publicou review: ${texto.slice(0, 90)}${texto.length > 90 ? "..." : ""}`
      : "Publicou uma review.";
  } else if (tipoAtividade === "criou_lista") {
    descricao = "Criou uma lista de leitura.";
  }

  return {
    chave: `atividade-${pegarTexto(registro.id) || tipoAtividade}-${data || tituloBase}`,
    tipo: tipoItem,
    titulo: tituloBase,
    descricao,
    data,
    obra,
    href,
    nota: Number.isFinite(nota) && nota > 0 ? nota : undefined,
    visibilidade: obterVisibilidadeRegistroDiario(
      registro,
      tipoAtividade === "publicou_review" ? "publico" : "privado",
    ),
  };
}

export function montarMapaObrasDiario(obrasDisponiveis: ObraLocal[]) {
  const obrasPorId = new Map<string, ObraLocal>();
  const obrasPorCapituloId = new Map<string, ObraLocal>();

  obrasDisponiveis.forEach((obra) => {
    if (obra.id) {
      obrasPorId.set(obra.id, obra);
    }

    obra.capitulos.forEach((capitulo) => {
      if (capitulo.id) {
        obrasPorCapituloId.set(capitulo.id, obra);
      }
    });
  });

  return { obrasPorId, obrasPorCapituloId };
}

export function obterObraRegistroDiario(
  registro: Record<string, unknown>,
  obrasPorId: Map<string, ObraLocal>,
  obrasPorCapituloId: Map<string, ObraLocal>,
) {
  const obraId = pegarTexto(registro.obra_id ?? registro.obraId);

  if (obraId && obrasPorId.has(obraId)) {
    return obrasPorId.get(obraId) || null;
  }

  const capituloId = pegarTexto(registro.capitulo_id ?? registro.capituloId);

  if (capituloId && obrasPorCapituloId.has(capituloId)) {
    return obrasPorCapituloId.get(capituloId) || null;
  }

  return null;
}
