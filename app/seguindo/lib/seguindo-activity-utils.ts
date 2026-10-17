import { criarSlugBase } from "../../../lib/utils";
import { criarHrefPerfilUsuarioSeguindo } from "./seguindo-route-utils";
import {
  obterIdObraRegistro,
  obterTextoRegistro,
} from "./seguindo-record-utils";
import type { RegistroSupabaseGenerico } from "./seguindo-record-utils";

export function obterMetadataAtividadeSeguindo(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {} as RegistroSupabaseGenerico;
  }

  return valor as RegistroSupabaseGenerico;
}

export function obterRotuloAtividadeSeguindo(tipo: string) {
  if (tipo === "leu_capitulo") return "Leitura";
  if (tipo === "comecou_ler") return "Começou";
  if (tipo === "concluiu_obra") return "Concluiu";
  if (tipo === "avaliou_obra") return "Avaliou";
  if (tipo === "favoritou_obra") return "Favoritou";
  if (tipo === "salvou_obra") return "Salvou";
  if (tipo === "publicou_review") return "Review";
  if (tipo === "criou_lista") return "Lista";
  return "Diário";
}

export function montarTextoAtividadeSeguindo({
  tipo,
  tituloObra,
  nota,
}: {
  tipo: string;
  tituloObra: string;
  nota: number;
}) {
  if (tipo === "leu_capitulo") return `leu um capítulo de ${tituloObra}`;
  if (tipo === "comecou_ler") return `começou a ler ${tituloObra}`;
  if (tipo === "concluiu_obra") return `concluiu ${tituloObra}`;

  if (tipo === "avaliou_obra") {
    const notaTexto =
      Number.isFinite(nota) && nota > 0
        ? ` com ${nota.toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          })} estrelas`
        : "";

    return `avaliou ${tituloObra}${notaTexto}`;
  }

  if (tipo === "favoritou_obra") return `favoritou ${tituloObra}`;
  if (tipo === "salvou_obra") return `salvou ${tituloObra}`;
  if (tipo === "publicou_review") {
    return `publicou uma review${tituloObra ? ` sobre ${tituloObra}` : ""}`;
  }
  if (tipo === "criou_lista") return "criou uma lista de leitura";

  return tituloObra
    ? `interagiu com ${tituloObra}`
    : "registrou uma atividade no Diário";
}

export function obterDataRegistroAtividadeSeguindo(
  registro: RegistroSupabaseGenerico,
) {
  return (
    obterTextoRegistro(registro, "criado_em") ||
    obterTextoRegistro(registro, "created_at") ||
    obterTextoRegistro(registro, "atualizado_em") ||
    obterTextoRegistro(registro, "updated_at")
  );
}

export function registroAtividadeSeguindoPodeAparecer(
  registro: RegistroSupabaseGenerico,
  fallback: "publico" | "parcial" | "privado",
) {
  const visibilidade =
    obterTextoRegistro(registro, "visibilidade") || fallback;

  if (
    visibilidade !== "publico" &&
    visibilidade !== "parcial" &&
    visibilidade !== "privado"
  ) {
    return fallback === "publico" || fallback === "parcial";
  }

  return visibilidade === "publico" || visibilidade === "parcial";
}

type UsuarioAtividadeSeguindo = {
  id: string;
  nome: string;
  handle: string;
  avatar: string;
};

export function criarAtividadeSeguindoPorDados({
  id,
  usuario,
  tipo,
  tituloObra,
  nota,
  data,
  href,
}: {
  id: string;
  usuario: UsuarioAtividadeSeguindo;
  tipo: string;
  tituloObra: string;
  nota: number;
  data: string;
  href: string;
}) {
  return {
    id,
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    usuarioHandle: usuario.handle,
    usuarioAvatar: usuario.avatar,
    tipo,
    tipoRotulo: obterRotuloAtividadeSeguindo(tipo),
    titulo: tituloObra,
    descricao: montarTextoAtividadeSeguindo({
      tipo,
      tituloObra,
      nota,
    }),
    data,
    href,
  };
}

type ObraAtividadeSeguindo = {
  id: string;
  titulo: string;
  slug: string;
  link: string;
  criadaEm: string;
};

export function criarAtividadeSeguindoDoDiario({
  registro,
  usuariosPorId,
  obrasPorId,
}: {
  registro: RegistroSupabaseGenerico;
  usuariosPorId: Map<string, UsuarioAtividadeSeguindo>;
  obrasPorId: Map<string, ObraAtividadeSeguindo>;
}) {
  if (!registroAtividadeSeguindoPodeAparecer(registro, "privado")) {
    return null;
  }

  const atividadeId = obterTextoRegistro(registro, "id");
  const usuarioId = obterTextoRegistro(registro, "user_id");
  const usuario = usuariosPorId.get(usuarioId);

  if (!atividadeId || !usuario) {
    return null;
  }

  const metadata = obterMetadataAtividadeSeguindo(registro.metadata);
  const tipo = obterTextoRegistro(registro, "tipo") || "diario";
  const obraId = obterTextoRegistro(registro, "obra_id");
  const obra = obraId ? obrasPorId.get(obraId) || null : null;
  const tituloObra =
    obra?.titulo ||
    obterTextoRegistro(metadata, "obra_titulo") ||
    obterTextoRegistro(metadata, "titulo_obra") ||
    obterTextoRegistro(metadata, "obra_relacionada") ||
    "atividade de leitura";
  const nota = Number(registro.nota ?? metadata.nota ?? metadata.rating ?? 0);
  const postId = obterTextoRegistro(metadata, "post_id");
  const href =
    obra?.link ||
    (obra?.slug
      ? `/obra/${obra.slug}`
      : postId
        ? `/comunidade?post=${encodeURIComponent(postId)}`
        : criarHrefPerfilUsuarioSeguindo(usuario));

  return criarAtividadeSeguindoPorDados({
    id: `diario-${atividadeId}`,
    usuario,
    tipo,
    tituloObra,
    nota,
    data: obterDataRegistroAtividadeSeguindo(registro),
    href,
  });
}

export function criarAtividadeSeguindoDeObra({
  registro,
  usuariosPorId,
  obrasPorId,
  tipo,
  fallbackVisibilidade,
}: {
  registro: RegistroSupabaseGenerico;
  usuariosPorId: Map<string, UsuarioAtividadeSeguindo>;
  obrasPorId: Map<string, ObraAtividadeSeguindo>;
  tipo: "favoritou_obra" | "concluiu_obra" | "avaliou_obra";
  fallbackVisibilidade: "publico" | "parcial" | "privado";
}) {
  if (!registroAtividadeSeguindoPodeAparecer(registro, fallbackVisibilidade)) {
    return null;
  }

  const usuarioId = obterTextoRegistro(registro, "user_id");
  const usuario = usuariosPorId.get(usuarioId);
  const obraId = obterIdObraRegistro(registro);
  const obra = obraId ? obrasPorId.get(obraId) || null : null;

  if (!usuario || !obra) {
    return null;
  }

  const nota = Number(registro.nota ?? registro.rating ?? registro.avaliacao ?? 0);
  const data = obterDataRegistroAtividadeSeguindo(registro) || obra.criadaEm;
  const registroId =
    obterTextoRegistro(registro, "id") || `${usuarioId}-${tipo}-${obraId}`;

  return criarAtividadeSeguindoPorDados({
    id: `${tipo}-${registroId}`,
    usuario,
    tipo,
    tituloObra: obra.titulo,
    nota,
    data,
    href: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
  });
}
